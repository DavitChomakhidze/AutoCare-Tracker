import { useState } from 'react';
import { Car, Plus, Search, MoreVertical, Calendar, Gauge, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { Modal, ConfirmModal } from '../components/Modal';
import { VehicleForm } from '../components/VehicleForm';
import { CompactDropdown } from '../components/CompactDropdown';
import { AppActions, Vehicle } from '../data/mockData';

const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'needs-attention', label: 'Needs Attention' },
  { value: 'archived', label: 'Archived' }
];

const sortOptions = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'oldest', label: 'Oldest Added' },
  { value: 'mileage-desc', label: 'Mileage: High to Low' },
  { value: 'mileage-asc', label: 'Mileage: Low to High' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' }
];

export function MyVehicles({ actions, vehicles }: { actions: AppActions; vehicles: Vehicle[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleVehicles = vehicles
    .filter((vehicle) => {
      const searchableText = `${vehicle.manufacturer} ${vehicle.model} ${vehicle.year} ${vehicle.plate}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((firstVehicle, secondVehicle) => {
      const firstName = `${firstVehicle.manufacturer} ${firstVehicle.model}`;
      const secondName = `${secondVehicle.manufacturer} ${secondVehicle.model}`;

      if (sortBy === 'name-asc') {
        return firstName.localeCompare(secondName);
      }
      if (sortBy === 'name-desc') {
        return secondName.localeCompare(firstName);
      }
      if (sortBy === 'mileage-desc') {
        return secondVehicle.mileage - firstVehicle.mileage;
      }
      if (sortBy === 'mileage-asc') {
        return firstVehicle.mileage - secondVehicle.mileage;
      }
      if (sortBy === 'oldest') {
        return vehicles.indexOf(secondVehicle) - vehicles.indexOf(firstVehicle);
      }
      return vehicles.indexOf(firstVehicle) - vehicles.indexOf(secondVehicle);
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">My Vehicles</h1>
          <p className="text-muted-foreground">Manage all your vehicles in one place</p>
        </div>
        <Button
          onClick={() => {
            setEditingVehicle(null);
            setShowVehicleForm(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus size={18} />
          Add vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(280px,1fr)_220px_220px]">
        <div className="min-w-0">
          <Input
            placeholder="Search vehicles..."
            leftIcon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <CompactDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
        <div>
          <CompactDropdown
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleVehicles.map((vehicle) => (
          <Card key={vehicle.id} padding="none" hover className="overflow-hidden">
            <div className="h-40 bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Car size={80} />
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {vehicle.manufacturer} {vehicle.model}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.year} - {vehicle.plate}
                  </p>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => actions.openVehicleDetails(vehicle.id)}
                  aria-label="View vehicle details"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant={vehicle.status}>
                  {vehicle.status === 'healthy' ? 'Healthy' : 'Needs attention'}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <Gauge size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Current mileage:</span>
                  <span className="font-medium ml-auto">
                    {vehicle.mileage.toLocaleString()} km
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs mb-1">Last service</p>
                    <p className="font-medium text-xs">{vehicle.lastService}</p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Next reminder</p>
                  <p className="text-sm font-medium">{vehicle.nextReminder}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => actions.openVehicleDetails(vehicle.id)}>
                View details
              </Button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-500/20 bg-primary-50/60 text-primary-700 hover:bg-primary-100"
                  onClick={() => {
                    setEditingVehicle(vehicle);
                    setShowVehicleForm(true);
                  }}
                >
                  <Edit2 size={15} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-danger-500/20 bg-danger-50 text-danger-700 hover:bg-danger-50 hover:border-danger-500/40"
                  onClick={() => setDeletingVehicle(vehicle)}
                >
                  <Trash2 size={15} />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {visibleVehicles.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try a different search term or clear the status filter.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showVehicleForm}
        onClose={() => {
          setShowVehicleForm(false);
          setEditingVehicle(null);
        }}
        title={editingVehicle ? 'Edit vehicle' : 'Add vehicle'}
        size="lg"
        panelClassName="w-[min(95vw,640px)] max-w-[640px] min-h-[560px] max-h-[90vh]"
        bodyClassName="overflow-y-auto"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowVehicleForm(false);
                setEditingVehicle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => document.getElementById('vehicle-modal-form')?.requestSubmit()}
            >
              {editingVehicle ? 'Save changes' : 'Save vehicle'}
            </Button>
          </div>
        }
      >
        <VehicleForm
          id="vehicle-modal-form"
          initialVehicle={editingVehicle}
          onInvalidSubmit={() => actions.toast('error', 'Please complete the required vehicle fields.')}
          onSubmit={async (vehicle) => {
            if (editingVehicle) {
              const updated = await actions.updateVehicle(vehicle);
              actions.toast(updated ? 'success' : 'error', updated ? 'Vehicle updated.' : 'Vehicle could not be updated.');
              if (!updated) return;
            } else {
              const saved = await actions.addVehicle(vehicle);
              if (saved) actions.toast('success', `${vehicle.manufacturer} ${vehicle.model} added.`);
              if (!saved) return;
            }
            setShowVehicleForm(false);
            setEditingVehicle(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deletingVehicle)}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={async () => {
          if (!deletingVehicle) return;

          const deleted = await actions.deleteVehicle(deletingVehicle.id);
          setDeletingVehicle(null);

          if (deleted) {
            actions.toast('success', 'Vehicle deleted successfully.');
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
