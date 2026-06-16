import { ServiceRecord, Vehicle } from '../data/mockData';

export type ExpenseDateRange = '30-days' | '3-months' | '6-months' | 'this-year' | '12-months' | 'all';
export type ExpenseCategory = 'Maintenance' | 'Repairs' | 'Parts' | 'Tires' | 'Other';

export interface ExpenseRecord extends ServiceRecord {
  vehicleName: string;
  plate: string;
  expenseCategory: ExpenseCategory;
}

export const categoryColors: Record<ExpenseCategory, string> = {
  Maintenance: '#3b82f6',
  Repairs: '#22c55e',
  Parts: '#f97316',
  Tires: '#0ea5e9',
  Other: '#6366f1'
};

export function formatCurrency(value: number) {
  return `₾${Math.round(value).toLocaleString()}`;
}

export function getExpenseCategory(record: ServiceRecord): ExpenseCategory {
  const text = `${record.type} ${record.category}`.toLowerCase();
  if (text.includes('tire')) return 'Tires';
  if (text.includes('brake') || text.includes('repair') || text.includes('engine') || text.includes('transmission')) return 'Repairs';
  if (text.includes('part') || text.includes('battery')) return 'Parts';
  if (text.includes('oil') || text.includes('inspection') || text.includes('maintenance') || text.includes('service')) return 'Maintenance';
  return 'Other';
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function getRangeStart(range: ExpenseDateRange, records: ServiceRecord[] = []) {
  const now = new Date();
  const start = new Date(now);

  if (range === '30-days') start.setDate(now.getDate() - 30);
  if (range === '3-months') start.setMonth(now.getMonth() - 3);
  if (range === '6-months') start.setMonth(now.getMonth() - 6);
  if (range === '12-months') start.setMonth(now.getMonth() - 12);
  if (range === 'this-year') start.setMonth(0, 1);
  if (range === 'all') {
    const dates = records.map((record) => new Date(record.date).getTime()).filter(Boolean);
    return dates.length ? new Date(Math.min(...dates)) : startOfMonth(now);
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

export function toExpenseRecords(records: ServiceRecord[], vehicles: Vehicle[]) {
  return records
    .filter((record) => record.cost > 0)
    .map((record) => {
      const vehicle = vehicles.find((item) => item.id === record.vehicleId);
      if (!vehicle) return null;
      return {
        ...record,
        vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
        plate: vehicle.plate,
        expenseCategory: getExpenseCategory(record)
      };
    })
    .filter((record): record is ExpenseRecord => Boolean(record));
}

export function filterExpenses(records: ExpenseRecord[], vehicleId: string, range: ExpenseDateRange) {
  const rangeStart = getRangeStart(range, records);
  return records.filter((record) => {
    const date = new Date(record.date);
    return (vehicleId === 'all' || record.vehicleId === vehicleId) && date >= rangeStart;
  });
}

export function countMonthsInRange(records: ExpenseRecord[], range: ExpenseDateRange) {
  if (records.length === 0) return 1;
  if (range === '30-days') return 1;
  if (range === '3-months') return 3;
  if (range === '6-months') return 6;
  if (range === '12-months') return 12;
  if (range === 'this-year') return new Date().getMonth() + 1;

  const dates = records.map((record) => startOfMonth(new Date(record.date)).getTime());
  const first = new Date(Math.min(...dates));
  const last = new Date(Math.max(...dates));
  return Math.max(1, (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1);
}

export function buildMonthlySeries(records: ExpenseRecord[], range: ExpenseDateRange, mode: 'amount' | 'count') {
  const now = startOfMonth(new Date());
  const monthsToShow = range === 'all' ? 12 : countMonthsInRange(records, range);
  const start = addMonths(now, -(monthsToShow - 1));
  const buckets = new Map<string, { month: string; amount: number; services: number }>();

  for (let index = 0; index < monthsToShow; index += 1) {
    const date = addMonths(start, index);
    buckets.set(monthKey(date), { month: monthLabel(date), amount: 0, services: 0 });
  }

  records.forEach((record) => {
    const key = monthKey(new Date(record.date));
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.amount += record.cost;
    bucket.services += 1;
  });

  return [...buckets.values()].map((item) => (mode === 'amount' ? { month: item.month, amount: item.amount } : { month: item.month, services: item.services }));
}

export function csvEscape(value: string | number) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
