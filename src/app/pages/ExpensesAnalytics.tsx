import { useMemo, useState } from 'react';
import { Car, DollarSign, TrendingUp, Download, Wrench } from 'lucide-react';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { CompactDropdown } from '../components/CompactDropdown';
import { AppActions, ServiceRecord, Vehicle, vehicleName } from '../data/mockData';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ExpenseDateRange,
  categoryColors,
  countMonthsInRange,
  csvEscape,
  filterExpenses,
  formatCurrency,
  toExpenseRecords,
  buildMonthlySeries
} from '../utils/expenses';

const dateRangeOptions: { value: ExpenseDateRange; label: string }[] = [
  { value: '30-days', label: 'Last 30 days' },
  { value: '3-months', label: 'Last 3 months' },
  { value: '6-months', label: 'Last 6 months' },
  { value: 'this-year', label: 'This year' },
  { value: '12-months', label: 'Last 12 months' },
  { value: 'all', label: 'All time' }
];

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[300px] flex items-center justify-center rounded-lg bg-neutral-50 text-sm text-muted-foreground text-center px-4">
      {message}
    </div>
  );
}

const placeholderMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const placeholderBars = [36, 58, 44, 72, 52, 66];
const placeholderCategories = [
  { name: 'Maintenance', width: '72%' },
  { name: 'Repairs', width: '54%' },
  { name: 'Inspection', width: '38%' }
];

