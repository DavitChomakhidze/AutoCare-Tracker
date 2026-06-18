import { useState } from 'react';
import { Car, Wrench, AlertCircle, DollarSign, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AppActions, Reminder, ServiceRecord, UserProfile, Vehicle, vehicleName } from '../data/appTypes';
import { getOverdueReminders, getReminderViews, getUpcomingReminders, sortByUrgency } from '../utils/reminders';
import { formatCurrency } from '../utils/expenses';
import { VehiclePhoto } from '../components/VehiclePhoto';

function validPositiveCost(record: ServiceRecord) {
  return Number.isFinite(record.cost) && record.cost > 0;
}

function monthTotal(records: ServiceRecord[], offset = 0) {
  const currentDate = new Date();
  const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  return records
    .filter((record) => {
      const serviceDate = new Date(record.date);
      return (
        !Number.isNaN(serviceDate.getTime()) &&
        serviceDate.getFullYear() === year &&
        serviceDate.getMonth() === month &&
        validPositiveCost(record)
      );
    })
    .reduce((sum, record) => sum + record.cost, 0);
}

function monthlyExpenseChartData(records: ServiceRecord[]) {
  const currentDate = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const offset = index - 5;
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);

    return {
      month: targetDate.toLocaleDateString('en-US', { month: 'short' }),
      amount: monthTotal(records, offset)
    };
  });
}

