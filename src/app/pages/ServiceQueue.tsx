import { useMemo, useState } from 'react';
import { AlertCircle, Calendar, Car, CheckCircle, Gauge, Wrench } from 'lucide-react';
import { AppActions, Reminder, Vehicle } from '../data/appTypes';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, StatCard } from '../components/Card';
import { CompactDropdown } from '../components/CompactDropdown';
import { Modal } from '../components/Modal';
import { ReminderView, getOverdueReminders, getUpcomingReminders } from '../utils/reminders';

interface ServiceQueueProps {
  actions: AppActions;
  mode: 'upcoming' | 'overdue';
  reminders: Reminder[];
  vehicles: Vehicle[];
}

function ServiceTaskCard({
  reminder,
  actions,
  onComplete
}: {
  reminder: ReminderView;
  actions: AppActions;
  onComplete: (reminder: ReminderView) => void;
}) {
  return (
    <Card padding="md" hover>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          reminder.computedStatus === 'overdue' ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700'
        }`}>
          {reminder.computedStatus === 'overdue' ? <AlertCircle size={24} /> : <Calendar size={24} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold">{reminder.title}</h3>
              <p className="text-sm text-muted-foreground">{reminder.vehicleName} - {reminder.plate}</p>
            </div>
            <Badge variant={reminder.computedStatus === 'due-soon' ? 'due-soon' : reminder.computedStatus}>
              {reminder.computedStatus.replace('-', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Due</p>
              <p className="font-medium">{reminder.urgencyText}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Current mileage</p>
              <p className="font-medium">{reminder.currentMileage.toLocaleString()} km</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Trigger</p>
              <p className="font-medium">{reminder.dueDate && reminder.dueMileage ? 'Date and mileage' : reminder.dueDate ? 'Date' : 'Mileage'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onComplete(reminder)}>
              <CheckCircle size={16} />
              Mark completed
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.navigate('add-service')}>
              <Wrench size={16} />
              Create service record
            </Button>
            <Button variant="ghost" size="sm" onClick={() => actions.openVehicleDetails(reminder.vehicleId)}>
              View vehicle
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ServiceQueue({ actions, mode, reminders, vehicles }: ServiceQueueProps) {
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [completedReminder, setCompletedReminder] = useState<ReminderView | null>(null);

  const queue = useMemo(() => {
    const source = mode === 'overdue'
      ? getOverdueReminders(reminders, vehicles)
      : getUpcomingReminders(reminders, vehicles);
    return source.filter((reminder) => {
      const vehicleMatches = vehicleFilter === 'all' || reminder.vehicleId === vehicleFilter;
      return vehicleMatches;
    });
  }, [mode, reminders, vehicleFilter, vehicles]);

  const vehicleOptions = [
    { value: 'all', label: 'All Vehicles' },
    ...vehicles.map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.manufacturer} ${vehicle.model}`
    }))
  ];

  const title = mode === 'overdue' ? 'Overdue Services' : 'Upcoming Services';
  const subtitle =
    mode === 'overdue'
      ? 'Maintenance items that need attention now.'
      : 'Scheduled maintenance tasks coming up by date or mileage.';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <CompactDropdown
            options={vehicleOptions}
            value={vehicleFilter}
            onChange={setVehicleFilter}
          />
          <Button onClick={() => actions.navigate('add-service')}>
            <Wrench size={18} />
            Add service record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Car size={20} />} label="Vehicles affected" value={new Set(queue.map((item) => item.vehicleId)).size} />
        <StatCard icon={<Gauge size={20} />} label="Mileage-based" value={mode === 'overdue' ? queue.filter((item) => item.isMileageOverdue).length : queue.filter((item) => item.dueMileage).length} />
        <StatCard icon={<Calendar size={20} />} label="Date-based" value={mode === 'overdue' ? queue.filter((item) => item.isDateOverdue).length : queue.filter((item) => item.dueDate).length} />
      </div>

      {queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map((reminder) => (
            <ServiceTaskCard
              key={reminder.id}
              reminder={reminder}
              actions={actions}
              onComplete={setCompletedReminder}
            />
          ))}
        </div>
      ) : (
        <Card padding="lg">
          <div className="text-center py-10">
            <CheckCircle size={40} className="mx-auto text-success-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">No matching services</h3>
            <p className="text-sm text-muted-foreground">Change the vehicle filter or create a new reminder.</p>
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(completedReminder)}
        onClose={() => setCompletedReminder(null)}
        title="Complete service task"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setCompletedReminder(null)}>Cancel</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (completedReminder && (await actions.completeReminder(completedReminder.id))) {
                  actions.toast('success', 'Service task marked completed.');
                } else {
                  actions.toast('error', 'Service task could not be completed.');
                }
                setCompletedReminder(null);
              }}
            >
              Mark completed only
            </Button>
            <Button
              onClick={async () => {
                if (completedReminder) await actions.completeReminder(completedReminder.id);
                setCompletedReminder(null);
                actions.navigate('add-service');
              }}
            >
              Create service record
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground">
          Do you want to create a service record for "{completedReminder?.title}" too?
        </p>
      </Modal>
    </div>
  );
}