function PlaceholderChart({ message }: { message: string }) {
  return (
    <div className="h-[300px] rounded-lg bg-neutral-50 px-5 py-6">
      <div className="h-full flex flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Expense preview</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-end gap-3 h-40 pt-6">
          {placeholderMonths.map((month, index) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-primary-100 border border-primary-500/10"
                style={{ height: `${placeholderBars[index]}%` }}
              />
              <span className="text-xs text-muted-foreground">{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderCategories({ message }: { message: string }) {
  return (
    <div className="h-[300px] rounded-lg bg-neutral-50 px-5 py-6 flex flex-col justify-between">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Category preview</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="space-y-4">
        {placeholderCategories.map((category) => (
          <div key={category.name}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">{category.name}</span>
              <span className="text-sm text-muted-foreground">--</span>
            </div>
            <div className="h-3 rounded-full bg-neutral-200 overflow-hidden">
              <div className="h-full rounded-full bg-success-100 border border-success-500/10" style={{ width: category.width }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpensesAnalytics({
  actions,
  records,
  vehicles
}: {
  actions: AppActions;
  records: ServiceRecord[];
  vehicles: Vehicle[];
}) {
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [dateRange, setDateRange] = useState<ExpenseDateRange>('6-months');

  const vehicleOptions = [
    { value: 'all', label: 'All Vehicles' },
    ...vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicleName(vehicle)} (${vehicle.plate})` }))
  ];

  const allExpenses = useMemo(() => toExpenseRecords(records, vehicles), [records, vehicles]);
  const hasAnyExpenses = allExpenses.length > 0;
  const filteredExpenses = useMemo(
    () => filterExpenses(allExpenses, vehicleFilter, dateRange),
    [allExpenses, dateRange, vehicleFilter]
  );

  const totalExpenses = filteredExpenses.reduce((sum, record) => sum + record.cost, 0);
  const currentYear = new Date().getFullYear();
  const expensesThisYear = filteredExpenses
    .filter((record) => new Date(record.date).getFullYear() === currentYear)
    .reduce((sum, record) => sum + record.cost, 0);
  const averageMonthly = totalExpenses / countMonthsInRange(filteredExpenses, dateRange);
  const highestServiceCost = filteredExpenses.reduce((highest, record) => Math.max(highest, record.cost), 0);

  const monthlyExpenses = buildMonthlySeries(filteredExpenses, dateRange, 'amount');
  const serviceFrequency = buildMonthlySeries(filteredExpenses, dateRange, 'count');
  const categoryData = Object.entries(
    filteredExpenses.reduce<Record<string, number>>((categories, record) => {
      categories[record.expenseCategory] = (categories[record.expenseCategory] || 0) + record.cost;
      return categories;
    }, {})
  ).map(([name, value]) => ({ name, value, color: categoryColors[name as keyof typeof categoryColors] }));

  const vehicleExpenses = vehicles
    .map((vehicle) => {
      const amount = filteredExpenses
        .filter((record) => record.vehicleId === vehicle.id)
        .reduce((sum, record) => sum + record.cost, 0);
      return { id: vehicle.id, name: vehicleName(vehicle), amount };
    })
    .filter((vehicle) => vehicle.amount > 0 && (vehicleFilter === 'all' || vehicle.id === vehicleFilter))
    .sort((first, second) => second.amount - first.amount);
  const maxVehicleExpense = Math.max(...vehicleExpenses.map((vehicle) => vehicle.amount), 0);
  const recentExpenses = [...filteredExpenses]
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 10);

  const exportReport = () => {
    if (filteredExpenses.length === 0) {
      actions.toast('warning', 'No expense data available to export.');
      return;
    }

    const header = ['Date', 'Vehicle', 'License plate', 'Category', 'Service type', 'Description', 'Mileage', 'Service center', 'Cost'];
    const rows = filteredExpenses.map((record) => [
      record.date,
      record.vehicleName,
      record.plate,
      record.expenseCategory,
      record.type,
      record.notes || record.type,
      record.mileage,
      record.workshop,
      record.cost
    ]);
    rows.push(['', '', '', '', '', 'Filtered total expense', '', '', totalExpenses]);

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autocare-expenses-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    actions.toast('success', 'Expense report exported.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Expenses & Analytics</h1>
          <p className="text-muted-foreground">Track and analyze your vehicle expenses</p>
        </div>
        <Button variant="outline" onClick={exportReport} className="w-full sm:w-auto">
          <Download size={18} />
          Export report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-[520px]">
        <CompactDropdown options={vehicleOptions} value={vehicleFilter} onChange={setVehicleFilter} />
        <CompactDropdown options={dateRangeOptions} value={dateRange} onChange={(value) => setDateRange(value as ExpenseDateRange)} />
      </div>

      {!hasAnyExpenses && (
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Wrench size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">{vehicles.length === 0 ? 'Add a vehicle first' : 'No expense records yet'}</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {vehicles.length === 0
                    ? 'Create your first vehicle before logging service costs. Expenses and analytics will start filling in after you add records for that vehicle.'
                    : 'Add a service record with costs and this page will calculate totals, trends, categories, vehicle comparisons, and recent expenses automatically.'}
                </p>
              </div>
            </div>
            <Button onClick={() => actions.navigate(vehicles.length === 0 ? 'vehicles' : 'add-service')} className="w-full md:w-auto">
              {vehicles.length === 0 ? <Car size={18} /> : <Wrench size={18} />}
              {vehicles.length === 0 ? 'Add vehicle' : 'Add service record'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={20} />} label="Total expenses" value={formatCurrency(totalExpenses)} />
        <StatCard icon={<TrendingUp size={20} />} label="Expenses this year" value={formatCurrency(expensesThisYear)} />
        <StatCard icon={<DollarSign size={20} />} label="Average monthly" value={formatCurrency(averageMonthly)} />
        <StatCard icon={<TrendingUp size={20} />} label="Highest service cost" value={formatCurrency(highestServiceCost)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-6">Monthly Expenses</h2>
          {!hasAnyExpenses ? (
            <PlaceholderChart message="Monthly totals will appear here after your first paid service record." />
          ) : filteredExpenses.length === 0 ? (
            <EmptyChart message="No expense data available for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-6">Expense Categories</h2>
          {!hasAnyExpenses ? (
            <PlaceholderCategories message="Costs will be grouped by category once records are added." />
          ) : categoryData.length === 0 ? (
            <EmptyChart message="No category data available for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-6">Expenses by Vehicle</h2>
          {!hasAnyExpenses ? (
            <div className="space-y-4">
              {(vehicles.length ? vehicles.slice(0, 3) : [{ id: 'vehicle', manufacturer: 'Your', model: 'vehicle' } as Vehicle]).map((vehicle, index) => (
                <div key={vehicle.id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{vehicleName(vehicle)}</span>
                    <span className="text-sm text-muted-foreground">--</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-100 rounded-full" style={{ width: `${[64, 48, 34][index] || 40}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : vehicleExpenses.length === 0 ? (
            <EmptyChart message="No vehicle expenses match the selected filters." />
          ) : (
            <div className="space-y-4">
              {vehicleExpenses.map((vehicle) => (
                <div key={vehicle.id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{vehicle.name}</span>
                    <span className="text-sm font-semibold">{formatCurrency(vehicle.amount)}</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${maxVehicleExpense ? (vehicle.amount / maxVehicleExpense) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-6">Service Frequency</h2>
          {!hasAnyExpenses ? (
            <PlaceholderChart message="Service counts will build a trend after you log maintenance." />
          ) : filteredExpenses.length === 0 ? (
            <EmptyChart message="No services match the selected filters." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={serviceFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="services" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
        {!hasAnyExpenses ? (
          <div className="space-y-3">
            {['Oil change', 'Brake service', 'Inspection'].map((item) => (
              <div key={item} className="grid grid-cols-5 gap-4 rounded-lg border border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">--</span>
                <span className="text-muted-foreground">Vehicle</span>
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{item}</span>
                <span className="text-muted-foreground">--</span>
              </div>
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">No expenses match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4">{record.date}</td>
                    <td className="py-3 px-4">{record.vehicleName}</td>
                    <td className="py-3 px-4">{record.expenseCategory}</td>
                    <td className="py-3 px-4">{record.type || record.notes || 'Service expense'}</td>
                    <td className="py-3 px-4 font-semibold">{formatCurrency(record.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
