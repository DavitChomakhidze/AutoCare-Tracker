import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Input } from './Input';
import { SearchableDropdown } from './SearchableDropdown';
import { YearPicker } from './YearPicker';
import { getManufacturers, getModelsForMake, VehicleMake, VehicleModel } from '../services/vehicleApi';
import { Vehicle } from '../data/appTypes';

export interface VehicleFormValues {
  manufacturerId: string;
  manufacturer: string;
  modelId: string;
  model: string;
  year: string;
  plate: string;
  mileage: string;
  vin: string;
  fuelType: string;
  transmission: string;
  engine: string;
  color: string;
}

interface VehicleFormProps {
  id: string;
  onSubmit: (vehicle: Vehicle) => void;
  onValidityChange?: (isValid: boolean) => void;
  onCancel?: () => void;
  onInvalidSubmit?: () => void;
  initialVehicle?: Vehicle | null;
}

const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'LPG', 'Other'].map((type) => ({
  value: type,
  label: type
}));

const transmissions = ['Automatic', 'Manual', 'CVT'].map((type) => ({ value: type, label: type }));

const colors = ['Black', 'Blue', 'Gray', 'Green', 'Red', 'Silver', 'White', 'Other'].map((color) => ({
  value: color,
  label: color
}));

const initialValues: VehicleFormValues = {
  manufacturerId: '',
  manufacturer: '',
  modelId: '',
  model: '',
  year: '',
  plate: '',
  mileage: '',
  vin: '',
  fuelType: '',
  transmission: '',
  engine: '',
  color: ''
};

function valuesFromVehicle(vehicle: Vehicle): VehicleFormValues {
  return {
    manufacturerId: vehicle.manufacturerId || `existing-make-${vehicle.manufacturer}`,
    manufacturer: vehicle.manufacturer,
    modelId: vehicle.modelId || `existing-model-${vehicle.model}`,
    model: vehicle.model,
    year: String(vehicle.year),
    plate: vehicle.plate,
    mileage: String(vehicle.mileage),
    vin: vehicle.vin,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    engine: vehicle.engine,
    color: vehicle.color
  };
}

