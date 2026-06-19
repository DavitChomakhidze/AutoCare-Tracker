import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle, Edit2, Trash2, Car } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal, ConfirmModal } from '../components/Modal';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { CompactDropdown } from '../components/CompactDropdown';
import { AppActions, Reminder, Vehicle, vehicleName } from '../data/appTypes';
import { ReminderView, getReminderViews, sortByUrgency } from '../utils/reminders';

const reminderTypeOptions = [
  { value: 'Oil Change', label: 'Oil Change' },
  { value: 'Tire Rotation', label: 'Tire Rotation' },
  { value: 'Brake Inspection', label: 'Brake Inspection' },
  { value: 'Annual Inspection', label: 'Annual Inspection' },
  { value: 'General Maintenance', label: 'General Maintenance' },
  { value: 'Repair Follow-up', label: 'Repair Follow-up' },
  { value: 'Other', label: 'Other' }
];

interface ReminderFormValues {
  vehicleId: string;
  title: string;
  reminderType: string;
  dueDate: string;
  dueMileage: string;
  notes: string;
}

function formValuesFromReminder(reminder: Reminder | null, vehicles: Vehicle[]): ReminderFormValues {
  return {
    vehicleId: reminder?.vehicleId || vehicles[0]?.id || '',
    title: reminder?.title || '',
    reminderType: reminder?.reminderType || 'General Maintenance',
    dueDate: reminder?.dueDate || '',
    dueMileage: reminder?.dueMileage ? String(reminder.dueMileage) : '',
    notes: reminder?.notes || ''
  };
}

