import { ChangeEvent, useEffect, useState } from 'react';
import { Car, Plus, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Checkbox } from '../components/Checkbox';
import { CompactDropdown } from '../components/CompactDropdown';
import { AppActions, Reminder, ServiceRecord, Vehicle, money, vehicleName } from '../data/appTypes';

interface Part {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number | string;
}

const serviceCategories = [
  { value: 'oil', label: 'Oil and filter change', category: 'Maintenance' },
  { value: 'inspection', label: 'Routine inspection', category: 'Inspection' },
  { value: 'engine', label: 'Engine repair', category: 'Repairs' },
  { value: 'transmission', label: 'Transmission service', category: 'Repairs' },
  { value: 'brake', label: 'Brake service', category: 'Repairs' },
  { value: 'suspension', label: 'Suspension repair', category: 'Repairs' },
  { value: 'tire', label: 'Tire service', category: 'Tires' },
  { value: 'battery', label: 'Battery replacement', category: 'Parts' },
  { value: 'cooling', label: 'Cooling system', category: 'Maintenance' },
  { value: 'electrical', label: 'Electrical repair', category: 'Repairs' },
  { value: 'body', label: 'Body repair', category: 'Repairs' },
  { value: 'other', label: 'Other', category: 'Other' }
];
const allowedReceiptTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const receiptMaxBytes = 5 * 1024 * 1024;

const initialForm = {
  vehicleId: 'subaru',
  category: 'oil',
  title: 'Oil and filter change',
  date: new Date().toISOString().slice(0, 10),
  mileage: '281450',
  workshop: '',
  status: 'completed' as ServiceRecord['status'],
  laborCost: '',
  partsCost: '',
  additionalCost: '',
  notes: '',
  reminderTitle: '',
  reminderDueDate: '',
  reminderDueMileage: ''
};

