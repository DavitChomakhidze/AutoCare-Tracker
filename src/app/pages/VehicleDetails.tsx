import { useState } from 'react';
import { ArrowLeft, Car, Edit, MoreVertical, Gauge, Calendar, DollarSign, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal, ConfirmModal } from '../components/Modal';
import { AppActions, Reminder, ServiceRecord, Vehicle, money, vehicleName } from '../data/appTypes';
import { getReminderViews, sortByUrgency } from '../utils/reminders';
import { countMonthsInRange, formatCurrency, toExpenseRecords } from '../utils/expenses';
import { VehicleForm } from '../components/VehicleForm';
import { VehiclePhoto } from '../components/VehiclePhoto';

const tabs = ['Overview', 'Service History', 'Reminders', 'Expenses'];

function serviceDateTime(record: ServiceRecord) {
  return new Date(record.date).getTime() || 0;
}

export function VehicleDetails({
  actions,
  vehicleId,
  records,
  vehicles,
  reminders
}: {
  actions: AppActions;
  vehicleId: string;
  records: ServiceRecord[];
  vehicles: Vehicle[];
  reminders: Reminder[];
}) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showEdit, setShowEdit] = useState(false);
  const [editFormValid, setEditFormValid] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return (
      <Card>
        <div className="text-center py-12">
          <Car size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-semibold mb-2">Vehicle not found</h1>
          <Button onClick={() => actions.navigate('vehicles')}>Back to vehicles</Button>
        </div>
      </Card>
    );
  }
  const serviceHistory = records
    .filter((record) => record.vehicleId === vehicle.id)
    .sort((firstRecord, secondRecord) => serviceDateTime(secondRecord) - serviceDateTime(firstRecord));
  const latestService = serviceHistory[0];
  const vehicleReminders = getReminderViews(
    reminders.filter((reminder) => reminder.vehicleId === vehicle.id),
    [vehicle]
  ).sort(sortByUrgency);
  const activeVehicleReminders = vehicleReminders.filter((reminder) => reminder.computedStatus !== 'completed');
  const nextReminder =
    activeVehicleReminders.find((reminder) => reminder.computedStatus === 'overdue') ||
    activeVehicleReminders.find((reminder) => reminder.computedStatus === 'due-soon') ||
    activeVehicleReminders[0];
  const dueText = nextReminder?.urgencyText || 'No reminder set';
  const totalExpense = serviceHistory.reduce((sum, record) => sum + record.cost, 0);
  const vehicleExpenseRecords = toExpenseRecords(serviceHistory, [vehicle]);
  const currentYear = new Date().getFullYear();
  const yearlyExpense = vehicleExpenseRecords
    .filter((record) => new Date(record.date).getFullYear() === currentYear)
    .reduce((sum, record) => sum + record.cost, 0);
  const highestExpense = vehicleExpenseRecords.reduce((highest, record) => Math.max(highest, record.cost), 0);
  const averageMonthly = totalExpense / countMonthsInRange(vehicleExpenseRecords, 'all');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => actions.navigate('vehicles')}
        className="inline-flex items-center gap-2 rounded-[var(--radius-button)] px-2 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <ArrowLeft size={16} />
        Back to My Vehicles
      </button>

      <Card>
        <div className="flex flex-col gap-6 lg:flex-row">
          <VehiclePhoto vehicle={vehicle} className="h-48 w-full rounded-lg lg:w-64" iconSize={96} />

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-semibold mb-2">{vehicleName(vehicle)}</h1>
                <p className="text-muted-foreground">{vehicle.year} - {vehicle.plate}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                  <Edit size={16} />
                  Edit
                </Button>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Badge variant={vehicle.status}>
                {vehicle.status === 'healthy' ? 'Healthy' : 'Needs attention'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current mileage</p>
                <p className="text-lg font-semibold">{vehicle.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fuel type</p>
                <p className="text-lg font-semibold">{vehicle.fuelType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transmission</p>
                <p className="text-lg font-semibold">{vehicle.transmission}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Engine</p>
                <p className="text-lg font-semibold">{vehicle.engine}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="max-w-full overflow-x-auto pb-1">
        <div className="inline-flex min-w-max items-center gap-1 rounded-[var(--radius-card)] border border-border/80 bg-card p-1 shadow-sm shadow-primary-700/5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-9 shrink-0 rounded-[var(--radius-button)] px-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                activeTab === tab
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-foreground hover:bg-card/80 hover:text-primary-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Key Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">VIN</span>
                <span className="font-medium">{vehicle.vin}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Color</span>
                <span className="font-medium">{vehicle.color}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Date added</span>
                <span className="font-medium">{vehicle.dateAdded}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Maintenance Status</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Next service</p>
                <p className="font-semibold mb-1">{nextReminder?.title || 'No upcoming service'}</p>
                <div className="flex items-center gap-2 text-sm">
                  {nextReminder && (
                    <Badge variant={nextReminder.computedStatus === 'due-soon' ? 'due-soon' : nextReminder.computedStatus}>
                      {nextReminder.computedStatus.replace('-', ' ')}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">{dueText}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Distance remaining</span>
                  <span className="font-medium">{dueText}</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${vehicle.status === 'healthy' ? 'bg-success-500' : 'bg-warning-500'} rounded-full`}
                    style={{ width: vehicle.status === 'healthy' ? '42%' : '80%' }}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => actions.createReminderForVehicle(vehicle.id)}
              >
                Create reminder
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Latest Service</h2>
            {latestService ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service type</span>
                    <span className="font-medium">{latestService.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{latestService.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mileage</span>
                    <span className="font-medium">{latestService.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total cost</span>
                    <span className="font-medium">{money(latestService.cost)}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('Service History')}>
                  View details
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">This vehicle has no service records yet.</p>
                <Button variant="outline" className="w-full" onClick={() => actions.navigate('add-service')}>
                  Add service record
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Expense Snapshot</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total expenses</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalExpense)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">This year</p>
                <p className="text-2xl font-semibold">{formatCurrency(yearlyExpense)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. monthly</p>
                <p className="text-lg font-semibold">{formatCurrency(averageMonthly)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Highest</p>
                <p className="text-lg font-semibold">{formatCurrency(highestExpense)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Service History' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Service History</h2>
            <Button size="sm" onClick={() => actions.navigate('add-service')}>Add service record</Button>
          </div>

          {serviceHistory.length === 0 ? (
            <div className="text-center py-10">
              <Car size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No service records for this vehicle</h3>
              <p className="text-sm text-muted-foreground mb-4">Add a record to track maintenance for {vehicleName(vehicle)}.</p>
              <Button onClick={() => actions.navigate('add-service')}>Add service record</Button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] table-fixed">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[170px]" />
                <col className="w-[140px]" />
                <col className="w-[170px]" />
                <col className="w-[110px]" />
                <col className="w-[130px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mileage</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Workshop</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceHistory.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4">{record.date}</td>
                    <td className="py-3 px-4 font-medium">{record.type}</td>
                    <td className="py-3 px-4">{record.mileage.toLocaleString()} km</td>
                    <td className="py-3 px-4">{record.workshop}</td>
                    <td className="py-3 px-4">{money(record.cost)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={record.status}>
                        {record.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => actions.navigate('service-history')}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      )}

      {activeTab === 'Reminders' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Reminders</h2>
            <Button size="sm" onClick={() => actions.createReminderForVehicle(vehicle.id)}>
              <Plus size={16} />
              Create reminder
            </Button>
          </div>

          {activeVehicleReminders.length === 0 ? (
            <div className="text-center py-10">
              <Calendar size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No active reminders for this vehicle</h3>
              <p className="text-sm text-muted-foreground mb-4">Create a reminder to track upcoming maintenance for {vehicleName(vehicle)}.</p>
              <Button onClick={() => actions.createReminderForVehicle(vehicle.id)}>Create reminder</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeVehicleReminders.map((reminder) => (
                <div key={reminder.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{reminder.title}</h3>
                      <Badge variant={reminder.computedStatus === 'due-soon' ? 'due-soon' : reminder.computedStatus}>
                        {reminder.computedStatus.replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reminder.urgencyText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reminder.dueDate ? `Due ${reminder.dueDate}` : ''}
                      {reminder.dueDate && reminder.dueMileage ? ' - ' : ''}
                      {reminder.dueMileage ? `Due at ${reminder.dueMileage.toLocaleString()} km` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const completed = await actions.completeReminder(reminder.id);
                        actions.toast(completed ? 'success' : 'error', completed ? 'Reminder marked as completed.' : 'Reminder could not be completed.');
                      }}
                    >
                      Complete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => actions.navigate('reminders')}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'Expenses' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <Button size="sm" onClick={() => actions.navigate('add-service')}>Add service record</Button>
          </div>

          {vehicleExpenseRecords.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No expenses for this vehicle</h3>
              <p className="text-sm text-muted-foreground mb-4">Service records with costs will appear here.</p>
              <Button onClick={() => actions.navigate('add-service')}>Add service record</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Workshop</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleExpenseRecords
                    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
                    .map((record) => (
                      <tr key={record.id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4">{record.date}</td>
                        <td className="py-3 px-4">{record.expenseCategory}</td>
                        <td className="py-3 px-4">{record.type}</td>
                        <td className="py-3 px-4">{record.workshop}</td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(record.cost)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit vehicle"
        size="lg"
        panelClassName="w-[min(95vw,640px)] max-w-[640px] min-h-[560px] max-h-[90vh]"
        bodyClassName="overflow-y-auto"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setShowDelete(true)}>Delete vehicle</Button>
            <Button
              type="submit"
              form="vehicle-details-edit-form"
              disabled={!editFormValid}
            >
              Save changes
            </Button>
          </div>
        }
      >
        <VehicleForm
          id="vehicle-details-edit-form"
          initialVehicle={vehicle}
          onValidityChange={setEditFormValid}
          onSubmit={async (updatedVehicle, photoFile, removePhoto) => {
            const updated = await actions.updateVehicle(updatedVehicle, photoFile, removePhoto);
            if (!updated) return;
            actions.toast('success', 'Vehicle changes saved.');
            setShowEdit(false);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          const deleted = await actions.deleteVehicle(vehicle.id);
          setShowDelete(false);
          setShowEdit(false);

          if (deleted) {
            actions.toast('success', 'Vehicle deleted successfully.');
            actions.navigate('vehicles');
            return;
          }

          actions.toast('error', 'Vehicle could not be deleted.');
        }}
        title="Delete vehicle?"
        message="Are you sure you want to delete this vehicle?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