function relativeDate(value?: string) {
  if (!value) return 'Recently';
  const diffDays = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function Dashboard({
  actions,
  profile,
  vehicles,
  reminders,
  serviceRecords
}: {
  actions: AppActions;
  profile: UserProfile;
  vehicles: Vehicle[];
  reminders: Reminder[];
  serviceRecords: ServiceRecord[];
}) {
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || '');
  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false);
  const reminderViews = getReminderViews(reminders, vehicles);
  const upcomingCount = getUpcomingReminders(reminders, vehicles).length;
  const overdueCount = getOverdueReminders(reminders, vehicles).length;
  const currentMonthExpense = monthTotal(serviceRecords);
  const previousMonthExpense = monthTotal(serviceRecords, -1);
  const monthlyExpenses = monthlyExpenseChartData(serviceRecords);
  const sixMonthExpenseTotal = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
  const expenseTrend =
    previousMonthExpense === 0 && currentMonthExpense === 0
      ? 'No expenses this month'
      : previousMonthExpense === 0
      ? 'New expenses this month'
      : `${currentMonthExpense >= previousMonthExpense ? '+' : ''}${Math.round(((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100)}% from last month`;
  const dashboardReminders = reminderViews.filter((reminder) => reminder.computedStatus !== 'completed').sort(sortByUrgency).slice(0, 4);
  const overviewVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicle) || vehicles[0];
  if (!overviewVehicle) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <div className="text-center py-12">
            <Car size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-semibold mb-2">No vehicles yet</h1>
            <p className="text-muted-foreground mb-4">Add your first vehicle to start tracking maintenance.</p>
            <Button onClick={() => actions.navigate('vehicles')}>Add vehicle</Button>
          </div>
        </Card>
      </div>
    );
  }
  const overviewReminders = reminderViews.filter((reminder) => reminder.vehicleId === overviewVehicle.id && reminder.computedStatus !== 'completed').sort(sortByUrgency);
  const nextReminder = overviewReminders[0];
  const dueText = nextReminder?.urgencyText || 'No reminder set';
  const progressWidth = overviewVehicle.status === 'needs-attention' ? '82%' : '42%';
  const progressColor = overviewVehicle.status === 'needs-attention' ? 'bg-warning-500' : 'bg-success-500';
  const recentActivity = [
    ...serviceRecords.map((record) => ({
      id: `service-${record.id}`,
      type: 'service',
      title: record.type,
      vehicle: record.vehicle,
      date: relativeDate(record.createdAt || record.date),
      sortDate: new Date(record.createdAt || record.date).getTime(),
      amount: validPositiveCost(record) ? formatCurrency(record.cost) : null
    })),
    ...reminders
      .filter((reminder) => reminder.completedAt)
      .flatMap((reminder) => {
        const reminderVehicle = vehicles.find((vehicle) => vehicle.id === reminder.vehicleId);
        if (!reminderVehicle) return [];
        return [{
          id: `reminder-${reminder.id}`,
          type: 'reminder',
          title: `${reminder.title} completed`,
          vehicle: vehicleName(reminderVehicle),
          date: relativeDate(reminder.completedAt),
          sortDate: new Date(reminder.completedAt || '').getTime(),
          amount: null
        }];
      })
  ].sort((first, second) => second.sortDate - first.sortDate).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Good morning, {profile.name}</h1>
          <p className="text-muted-foreground">Here is an overview of your vehicles</p>
        </div>
        <Button onClick={() => actions.navigate('add-service')} className="w-full sm:w-auto">
          <Wrench size={18} />
          Add service record
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Car size={20} />}
          label="Total vehicles"
          value={vehicles.length}
          trend="View garage"
          onClick={() => actions.navigate('vehicles')}
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Upcoming services"
          value={upcomingCount}
          trend="Next in 18 days"
          onClick={() => actions.navigate('upcoming-services')}
        />
        <StatCard
          icon={<AlertCircle size={20} className="text-danger-500" />}
          label="Overdue services"
          value={overdueCount}
          trend={overdueCount > 0 ? 'Needs attention' : 'No overdue services'}
          onClick={() => actions.navigate('overdue-services')}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="Expenses this month"
          value={formatCurrency(currentMonthExpense)}
          trend={expenseTrend}
          onClick={() => actions.navigate('monthly-expenses')}
        />
      </div>

      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Maintenance Overview</h2>
            <p className="text-sm text-muted-foreground">Current vehicle status</p>
          </div>
          <div className="relative min-w-[240px]">
            <button
              type="button"
              onClick={() => setVehicleMenuOpen((open) => !open)}
              className="w-full h-11 px-4 rounded-[var(--radius-input)] border border-input bg-card/95 shadow-sm shadow-primary-700/5 flex items-center justify-between gap-3 hover:border-primary-500/40 hover:bg-primary-50/30 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
            >
              <span className="text-sm font-medium">
                {overviewVehicle.manufacturer} {overviewVehicle.model}
              </span>
              <ChevronDown
                size={18}
                className={`text-primary-600 transition-transform ${vehicleMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {vehicleMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-full z-30 rounded-[var(--radius-card)] border border-border bg-card/95 backdrop-blur shadow-xl overflow-hidden">
                {vehicles.map((vehicle) => {
                  const isActive = selectedVehicle === vehicle.id;

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => {
                        setSelectedVehicle(vehicle.id);
                        setVehicleMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {vehicle.manufacturer} {vehicle.model}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {vehicle.year} - {vehicle.plate}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <VehiclePhoto vehicle={overviewVehicle} className="h-32 w-full rounded-lg md:w-48" iconSize={64} />

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {overviewVehicle.manufacturer} {overviewVehicle.model}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {overviewVehicle.year} - {overviewVehicle.plate}
                </p>
              </div>
              <Badge variant={overviewVehicle.status}>
                {overviewVehicle.status === 'healthy' ? 'Healthy' : 'Needs attention'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current mileage</p>
                <p className="font-semibold">{overviewVehicle.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last service</p>
                <p className="font-semibold">{overviewVehicle.lastService}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next service</p>
                <p className="font-semibold">{nextReminder?.title || 'No upcoming service'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Due in</p>
                <p className="font-semibold">{dueText}</p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Distance until next service</span>
                <span className="font-medium">{dueText}</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className={`h-full ${progressColor} rounded-full`} style={{ width: progressWidth }} />
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => actions.openVehicleDetails(overviewVehicle.id)}>
              View vehicle details
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Upcoming Reminders</h2>
              <p className="text-sm text-muted-foreground">Next maintenance tasks</p>
            </div>
          </div>

          <div className="space-y-3">
            {dashboardReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{reminder.title}</h3>
                    <Badge variant={reminder.computedStatus === 'due-soon' ? 'due-soon' : reminder.computedStatus}>
                      {reminder.computedStatus.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reminder.vehicleName} - {reminder.plate}
                  </p>
                  <p className="text-sm text-foreground mt-1">{reminder.urgencyText}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const completed = await actions.completeReminder(reminder.id);
                    actions.toast(completed ? 'success' : 'error', completed ? `${reminder.title} marked as completed.` : 'Reminder could not be completed.');
                  }}
                >
                  <CheckCircle size={18} />
                </Button>
              </div>
            ))}
          </div>

          <button
            className="w-full text-center text-sm text-primary hover:underline mt-4"
            onClick={() => actions.navigate('reminders')}
          >
            View all reminders
          </button>
        </Card>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Monthly Expenses</h2>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="amount" fill="#1687d9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 text-center">
            <p className="text-2xl font-semibold">{formatCurrency(sixMonthExpenseTotal)}</p>
            <p className="text-sm text-muted-foreground">Total expenses (6 months)</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-1">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Latest completed actions</p>
        </div>

        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  {activity.type === 'service' ? <Wrench size={20} /> : <Car size={20} />}
                </div>
                <div>
                  <h3 className="font-medium">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">{activity.vehicle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{activity.date}</p>
                {activity.amount && <p className="font-semibold">{activity.amount}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