export function AddServiceRecord({
  actions,
  vehicles,
  editingRecord,
  onDone
}: {
  actions: AppActions;
  vehicles: Vehicle[];
  editingRecord?: ServiceRecord | null;
  onDone?: () => void;
}) {
  const [parts, setParts] = useState<Part[]>([]);
  const [createReminder, setCreateReminder] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | 'totalCost', string>>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId) || vehicles[0];
  const selectedCategory = serviceCategories.find((category) => category.value === form.category) || serviceCategories[0];
  const dynamicPartsCost = parts.reduce((sum, part) => sum + (Number(part.quantity) || 0) * (Number(part.unitPrice) || 0), 0);
  const totalCost =
    (Number(form.laborCost) || 0) +
    (Number(form.partsCost) || 0) +
    dynamicPartsCost +
    (Number(form.additionalCost) || 0);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  useEffect(() => {
    if (vehicles.length === 0 || vehicles.some((vehicle) => vehicle.id === form.vehicleId)) return;

    setForm((currentForm) => ({
      ...currentForm,
      vehicleId: vehicles[0].id,
      mileage: String(vehicles[0].mileage)
    }));
  }, [form.vehicleId, vehicles]);

  useEffect(() => {
    if (!editingRecord) return;

    const category = serviceCategories.find((item) => item.category === editingRecord.category || item.label === editingRecord.type) || serviceCategories[0];
    setForm({
      vehicleId: editingRecord.vehicleId,
      category: category.value,
      title: editingRecord.type,
      date: editingRecord.date,
      mileage: String(editingRecord.mileage),
      workshop: editingRecord.workshop,
      status: editingRecord.status,
      laborCost: editingRecord.laborCost ? String(editingRecord.laborCost) : '',
      partsCost: editingRecord.partsCost ? String(editingRecord.partsCost) : '',
      additionalCost: editingRecord.additionalCost ? String(editingRecord.additionalCost) : '',
      notes: editingRecord.notes,
      reminderTitle: '',
      reminderDueDate: '',
      reminderDueMileage: ''
    });
    setParts(editingRecord.parts.map((part, index) => ({ ...part, id: `${editingRecord.id}-part-${index}` })));
    setReceiptFile(null);
    setReceiptPath(editingRecord.receiptPath || null);
    setReceiptUrl(editingRecord.receiptUrl || null);
    setReceiptFileName(editingRecord.receiptFileName || null);
    setCreateReminder(false);
    setErrors({});
  }, [editingRecord]);

  const addPart = () => {
    setParts([
      ...parts,
      {
        id: Date.now().toString(),
        name: '',
        brand: '',
        quantity: 1,
        unitPrice: ''
      }
    ]);
  };

  const removePart = (id: string) => {
    setParts(parts.filter((part) => part.id !== id));
  };

  const resetForm = () => {
    setForm(initialForm);
    setParts([]);
    setReceiptFile(null);
    setReceiptPath(null);
    setReceiptUrl(null);
    setReceiptFileName(null);
    setCreateReminder(false);
    setErrors({});
  };

  const handleReceiptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedReceiptTypes.has(file.type)) {
      event.target.value = '';
      actions.toast('error', 'Receipt must be a PNG, JPG, JPEG, WEBP, or PDF file.');
      return;
    }

    if (file.size > receiptMaxBytes) {
      event.target.value = '';
      actions.toast('error', 'Receipt must be 5MB or smaller.');
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);
    setReceiptPath(null);
    setReceiptUrl(null);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPath(null);
    setReceiptUrl(null);
    setReceiptFileName(null);
  };

  if (vehicles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Add Service Record</h1>
          <p className="text-muted-foreground">Create a vehicle before recording maintenance or expenses</p>
        </div>

        <Card>
          <div className="text-center py-12 px-4">
            <Car size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No vehicles yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Service records must be connected to a vehicle. Add your first vehicle, then you can log maintenance, repairs, parts, and costs.
            </p>
            <Button onClick={() => actions.navigate('vehicles')}>
              <Car size={18} />
              Add vehicle
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof typeof form | 'totalCost', string>> = {};
    const mileage = Number(form.mileage);

    if (!form.vehicleId) nextErrors.vehicleId = 'Select a vehicle.';
    if (!form.category) nextErrors.category = 'Select a service category.';
    if (!form.title.trim()) nextErrors.title = 'Enter a service title.';
    if (!form.date) nextErrors.date = 'Choose the service date.';
    if (!form.mileage.trim()) {
      nextErrors.mileage = 'Enter the vehicle mileage.';
    } else if (!Number.isFinite(mileage) || mileage <= 0) {
      nextErrors.mileage = 'Mileage must be greater than 0.';
    }
    if (!form.status) nextErrors.status = 'Choose a status.';
    if (totalCost <= 0) nextErrors.totalCost = 'Enter at least one cost amount.';

    if (createReminder && !form.reminderDueDate && !form.reminderDueMileage.trim()) {
      nextErrors.reminderTitle = 'Add a due date or due mileage for the reminder.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveRecord = async (stayOnForm = false) => {
    if (!validateForm()) {
      actions.toast('error', 'Please complete the required fields.');
      return;
    }

    if (!selectedVehicle) {
      actions.toast('error', 'Select a vehicle before saving a service record.');
      return;
    }

    const recordId = editingRecord?.id || `srv-${Date.now()}`;
    let nextReceiptPath = receiptPath;
    let nextReceiptUrl = receiptUrl;
    let nextReceiptFileName = receiptFileName;

    if (receiptFile) {
      setUploadingReceipt(true);
      const uploadedReceipt = await actions.uploadServiceReceipt(receiptFile, recordId);
      setUploadingReceipt(false);

      if (!uploadedReceipt) {
        actions.toast('warning', 'Receipt upload failed. Remove the selected receipt to save this record without it, or try saving again.');
        return;
      }

      nextReceiptPath = uploadedReceipt.path;
      nextReceiptUrl = uploadedReceipt.url;
      nextReceiptFileName = uploadedReceipt.fileName;
      setReceiptPath(nextReceiptPath);
      setReceiptUrl(nextReceiptUrl);
      setReceiptFileName(nextReceiptFileName);
      setReceiptFile(null);
    }

    const record: ServiceRecord = {
      id: recordId,
      date: form.date || new Date().toISOString().slice(0, 10),
      vehicleId: selectedVehicle.id,
      vehicle: vehicleName(selectedVehicle),
      plate: selectedVehicle.plate,
      type: form.title.trim(),
      category: selectedCategory.category,
      mileage: Number(form.mileage) || selectedVehicle.mileage,
      workshop: form.workshop.trim() || 'Not specified',
      laborCost: Number(form.laborCost) || 0,
      partsCost: (Number(form.partsCost) || 0) + dynamicPartsCost,
      additionalCost: Number(form.additionalCost) || 0,
      cost: totalCost,
      status: form.status,
      notes: form.notes.trim() || 'No notes added.',
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
      receiptPath: nextReceiptPath,
      receiptUrl: nextReceiptUrl,
      receiptFileName: nextReceiptFileName,
      parts: parts
        .filter((part) => part.name.trim())
        .map((part) => ({
          name: part.name.trim(),
          brand: part.brand.trim(),
          quantity: Number(part.quantity) || 1,
          unitPrice: Number(part.unitPrice) || 0
        }))
    };

    const saved = editingRecord ? await actions.updateService(record) : await actions.addService(record);
    if (!saved) {
      actions.toast('error', 'Service record could not be saved.');
      return;
    }

    if (createReminder) {
      const reminder: Reminder = {
        id: `rem-${Date.now()}`,
        vehicleId: selectedVehicle.id,
        title: form.reminderTitle.trim() || `Next ${form.title.trim()}`,
        reminderType: selectedCategory.label,
        dueDate: form.reminderDueDate || undefined,
        dueMileage: form.reminderDueMileage ? Number(form.reminderDueMileage) : undefined,
        notes: `Created from service record: ${form.title.trim()}`,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await actions.addReminder(reminder);
    }

    actions.toast('success', createReminder ? 'Service record and reminder saved.' : editingRecord ? 'Service record updated successfully.' : 'Service record saved successfully.');

    if (stayOnForm) {
      resetForm();
      return;
    }

    onDone?.();
    actions.navigate('service-history');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">{editingRecord ? 'Edit Service Record' : 'Add Service Record'}</h1>
        <p className="text-muted-foreground">{editingRecord ? 'Update service details and costs' : 'Record a completed or scheduled service'}</p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Select vehicle <span className="text-destructive">*</span>
            </label>
            <CompactDropdown
              options={vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicleName(vehicle)} (${vehicle.plate})`
              }))}
              value={form.vehicleId}
              onChange={(value) => {
                const vehicle = vehicles.find((item) => item.id === value);
                updateForm('vehicleId', value);
                if (vehicle) updateForm('mileage', String(vehicle.mileage));
              }}
            />
            {errors.vehicleId && <p className="text-sm text-destructive mt-1.5">{errors.vehicleId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Service category <span className="text-destructive">*</span>
            </label>
            <CompactDropdown
              options={serviceCategories.map(({ value, label }) => ({ value, label }))}
              value={form.category}
              onChange={(value) => {
                const category = serviceCategories.find((item) => item.value === value);
                updateForm('category', value);
                if (category) updateForm('title', category.label);
              }}
            />
            {errors.category && <p className="text-sm text-destructive mt-1.5">{errors.category}</p>}
          </div>
          <Input
            label="Service title"
            required
            placeholder="e.g., Annual routine inspection"
            value={form.title}
            error={errors.title}
            onChange={(event) => updateForm('title', event.target.value)}
          />
          <Input
            label="Service date"
            type="date"
            required
            value={form.date}
            error={errors.date}
            onChange={(event) => updateForm('date', event.target.value)}
          />
          <Input
            label="Vehicle mileage"
            type="number"
            suffix="km"
            required
            placeholder="281450"
            value={form.mileage}
            error={errors.mileage}
            onChange={(event) => updateForm('mileage', event.target.value)}
          />
          <Input
            label="Workshop or mechanic"
            placeholder="e.g., AutoService Plus"
            value={form.workshop}
            onChange={(event) => updateForm('workshop', event.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Status <span className="text-destructive">*</span>
            </label>
            <CompactDropdown
              options={[
                { value: 'completed', label: 'Completed' },
                { value: 'scheduled', label: 'Scheduled' }
              ]}
              value={form.status}
              onChange={(value) => updateForm('status', value)}
            />
            {errors.status && <p className="text-sm text-destructive mt-1.5">{errors.status}</p>}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Expense Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Labor cost"
            type="number"
            placeholder="0"
            leftIcon={<span>GEL</span>}
            value={form.laborCost}
            onChange={(event) => updateForm('laborCost', event.target.value)}
          />
          <Input
            label="Parts cost"
            type="number"
            placeholder="0"
            leftIcon={<span>GEL</span>}
            value={form.partsCost}
            onChange={(event) => updateForm('partsCost', event.target.value)}
            helperText={dynamicPartsCost > 0 ? `Parts rows add ${money(dynamicPartsCost)} more` : undefined}
          />
          <Input
            label="Additional cost"
            type="number"
            placeholder="0"
            leftIcon={<span>GEL</span>}
            value={form.additionalCost}
            onChange={(event) => updateForm('additionalCost', event.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Total cost
            </label>
            <div className="h-10 px-3 rounded-[var(--radius-input)] border border-input bg-neutral-100 flex items-center">
              <span className="text-lg font-semibold">{money(totalCost)}</span>
            </div>
            {errors.totalCost && <p className="text-sm text-destructive mt-1.5">{errors.totalCost}</p>}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Parts Used</h2>
          <Button variant="outline" size="sm" onClick={addPart}>
            <Plus size={16} />
            Add part
          </Button>
        </div>

        {parts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No parts added yet</p>
            <p className="text-sm mt-1">Click "Add part" to record replaced parts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part, index) => (
              <div key={part.id} className="flex flex-col gap-3 p-4 border border-border rounded-lg sm:flex-row sm:items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input
                    placeholder="Part name"
                    value={part.name}
                    onChange={(event) => {
                      const newParts = [...parts];
                      newParts[index].name = event.target.value;
                      setParts(newParts);
                    }}
                  />
                  <Input
                    placeholder="Brand (optional)"
                    value={part.brand}
                    onChange={(event) => {
                      const newParts = [...parts];
                      newParts[index].brand = event.target.value;
                      setParts(newParts);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={part.quantity}
                    onChange={(event) => {
                      const newParts = [...parts];
                      newParts[index].quantity = Number(event.target.value);
                      setParts(newParts);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Unit price"
                    leftIcon={<span>GEL</span>}
                    value={part.unitPrice}
                    onFocus={() => {
                      if (part.unitPrice !== 0) return;
                      const newParts = [...parts];
                      newParts[index].unitPrice = '';
                      setParts(newParts);
                    }}
                    onChange={(event) => {
                      const newParts = [...parts];
                      newParts[index].unitPrice = event.target.value;
                      setParts(newParts);
                    }}
                  />
                </div>
                <button
                  onClick={() => removePart(part.id)}
                  className="text-muted-foreground hover:text-destructive mt-2"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Notes and Attachments</h2>
        <div className="space-y-4">
          <Textarea
            label="Notes"
            placeholder="Add any additional notes about this service..."
            rows={4}
            value={form.notes}
            onChange={(event) => updateForm('notes', event.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Receipt or invoice (optional)
            </label>
            <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="sr-only"
                onChange={handleReceiptChange}
              />
              <p className="text-sm text-muted-foreground">Click to upload a receipt or invoice</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP up to 5MB</p>
            </label>
            {receiptFileName && (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{receiptFileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {receiptFile ? 'Selected for upload when you save.' : receiptUrl ? 'Uploaded receipt attached.' : 'Receipt attached.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {receiptUrl && !receiptFile && (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center rounded-[var(--radius-button)] px-3 text-sm font-medium text-primary hover:bg-primary-50"
                    >
                      View
                    </a>
                  )}
                  <Button variant="ghost" size="sm" onClick={removeReceipt}>
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Next Service Reminder</h2>
        <Checkbox
          label="Create a reminder based on this service"
          checked={createReminder}
          onChange={(event) => setCreateReminder(event.target.checked)}
        />

        {createReminder && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            <Input
              label="Reminder title"
              placeholder="e.g., Next oil change"
              value={form.reminderTitle}
              error={errors.reminderTitle}
              onChange={(event) => updateForm('reminderTitle', event.target.value)}
            />
            <Input
              label="Due date"
              type="date"
              value={form.reminderDueDate}
              onChange={(event) => updateForm('reminderDueDate', event.target.value)}
            />
            <Input
              label="Due mileage"
              type="number"
              suffix="km"
              placeholder="290000"
              value={form.reminderDueMileage}
              onChange={(event) => updateForm('reminderDueMileage', event.target.value)}
            />
          </div>
        )}
      </Card>

      <div className="flex flex-col-reverse gap-3 justify-end pb-6 sm:flex-row">
        <Button variant="outline" onClick={() => { onDone?.(); actions.navigate('service-history'); }}>Cancel</Button>
        {!editingRecord && (
          <Button variant="secondary" onClick={() => saveRecord(true)}>
            Save and add another
          </Button>
        )}
        <Button onClick={() => saveRecord(false)} loading={uploadingReceipt}>
          {uploadingReceipt ? 'Uploading receipt...' : editingRecord ? 'Save changes' : 'Save record'}
        </Button>
      </div>
    </div>
  );
}
