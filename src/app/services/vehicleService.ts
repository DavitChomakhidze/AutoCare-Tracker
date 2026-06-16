import { Vehicle } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

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
    status: row.status
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
    status: vehicle.status || 'healthy'
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

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
  return mapVehicle(data);
}

export async function deleteVehicle(vehicleId: string, userId: string) {
  const { error } = await withNetworkRetry(() => supabase.from('vehicles').delete().eq('id', vehicleId).eq('user_id', userId));
  if (error) throw error;
}
