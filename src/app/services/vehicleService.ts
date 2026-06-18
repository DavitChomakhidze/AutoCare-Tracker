import { Vehicle } from '../data/appTypes';
import { supabase, supabasePublicStorage } from '../lib/supabase';
import { Database } from '../types/database';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];
type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  name?: string;
};

const vehiclePhotoMaxBytes = 5 * 1024 * 1024;
const allowedVehiclePhotoTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const vehiclePhotoExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};

function validateVehiclePhotoFile(file: File) {
  if (!allowedVehiclePhotoTypes.has(file.type)) {
    throw new Error('Vehicle photo must be a PNG, JPG, JPEG, or WEBP image.');
  }

  if (file.size > vehiclePhotoMaxBytes) {
    throw new Error('Vehicle photo must be 5MB or smaller.');
  }
}

function logVehicleServiceError(operation: string, error: unknown) {
  const supabaseError = error as SupabaseErrorLike;
  console.error(`Vehicle service ${operation} failed`, {
    message: supabaseError?.message,
    code: supabaseError?.code,
    details: supabaseError?.details,
    hint: supabaseError?.hint,
    name: supabaseError?.name
  });
}

function toDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateColumn(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function safeStoredPhotoUrl(value?: string | null) {
  if (!value) return null;
  if (/^(blob:|data:)/i.test(value)) return null;
  if (/\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(value)) return null;
  return value;
}

function publicVehiclePhotoUrl(path?: string | null) {
  if (!path) return null;
  const { data } = supabasePublicStorage.storage.from('vehicle-photos').getPublicUrl(path);
  return safeStoredPhotoUrl(data.publicUrl);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function withNetworkRetry<T>(request: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await wait(400 * (attempt + 1));
    }
  }

  throw lastError;
}

export function mapVehicle(row: VehicleRow): Vehicle {
  const photoPath = row.photo_path;
  const photoUrl = safeStoredPhotoUrl(row.photo_url) || publicVehiclePhotoUrl(photoPath);

  return {
    id: row.id,
    manufacturerId: row.manufacturer_id || undefined,
    modelId: row.model_id || undefined,
    manufacturer: row.manufacturer,
    model: row.model,
    year: row.production_year,
    plate: row.license_plate,
    mileage: row.current_mileage,
    vin: row.vin || '',
    fuelType: row.fuel_type,
    transmission: row.transmission || '',
    engine: row.engine_size || '',
    color: row.color || '',
    dateAdded: toDisplayDate(row.date_added),
    lastService: row.last_service,
    nextReminder: row.next_reminder,
    status: row.status,
    photoUrl,
    photoPath
  };
}

function vehiclePayload(vehicle: Vehicle, userId: string): VehicleInsert {
  return {
    user_id: userId,
    manufacturer_id: vehicle.manufacturerId || null,
    model_id: vehicle.modelId || null,
    manufacturer: vehicle.manufacturer,
    model: vehicle.model,
    production_year: vehicle.year,
    license_plate: vehicle.plate,
    current_mileage: vehicle.mileage,
    vin: vehicle.vin || null,
    fuel_type: vehicle.fuelType,
    transmission: vehicle.transmission || null,
    engine_size: vehicle.engine || null,
    color: vehicle.color || null,
    date_added: toDateColumn(vehicle.dateAdded),
    last_service: vehicle.lastService || 'No service records yet',
    next_reminder: vehicle.nextReminder || 'No reminder set',
    status: vehicle.status || 'healthy',
    photo_url: safeStoredPhotoUrl(vehicle.photoUrl),
    photo_path: vehicle.photoPath || null
  };
}

export async function getVehicles(userId: string) {
  const { data, error } = await withNetworkRetry(() =>
    supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );

  if (error) {
    logVehicleServiceError('load', error);
    throw error;
  }
  return (data || []).map(mapVehicle);
}

export async function createVehicle(vehicle: Vehicle, userId: string) {
  const payload = vehiclePayload(vehicle, userId);

  const { data, error } = await withNetworkRetry(() =>
    supabase
      .from('vehicles')
      .insert(payload)
      .select()
      .single()
  );

  if (error) {
    logVehicleServiceError('create', error);
    throw error;
  }
  return mapVehicle(data);
}

export async function updateVehicle(vehicle: Vehicle, userId: string) {
  const payload = vehiclePayload(vehicle, userId) as VehicleUpdate;
  delete payload.user_id;

  const { data, error } = await withNetworkRetry(() =>
    supabase
      .from('vehicles')
      .update(payload)
      .eq('id', vehicle.id)
      .eq('user_id', userId)
      .select()
      .single()
  );

  if (error) {
    logVehicleServiceError('update', error);
    throw error;
  }
  return mapVehicle(data);
}

export async function uploadVehiclePhoto(userId: string, vehicleId: string, file: File) {
  validateVehiclePhotoFile(file);

  const extension = vehiclePhotoExtensions[file.type] || 'jpg';
  const safeVehicleId = vehicleId.replace(/[^a-zA-Z0-9-]/g, '-');
  const path = `${userId}/${safeVehicleId}/vehicle-photo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from('vehicle-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) {
    logVehicleServiceError('photo upload', error);
    throw error;
  }

  return {
    path,
    url: publicVehiclePhotoUrl(path)
  };
}

export async function removeVehiclePhoto(path?: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from('vehicle-photos').remove([path]);
  if (error) {
    logVehicleServiceError('photo remove', error);
    throw error;
  }
}

export async function deleteVehicle(vehicleId: string, userId: string) {
  const { error } = await withNetworkRetry(() => supabase.from('vehicles').delete().eq('id', vehicleId).eq('user_id', userId));
  if (error) {
    logVehicleServiceError('delete', error);
    throw error;
  }
}
