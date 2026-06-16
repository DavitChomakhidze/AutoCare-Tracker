import { useMemo, useState } from 'react';
import { CalendarRange, Download, Receipt, TrendingUp, Wrench } from 'lucide-react';
import { AppActions, ServiceRecord, Vehicle, vehicleName } from '../data/mockData';
import { Button } from '../components/Button';
import { Card, StatCard } from '../components/Card';
import { CompactDropdown } from '../components/CompactDropdown';
import { Modal } from '../components/Modal';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { csvEscape, formatCurrency, getExpenseCategory } from '../utils/expenses';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function MonthlyExpenses({
  actions,
  serviceRecords,
  vehicles
}: {
  actions: AppActions;
  serviceRecords: ServiceRecord[];
  vehicles: Vehicle[];
}) {
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [showExport, setShowExport] = useState(false);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      return { value: monthKey(date), label: monthLabel(monthKey(date)) };
    });
  }, []);
  const vehicleOptions = [
    { value: 'all', label: 'All Vehicles' },
    ...vehicles.map((vehicle) => ({ value: vehicle.id, label: vehicleName(vehicle) }))
  ];

  const filteredRecords = serviceRecords.filter((record) => {
    return record.date.startsWith(selectedMonth) && record.cost > 0 && (vehicleFilter === 'all' || record.vehicleId === vehicleFilter);
  });
  const previousMonth = monthKey(new Date(new Date(`${selectedMonth}-01T00:00:00`).getFullYear(), new Date(`${selectedMonth}-01T00:00:00`).getMonth() - 1, 1));
  const previousRecords = serviceRecords.filter((record) => {
    return record.date.startsWith(previousMonth) && record.cost > 0 && (vehicleFilter === 'all' || record.vehicleId === vehicleFilter);
  });
  const total = filteredRecords.reduce((sum, record) => sum + record.cost, 0);
  const previousTotal = previousRecords.reduce((sum, record) => sum + record.cost, 0);
  const change = previousTotal ? Math.round(((total - previousTotal) / previousTotal) * 100) : total > 0 ? 100 : 0;

  const trendData = monthOptions
    .slice(0, 6)
    .reverse()
    .map((option) => ({
      month: new Date(`${option.value}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' }),
      amount: serviceRecords
        .filter((record) => record.date.startsWith(option.value) && record.cost > 0 && (vehicleFilter === 'all' || record.vehicleId === vehicleFilter))
        .reduce((sum, record) => sum + record.cost, 0)
    }));

  const categoryData = Object.entries(
    filteredRecords.reduce<Record<string, number>>((acc, record) => {
      const category = getExpenseCategory(record);
      acc[category] = (acc[category] || 0) + record.cost;
      return acc;
    }, {})
  ).map(([name, value], index) => ({ name, value, color: ['#3b82f6', '#22c55e', '#f97316', '#0ea5e9', '#6366f1'][index] }));

  const exportReport = () => {
    if (filteredRecords.length === 0) {
      actions.toast('warning', 'No monthly expense data available to export.');
      return;
    }

    const rows = [
      ['Date', 'Vehicle', 'Service', 'Workshop', 'Cost'],
      ...filteredRecords.map((record) => [record.date, record.vehicle, record.type, record.workshop, record.cost]),
      ['', '', '', 'Total', total]
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autocare-monthly-expenses-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    actions.toast('success', 'Monthly expense report exported.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Expenses This Month</h1>
          <p className="text-muted-foreground">A focused view of monthly vehicle spending and related services.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <CompactDropdown options={vehicleOptions} value={vehicleFilter} onChange={setVehicleFilter} />
          <CompactDropdown options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} />
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Receipt size={20} />} label={`${monthLabel(selectedMonth)} expenses`} value={formatCurrency(total)} />
        <StatCard icon={<TrendingUp size={20} />} label="Change" value={`${change > 0 ? '+' : ''}${change}%`} trend="Compared with previous month" />
        <StatCard icon={<Wrench size={20} />} label="Service records" value={filteredRecords.length} />
        <StatCard icon={<CalendarRange size={20} />} label="Month" value={new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long' })} trend={String(new Date(`${selectedMonth}-01T00:00:00`).getFullYear())} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-6">Monthly trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe7ee" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: '#fff', border: '1px solid #dbe7ee', borderRadius: '8px' }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {trendData.map((item) => (
                  <Cell key={item.month} fill={item.month === new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' }) ? '#10b981' : '#1687d9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-6">Category split</h2>
          {categoryData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center rounded-lg bg-neutral-50 text-sm text-muted-foreground">No category data for this month.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" innerRadius={60} outerRadius={96} paddingAngle={3}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card padding="none">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold mb-1">{monthLabel(selectedMonth)} service expenses</h2>
          <p className="text-sm text-muted-foreground">Records connected to this month&apos;s spending.</p>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No service expenses match this month and vehicle filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Workshop</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const vehicle = vehicles.find((item) => item.id === record.vehicleId);
                  return (
                    <tr key={record.id} className="border-b border-border hover:bg-accent/50">
                      <td className="py-4 px-4">{record.date}</td>
                      <td className="py-4 px-4">{vehicle ? vehicleName(vehicle) : record.vehicle}</td>
                      <td className="py-4 px-4 font-medium">{record.type}</td>
                      <td className="py-4 px-4">{record.workshop}</td>
                      <td className="py-4 px-4 font-semibold">{formatCurrency(record.cost)}</td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm" onClick={() => actions.navigate('service-history')}>View service</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        title="Export monthly expenses"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowExport(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setShowExport(false);
                exportReport();
              }}
            >
              Export CSV
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Export {monthLabel(selectedMonth)} expenses with related service records, vehicle totals, and category summary.
        </p>
      </Modal>
    </div>
  );
}
