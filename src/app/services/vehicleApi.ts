export interface VehicleMake {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  name: string;
}

interface VpicMake {
  Make_ID?: number;
  Make_Name?: string;
  MakeId?: number;
  MakeName?: string;
}

interface VpicModel {
  Model_ID: number;
  Model_Name: string;
}

const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const PERSONAL_VEHICLE_TYPES = ['car', 'Multipurpose Passenger Vehicle (MPV)', 'truck'];

let manufacturersCache: VehicleMake[] | null = null;
const modelsCache = new Map<string, VehicleModel[]>();

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((first, second) => first.name.localeCompare(second.name));
}

function getMakeId(make: VpicMake) {
  return make.Make_ID || make.MakeId || 0;
}

function getMakeName(make: VpicMake) {
  return (make.Make_Name || make.MakeName || '').trim();
}

export async function getManufacturers(): Promise<VehicleMake[]> {
  if (manufacturersCache) return manufacturersCache;

  const makeLists = await Promise.all(
    PERSONAL_VEHICLE_TYPES.map(async (vehicleType) => {
      const response = await fetch(`${VPIC_BASE_URL}/GetMakesForVehicleType/${encodeURIComponent(vehicleType)}?format=json`);
      if (!response.ok) {
        throw new Error('Manufacturers could not be loaded.');
      }

      const data = (await response.json()) as { Results?: VpicMake[] };
      return data.Results || [];
    })
  );

  const uniqueMakes = new Map<number, { id: number; name: string }>();
  makeLists.flat().forEach((make) => {
    const makeId = getMakeId(make);
    const makeName = getMakeName(make);
    if (!makeId || !makeName) return;
    uniqueMakes.set(makeId, { id: makeId, name: makeName });
  });

  manufacturersCache = [...uniqueMakes.values()]
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((make) => ({
      id: String(make.id),
      name: make.name
    }));

  return manufacturersCache;
}

export async function getModelsForMake(makeId: string): Promise<VehicleModel[]> {
  if (modelsCache.has(makeId)) return modelsCache.get(makeId) || [];

  const response = await fetch(`${VPIC_BASE_URL}/GetModelsForMakeId/${makeId}?format=json`);
  if (!response.ok) {
    throw new Error('Models could not be loaded.');
  }

  const data = (await response.json()) as { Results?: VpicModel[] };
  const uniqueModels = new Map<string, VehicleModel>();

  (data.Results || []).forEach((model) => {
    const name = model.Model_Name?.trim();
    if (!name) return;
    uniqueModels.set(name.toLowerCase(), {
      id: String(model.Model_ID || name),
      name
    });
  });

  const models = sortByName([...uniqueModels.values()]);
  modelsCache.set(makeId, models);
  return models;
}
