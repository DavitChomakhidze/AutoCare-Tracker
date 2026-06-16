import { ServiceRecord } from '../data/appTypes';
import { supabase } from '../lib/supabase';
import { Database, Json } from '../types/database';

type ServiceRecordRow = Database['public']['Tables']['service_records']['Row'];
type ServiceRecordInsert = Database['public']['Tables']['service_records']['Insert'];
type ServiceRecordUpdate = Database['public']['Tables']['service_records']['Update'];
type ServicePart = ServiceRecord['parts'][number];

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
    parts: normalizeParts(row.parts)
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
  return (data || []).map(mapServiceRecord);
}

export async function createServiceRecord(record: ServiceRecord, userId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .insert(serviceRecordPayload(record, userId))
    .select()
    .single();

  if (error) throw error;
  return mapServiceRecord(data);
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
  return mapServiceRecord(data);
}

export async function deleteServiceRecord(serviceId: string, userId: string) {
  const { error } = await supabase.from('service_records').delete().eq('id', serviceId).eq('user_id', userId);
  if (error) throw error;
}