function ReminderCard({
  reminder,
  onComplete,
  onEdit,
  onDelete
}: {
  reminder: ReminderView;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
          <Car size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{reminder.title}</h3>
              <p className="text-sm text-muted-foreground">
                {reminder.vehicleName} - {reminder.plate}
              </p>
            </div>
            <Badge variant={reminder.computedStatus === 'due-soon' ? 'due-soon' : reminder.computedStatus}>
              {reminder.computedStatus.replace('-', ' ')}
            </Badge>
          </div>

          <div className="space-y-2">
            {reminder.dueDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due date:</span>
                <span className="font-medium">{reminder.dueDate}</span>
              </div>
            )}
            {reminder.dueMileage && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due mileage:</span>
                <span className="font-medium">{reminder.dueMileage.toLocaleString()} km</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current mileage:</span>
              <span className="font-medium">{reminder.currentMileage.toLocaleString()} km</span>
            </div>
            <div
              className={`p-2 rounded text-sm font-medium ${
                reminder.computedStatus === 'overdue'
                  ? 'bg-danger-50 text-danger-700'
                  : reminder.computedStatus === 'due-soon'
                  ? 'bg-warning-50 text-warning-700'
                  : reminder.computedStatus === 'completed'
                  ? 'bg-success-50 text-success-700'
                  : 'bg-info-50 text-info-700'
              }`}
            >
              {reminder.urgencyText}
            </div>
            {reminder.notes && <p className="text-sm text-muted-foreground">{reminder.notes}</p>}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {reminder.computedStatus !== 'completed' && (
              <Button variant="primary" size="sm" onClick={onComplete}>
                <CheckCircle size={16} />
                Mark complete
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 size={16} />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function EmptySection({ title, action }: { title: string; action?: () => void }) {
  return (
    <Card>
      <div className="text-center py-8">
        <Car size={36} className="mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold mb-2">{title}</h3>
        {action && (
          <Button variant="outline" onClick={action}>
            <Plus size={16} />
            Create reminder
          </Button>
        )}
      </div>
    </Card>
  );
}

export function Reminders({
  actions,
  reminders,
  vehicles,
  initialVehicleId,
  onInitialVehicleHandled
}: {
  actions: AppActions;
  reminders: Reminder[];
  vehicles: Vehicle[];
  initialVehicleId?: string | null;
  onInitialVehicleHandled?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [form, setForm] = useState<ReminderFormValues>(() => formValuesFromReminder(null, vehicles));
  const [errors, setErrors] = useState<Partial<Record<keyof ReminderFormValues | 'due', string>>>({});
  const [completeReminder, setCompleteReminder] = useState<ReminderView | null>(null);
  const [deleteReminder, setDeleteReminder] = useState<ReminderView | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const reminderViews = useMemo(() => getReminderViews(reminders, vehicles), [reminders, vehicles]);
  const overdue = reminderViews.filter((reminder) => reminder.computedStatus === 'overdue').sort(sortByUrgency);
  const dueSoon = reminderViews.filter((reminder) => reminder.computedStatus === 'due-soon').sort(sortByUrgency);
  const later = reminderViews.filter((reminder) => reminder.computedStatus === 'upcoming').sort(sortByUrgency);
  const completed = reminderViews.filter((reminder) => reminder.computedStatus === 'completed');
  const vehicleOptions = vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicleName(vehicle)} (${vehicle.plate})` }));
  const activeCount = overdue.length + dueSoon.length + later.length;

  useEffect(() => {
    if (!initialVehicleId || !vehicles.some((vehicle) => vehicle.id === initialVehicleId)) return;

    setEditingReminder(null);
    setForm({ ...formValuesFromReminder(null, vehicles), vehicleId: initialVehicleId });
    setErrors({});
    setShowForm(true);
    onInitialVehicleHandled?.();
  }, [initialVehicleId, onInitialVehicleHandled, vehicles]);

  const openCreateForm = () => {
    setEditingReminder(null);
    setForm(formValuesFromReminder(null, vehicles));
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (reminder: ReminderView) => {
    const sourceReminder = reminders.find((item) => item.id === reminder.id) || reminder;
    setEditingReminder(sourceReminder);
    setForm(formValuesFromReminder(sourceReminder, vehicles));
    setErrors({});
    setShowForm(true);
  };

  const updateForm = (field: keyof ReminderFormValues, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      delete nextErrors.due;
      return nextErrors;
    });
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ReminderFormValues | 'due', string>> = {};
    const dueMileage = Number(form.dueMileage);

    if (!form.vehicleId) nextErrors.vehicleId = 'Select a vehicle.';
    if (!form.title.trim()) nextErrors.title = 'Enter a reminder title.';
    if (!form.reminderType) nextErrors.reminderType = 'Select a reminder type.';
    if (!form.dueDate && !form.dueMileage.trim()) nextErrors.due = 'Add a due date or due mileage.';
    if (form.dueMileage.trim() && (!Number.isFinite(dueMileage) || dueMileage <= 0)) {
      nextErrors.dueMileage = 'Due mileage must be a positive number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const formValid =
    Boolean(form.vehicleId && form.title.trim() && form.reminderType && (form.dueDate || form.dueMileage.trim())) &&
    (!form.dueMileage.trim() || Number(form.dueMileage) > 0);

  const saveReminder = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    const now = new Date().toISOString();
    const reminder: Reminder = {
      ...(editingReminder || { id: `rem-${Date.now()}`, createdAt: now }),
      vehicleId: form.vehicleId,
      title: form.title.trim(),
      reminderType: form.reminderType,
      dueDate: form.dueDate || undefined,
      dueMileage: form.dueMileage ? Number(form.dueMileage) : undefined,
      notes: form.notes.trim(),
      isCompleted: editingReminder?.isCompleted || false,
      updatedAt: now
    };

    const saved = editingReminder ? await actions.updateReminder(reminder) : await actions.addReminder(reminder);
    if (!saved) {
      actions.toast('error', 'Reminder could not be saved.');
      return;
    }

    setShowForm(false);
    setEditingReminder(null);
    actions.toast('success', editingReminder ? 'Reminder updated.' : 'Reminder created.');
  };

  const renderSection = (title: string, colorClass: string, items: ReminderView[], emptyText: string) => (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 ${colorClass} rounded-full`} />
        {title}
      </h2>
      {items.length === 0 ? (
        <EmptySection title={emptyText} />
      ) : (
        <div className="space-y-4">
          {items.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={() => setCompleteReminder(reminder)}
              onEdit={() => openEditForm(reminder)}
              onDelete={() => setDeleteReminder(reminder)}
            />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Reminders</h1>
          <p className="text-muted-foreground">Manage all your maintenance reminders</p>
        </div>
        <Button onClick={openCreateForm} className="w-full sm:w-auto" disabled={vehicles.length === 0}>
          <Plus size={18} />
          Create reminder
        </Button>
      </div>

      {activeCount === 0 && <EmptySection title="No active reminders exist yet" action={openCreateForm} />}

      {renderSection('Overdue', 'bg-danger-500', overdue, 'No overdue reminders')}
      {renderSection('Due Soon', 'bg-warning-500', dueSoon, 'No due-soon reminders')}
      {renderSection('Later', 'bg-neutral-400', later, 'No later reminders')}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setShowCompleted((current) => !current)}>
          {showCompleted ? 'Hide completed reminders' : `Show completed reminders (${completed.length})`}
        </Button>
      </div>

      {showCompleted && renderSection('Completed', 'bg-success-500', completed, 'No completed reminders')}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingReminder ? 'Edit reminder' : 'Create reminder'}
        size="lg"
        panelClassName="w-[min(95vw,640px)] max-w-[640px] max-h-[90vh]"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" form="reminder-form" disabled={!formValid}>
              Save reminder
            </Button>
          </div>
        }
      >
        <form id="reminder-form" onSubmit={saveReminder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Vehicle <span className="text-destructive">*</span>
            </label>
            <CompactDropdown options={vehicleOptions} value={form.vehicleId} onChange={(value) => updateForm('vehicleId', value)} />
            {errors.vehicleId && <p className="text-sm text-destructive mt-1.5">{errors.vehicleId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Reminder type <span className="text-destructive">*</span>
            </label>
            <CompactDropdown options={reminderTypeOptions} value={form.reminderType} onChange={(value) => updateForm('reminderType', value)} />
            {errors.reminderType && <p className="text-sm text-destructive mt-1.5">{errors.reminderType}</p>}
          </div>

          <Input
            label="Reminder title"
            required
            placeholder="e.g., Engine oil change"
            value={form.title}
            error={errors.title}
            onChange={(event) => updateForm('title', event.target.value)}
          />
          <Input
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(event) => updateForm('dueDate', event.target.value)}
          />
          <Input
            label="Due mileage"
            type="number"
            suffix="km"
            placeholder="282000"
            value={form.dueMileage}
            error={errors.dueMileage || errors.due}
            onChange={(event) => updateForm('dueMileage', event.target.value)}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Notes"
              rows={3}
              placeholder="Optional reminder notes..."
              value={form.notes}
              onChange={(event) => updateForm('notes', event.target.value)}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(completeReminder)}
        onClose={() => setCompleteReminder(null)}
        title="Complete reminder"
        size="lg"
        panelClassName="w-[min(95vw,560px)] max-w-[560px]"
        footer={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
            <Button variant="outline" className="w-full whitespace-nowrap sm:w-auto" onClick={() => setCompleteReminder(null)}>Cancel</Button>
            <Button
              variant="secondary"
              className="w-full whitespace-nowrap"
              onClick={async () => {
                if (completeReminder && (await actions.completeReminder(completeReminder.id))) {
                  actions.toast('success', 'Reminder marked as completed.');
                } else {
                  actions.toast('error', 'Reminder could not be completed.');
                }
                setCompleteReminder(null);
              }}
            >
              Mark completed only
            </Button>
            <Button
              className="w-full whitespace-nowrap"
              onClick={async () => {
                if (completeReminder) await actions.completeReminder(completeReminder.id);
                setCompleteReminder(null);
                actions.navigate('add-service');
              }}
            >
              Add service record
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground">
          Do you want to add a related service record for "{completeReminder?.title}"?
        </p>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteReminder)}
        onClose={() => setDeleteReminder(null)}
        onConfirm={async () => {
          if (!deleteReminder) return;

          const deleted = await actions.deleteReminder(deleteReminder.id);
          setDeleteReminder(null);
          actions.toast(deleted ? 'success' : 'error', deleted ? 'Reminder deleted successfully.' : 'Reminder could not be deleted.');
        }}
        title="Delete reminder?"
        message="Are you sure you want to delete this reminder?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
