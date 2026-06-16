import { Reminder, Vehicle } from '../data/appTypes';

export type ReminderStatus = 'overdue' | 'due-soon' | 'upcoming' | 'completed';

export interface ReminderView extends Reminder {
  vehicleName: string;
  plate: string;
  currentMileage: number;
  computedStatus: ReminderStatus;
  urgencyText: string;
  urgencyScore: number;
  isDateOverdue: boolean;
  isMileageOverdue: boolean;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function daysBetween(first: Date, second: Date) {
  return Math.ceil((first.getTime() - second.getTime()) / 86400000);
}

export function getReminderView(reminder: Reminder, vehicle?: Vehicle): ReminderView | null {
  if (!vehicle) return null;

  if (reminder.isCompleted) {
    return {
      ...reminder,
      vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
      plate: vehicle.plate,
      currentMileage: vehicle.mileage,
      computedStatus: 'completed',
      urgencyText: reminder.completedAt ? `Completed on ${reminder.completedAt.slice(0, 10)}` : 'Completed',
      urgencyScore: Number.MAX_SAFE_INTEGER,
      isDateOverdue: false,
      isMileageOverdue: false
    };
  }

  const today = startOfToday();
  const dateDelta = reminder.dueDate ? daysBetween(new Date(reminder.dueDate), today) : null;
  const mileageDelta = reminder.dueMileage ? reminder.dueMileage - vehicle.mileage : null;
  const dateOverdue = dateDelta !== null && dateDelta < 0;
  const mileageOverdue = mileageDelta !== null && mileageDelta <= 0;

  let computedStatus: ReminderStatus = 'upcoming';
  let urgencyText = 'No due trigger set';
  let urgencyScore = Number.MAX_SAFE_INTEGER;

  if (dateOverdue || mileageOverdue) {
    computedStatus = 'overdue';
    const overdueDays = dateDelta !== null && dateDelta < 0 ? Math.abs(dateDelta) : null;
    const overdueKm = mileageDelta !== null && mileageDelta <= 0 ? Math.abs(mileageDelta) : null;

    if (overdueKm !== null && (overdueDays === null || overdueKm <= overdueDays * 100)) {
      urgencyText = `Overdue by ${overdueKm.toLocaleString()} km`;
      urgencyScore = -10000 - overdueKm;
    } else if (overdueDays !== null) {
      urgencyText = `Overdue by ${overdueDays} days`;
      urgencyScore = -1000 - overdueDays;
    }
  } else {
    const dueSoonByDate = dateDelta !== null && dateDelta <= 30;
    const dueSoonByMileage = mileageDelta !== null && mileageDelta <= 1000;
    computedStatus = dueSoonByDate || dueSoonByMileage ? 'due-soon' : 'upcoming';

    if (mileageDelta !== null && (dateDelta === null || mileageDelta <= dateDelta * 100)) {
      urgencyText = `${mileageDelta.toLocaleString()} km remaining`;
      urgencyScore = mileageDelta;
    } else if (dateDelta !== null) {
      urgencyText = `${dateDelta} days remaining`;
      urgencyScore = dateDelta * 100;
    }
  }

  return {
    ...reminder,
    vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
    plate: vehicle.plate,
    currentMileage: vehicle.mileage,
    computedStatus,
    urgencyText,
    urgencyScore,
    isDateOverdue: dateOverdue,
    isMileageOverdue: mileageOverdue
  };
}

export function getReminderViews(reminders: Reminder[], vehicles: Vehicle[]) {
  return reminders
    .map((reminder) => getReminderView(reminder, vehicles.find((vehicle) => vehicle.id === reminder.vehicleId)))
    .filter((reminder): reminder is ReminderView => Boolean(reminder));
}

export function sortByUrgency(first: ReminderView, second: ReminderView) {
  return first.urgencyScore - second.urgencyScore;
}

export function getOverdueReminders(reminders: Reminder[], vehicles: Vehicle[]) {
  return getReminderViews(reminders, vehicles)
    .filter((reminder) => reminder.computedStatus === 'overdue')
    .sort(sortByUrgency);
}

export function getUpcomingReminders(reminders: Reminder[], vehicles: Vehicle[]) {
  return getReminderViews(reminders, vehicles)
    .filter((reminder) => reminder.computedStatus === 'due-soon' || reminder.computedStatus === 'upcoming')
    .sort(sortByUrgency);
}