function makeVehicle(values: VehicleFormValues, initialVehicle?: Vehicle | null): Vehicle {
  const now = new Date();
  const displayDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const idBase = `${values.manufacturer}-${values.model}-${values.plate}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id: initialVehicle?.id || `${idBase}-${Date.now()}`,
    manufacturerId: values.manufacturerId.startsWith('existing-make-') ? initialVehicle?.manufacturerId : values.manufacturerId,
    modelId: values.modelId.startsWith('existing-model-') ? initialVehicle?.modelId : values.modelId,
    manufacturer: values.manufacturer,
    model: values.model,
    year: Number(values.year),
    plate: values.plate.trim().toUpperCase(),
    mileage: Number(values.mileage),
    vin: values.vin.trim(),
    fuelType: values.fuelType,
    transmission: values.transmission,
    engine: values.engine.trim(),
    color: values.color,
    dateAdded: initialVehicle?.dateAdded || displayDate,
    lastService: initialVehicle?.lastService || 'No service records yet',
    nextReminder: initialVehicle?.nextReminder || 'No reminder set',
    status: initialVehicle?.status || 'healthy'
  };
}

export function VehicleForm({ id, onSubmit, onValidityChange, onInvalidSubmit, initialVehicle = null }: VehicleFormProps) {
  const [values, setValues] = useState<VehicleFormValues>(() => (initialVehicle ? valuesFromVehicle(initialVehicle) : initialValues));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [manufacturers, setManufacturers] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [manufacturerError, setManufacturerError] = useState('');
  const [modelError, setModelError] = useState('');

  const errors = useMemo(() => {
    const nextErrors: Record<string, string> = {};

    if (!values.manufacturerId) nextErrors.manufacturerId = 'Select a manufacturer.';
    if (!values.modelId) nextErrors.modelId = 'Select a model.';
    if (!values.year) nextErrors.year = 'Select a production year.';
    if (!values.plate.trim()) nextErrors.plate = 'Enter the license plate.';
    if (!values.mileage || Number(values.mileage) < 0) nextErrors.mileage = 'Enter the current mileage.';
    if (!values.fuelType) nextErrors.fuelType = 'Select a fuel type.';

    return nextErrors;
  }, [values]);

  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  useEffect(() => {
    setValues(initialVehicle ? valuesFromVehicle(initialVehicle) : initialValues);
    setTouched({});
  }, [initialVehicle]);

  useEffect(() => {
    let active = true;

    setLoadingManufacturers(true);
    getManufacturers()
      .then((items) => {
        if (!active) return;
        setManufacturers(items);
        setManufacturerError('');
      })
      .catch(() => {
        if (!active) return;
        setManufacturerError('Vehicle manufacturers could not be loaded. Please try again later.');
      })
      .finally(() => {
        if (active) setLoadingManufacturers(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!values.manufacturerId || values.manufacturerId.startsWith('existing-make-')) {
      setModels([]);
      return;
    }

    let active = true;
    setLoadingModels(true);
    setModelError('');

    getModelsForMake(values.manufacturerId)
      .then((items) => {
        if (!active) return;
        setModels(items);
      })
      .catch(() => {
        if (!active) return;
        setModels([]);
        setModelError('Models for this manufacturer could not be loaded.');
      })
      .finally(() => {
        if (active) setLoadingModels(false);
      });

    return () => {
      active = false;
    };
  }, [values.manufacturerId]);

  const showError = (field: string) => (touched[field] ? errors[field] : undefined);
  const updateValue = (field: keyof VehicleFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const manufacturerOptions = manufacturers.map((manufacturer) => ({
    value: manufacturer.id,
    label: manufacturer.name
  }));
  if (initialVehicle && values.manufacturerId.startsWith('existing-make-')) {
    manufacturerOptions.unshift({ value: values.manufacturerId, label: initialVehicle.manufacturer });
  }

  const modelOptions = models.map((model) => ({
    value: model.id,
    label: model.name
  }));
  if (initialVehicle && values.modelId.startsWith('existing-model-')) {
    modelOptions.unshift({ value: values.modelId, label: initialVehicle.model });
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({
      manufacturerId: true,
      modelId: true,
      year: true,
      plate: true,
      mileage: true,
      fuelType: true
    });

    if (!isValid) {
      onInvalidSubmit?.();
      return;
    }
    onSubmit(makeVehicle(values, initialVehicle));
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableDropdown
          label="Vehicle manufacturer"
          required
          value={values.manufacturerId}
          options={manufacturerOptions}
          placeholder="Select manufacturer"
          searchPlaceholder="Search manufacturers..."
          loading={loadingManufacturers}
          loadingText="Loading manufacturers..."
          emptyText={manufacturerError || 'No manufacturers found'}
          error={showError('manufacturerId') || manufacturerError}
          onChange={(manufacturerId) => {
            const manufacturer = manufacturers.find((item) => item.id === manufacturerId);
            setValues((current) => ({
              ...current,
              manufacturerId,
              manufacturer: manufacturer?.name || '',
              modelId: '',
              model: ''
            }));
            setTouched((current) => ({ ...current, manufacturerId: true, modelId: false }));
          }}
        />

        <SearchableDropdown
          label="Model"
          required
          value={values.modelId}
          options={modelOptions}
          placeholder={values.manufacturerId ? 'Select model' : 'Select manufacturer first'}
          searchPlaceholder="Search models..."
          loading={loadingModels}
          loadingText="Loading models..."
          emptyText={modelError || 'No models found'}
          disabled={!values.manufacturerId}
          error={showError('modelId') || modelError}
          onChange={(modelId) => {
            const model = models.find((item) => item.id === modelId);
            setValues((current) => ({
              ...current,
              modelId,
              model: model?.name || ''
            }));
            setTouched((current) => ({ ...current, modelId: true }));
          }}
        />

        <YearPicker
          label="Production year"
          required
          value={values.year}
          error={showError('year')}
          onChange={(year) => updateValue('year', year)}
        />

        <Input
          label="License plate"
          required
          placeholder="AA-123-BB"
          value={values.plate}
          error={showError('plate')}
          onChange={(event) => updateValue('plate', event.target.value)}
        />

        <Input
          label="Current mileage"
          type="number"
          suffix="km"
          required
          placeholder="281450"
          helperText="Enter your vehicle's current odometer reading"
          value={values.mileage}
          error={showError('mileage')}
          onChange={(event) => updateValue('mileage', event.target.value)}
        />

        <Input
          label="VIN (optional)"
          placeholder="JF1SF63641H726541"
          value={values.vin}
          onChange={(event) => updateValue('vin', event.target.value)}
        />

        <SearchableDropdown
          label="Fuel type"
          required
          value={values.fuelType}
          options={fuelTypes}
          placeholder="Select fuel type"
          searchPlaceholder="Search fuel types..."
          error={showError('fuelType')}
          onChange={(fuelType) => updateValue('fuelType', fuelType)}
        />

        <SearchableDropdown
          label="Transmission"
          value={values.transmission}
          options={transmissions}
          placeholder="Select transmission"
          searchPlaceholder="Search transmission..."
          onChange={(transmission) => updateValue('transmission', transmission)}
        />

        <Input
          label="Engine size"
          placeholder="e.g., 2.5L"
          value={values.engine}
          onChange={(event) => updateValue('engine', event.target.value)}
        />

        <SearchableDropdown
          label="Color"
          value={values.color}
          options={colors}
          placeholder="Select color"
          searchPlaceholder="Search colors..."
          onChange={(color) => updateValue('color', color)}
        />
      </div>
    </form>
  );
}
