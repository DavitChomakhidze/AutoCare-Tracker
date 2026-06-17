import { ServiceRecord } from '../data/appTypes';
import { supabase } from '../lib/supabase';
import { Database, Json } from '../types/database';

type ServiceRecordRow = Database['public']['Tables']['service_records']['Row'];
type ServiceRecordInsert = Database['public']['Tables']['service_records']['Insert'];
type ServiceRecordUpdate = Database['public']['Tables']['service_records']['Update'];
type ServicePart = ServiceRecord['parts'][number];
const receiptMaxBytes = 5 * 1024 * 1024;
const allowedReceiptTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const receiptExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
};

function validateReceiptFile(file: File) {
  if (!allowedReceiptTypes.has(file.type)) {
    throw new Error('Receipt must be a PNG, JPG, JPEG, WEBP, or PDF file.');
  }

  if (file.size > receiptMaxBytes) {
    throw new Error('Receipt must be 5MB or smaller.');
  }
}

async function signedReceiptUrl(path?: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

function normalizeParts(value: Json): ServicePart[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((part): part is Record<string, Json> => Boolean(part) && typeof part === 'object' && !Array.isArray(part))
    .map((part) => ({
      name: String(part.name || ''),
      brand: String(part.brand || ''),
      quantity: Number(part.quantity) || 1,
      unitPrice: Number(part.unitPrice) || 0
    }));
}

export function mapServiceRecord(row: ServiceRecordRow): ServiceRecord {
  return {
    id: row.id,
    date: row.service_date,
    vehicleId: row.vehicle_id,
    vehicle: row.vehicle_name_snapshot || '',
    plate: row.plate_snapshot || '',
    type: row.service_type,
    category: row.category,
    mileage: row.mileage,
    workshop: row.workshop,
    laborCost: Number(row.labor_cost),
    partsCost: Number(row.parts_cost),
    additionalCost: Number(row.additional_cost),
    cost: Number(row.total_cost),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    receiptPath: row.receipt_path,
    receiptFileName: row.receipt_file_name,
    parts: normalizeParts(row.parts)
  };
}

async function mapServiceRecordWithReceipt(row: ServiceRecordRow): Promise<ServiceRecord> {
  const record = mapServiceRecord(row);
  return {
    ...record,
    receiptUrl: await signedReceiptUrl(record.receiptPath)
  };
}

function serviceRecordPayload(record: ServiceRecord, userId: string): ServiceRecordInsert {
  return {
    user_id: userId,
    vehicle_id: record.vehicleId,
    service_date: record.date,
    vehicle_name_snapshot: record.vehicle,
    plate_snapshot: record.plate,
    service_type: record.type,
    category: record.category,
    mileage: record.mileage,
    workshop: record.workshop || 'Not specified',
    labor_cost: record.laborCost || 0,
    parts_cost: record.partsCost || 0,
    additional_cost: record.additionalCost || 0,
    total_cost: record.cost || 0,
    status: record.status || 'completed',
    notes: record.notes || 'No notes added.',
    receipt_path: record.receiptPath || null,
    receipt_file_name: record.receiptFileName || null,
    parts: record.parts as unknown as Json
  };
}

export async function getServiceRecords(userId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('user_id', userId)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return Promise.all((data || []).map(mapServiceRecordWithReceipt));
}

export async function createServiceRecord(record: ServiceRecord, userId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .insert(serviceRecordPayload(record, userId))
    .select()
    .single();

  if (error) throw error;
  return mapServiceRecordWithReceipt(data);
}

export async function updateServiceRecord(record: ServiceRecord, userId: string) {
  const payload = serviceRecordPayload(record, userId) as ServiceRecordUpdate;
  delete payload.user_id;

  const { data, error } = await supabase
    .from('service_records')
    .update(payload)
    .eq('id', record.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapServiceRecordWithReceipt(data);
}

export async function deleteServiceRecord(serviceId: string, userId: string) {
  const { error } = await supabase.from('service_records').delete().eq('id', serviceId).eq('user_id', userId);
  if (error) throw error;
}

export async function uploadServiceReceipt(userId: string, serviceRecordId: string, file: File) {
  validateReceiptFile(file);

  const extension = receiptExtensions[file.type] || 'pdf';
  const safeRecordId = serviceRecordId.replace(/[^a-zA-Z0-9-]/g, '-');
  const path = `${userId}/${safeRecordId}/receipt-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  return {
    path,
    url: await signedReceiptUrl(path),
    fileName: file.name
  };
}
