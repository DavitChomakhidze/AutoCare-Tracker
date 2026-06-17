import { useState } from 'react';
import { Car, Plus, Search, FileText } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { CompactDropdown } from '../components/CompactDropdown';
import { Modal, ConfirmModal } from '../components/Modal';
import { AppActions, ServiceRecord, Vehicle, money, vehicleName } from '../data/appTypes';

const serviceTypeOptions = [
  { value: 'all', label: 'All Service Types' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'oil', label: 'Oil Change' },
  { value: 'tire', label: 'Tire Service' },
  { value: 'brake', label: 'Brake Service' },
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' }
];

const dateFilterOptions = [
  { value: 'all', label: 'All Time' },
  { value: '30-days', label: 'Last 30 Days' },
  { value: '3-months', label: 'Last 3 Months' },
  { value: '6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' }
];

const sortOptions = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'oldest', label: 'Oldest Added' },
  { value: 'date-desc', label: 'Service Date: Newest First' },
  { value: 'date-asc', label: 'Service Date: Oldest First' },
  { value: 'cost-desc', label: 'Cost: High to Low' },
  { value: 'cost-asc', label: 'Cost: Low to High' },
  { value: 'mileage-desc', label: 'Mileage: High to Low' },
  { value: 'mileage-asc', label: 'Mileage: Low to High' }
];

function recordCreatedTime(record: ServiceRecord) {
  return new Date(record.createdAt || record.date).getTime() || 0;
}

function recordDateTime(record: ServiceRecord) {
  return new Date(record.date).getTime() || 0;
}

function matchesServiceType(record: ServiceRecord, serviceType: string) {
  if (serviceType === 'all') return true;

  const text = `${record.type} ${record.category}`.toLowerCase();
  if (serviceType === 'oil') return text.includes('oil');
  if (serviceType === 'tire') return text.includes('tire');
  if (serviceType === 'brake') return text.includes('brake');
  if (serviceType === 'repair') return text.includes('repair');
  if (serviceType === 'maintenance') return text.includes('maintenance');
  if (serviceType === 'inspection') return text.includes('inspection');
  return serviceType === 'other' ? text.includes('other') : true;
}

function matchesDateFilter(record: ServiceRecord, dateFilter: string) {
  if (dateFilter === 'all') return true;

  const serviceDate = recordDateTime(record);
  if (!serviceDate) return false;

  const now = new Date();
  const start = new Date(now);

  if (dateFilter === '30-days') start.setDate(now.getDate() - 30);
  if (dateFilter === '3-months') start.setMonth(now.getMonth() - 3);
  if (dateFilter === '6-months') start.setMonth(now.getMonth() - 6);
  if (dateFilter === 'this-year') start.setMonth(0, 1);

  if (dateFilter === 'this-year') start.setHours(0, 0, 0, 0);
  return serviceDate >= start.getTime();
}

export function ServiceHistory({
  actions,
  records,
  vehicles
}: {
  actions: AppActions;
  records: ServiceRecord[];
  vehicles: Vehicle[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const knownVehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
  const visibleSourceRecords = records.filter((record) => knownVehicleIds.has(record.vehicleId));
  const vehicleOptions = [
    { value: 'all', label: 'All Vehicles' },
    ...vehicles.map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicleName(vehicle)} (${vehicle.plate})`
    }))
  ];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRecords = visibleSourceRecords
    .filter((record) => {
      const vehicle = vehicles.find((item) => item.id === record.vehicleId);
      const searchableText = [
        vehicle?.manufacturer,
        vehicle?.model,
        vehicle?.plate,
        record.vehicle,
        record.plate,
        record.type,
        record.category,
        record.workshop,
        record.notes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (vehicleFilter === 'all' || record.vehicleId === vehicleFilter) &&
        matchesServiceType(record, serviceTypeFilter) &&
        matchesDateFilter(record, dateFilter) &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    })
    .sort((firstRecord, secondRecord) => {
      if (sortBy === 'oldest') return recordCreatedTime(firstRecord) - recordCreatedTime(secondRecord);
      if (sortBy === 'date-desc') return recordDateTime(secondRecord) - recordDateTime(firstRecord);
      if (sortBy === 'date-asc') return recordDateTime(firstRecord) - recordDateTime(secondRecord);
      if (sortBy === 'cost-desc') return secondRecord.cost - firstRecord.cost;
      if (sortBy === 'cost-asc') return firstRecord.cost - secondRecord.cost;
      if (sortBy === 'mileage-desc') return secondRecord.mileage - firstRecord.mileage;
      if (sortBy === 'mileage-asc') return firstRecord.mileage - secondRecord.mileage;
      return recordCreatedTime(secondRecord) - recordCreatedTime(firstRecord);
    });
  const selectedRecord = visibleSourceRecords.find((record) => record.id === selectedRecordId);
  const hasVehicles = vehicles.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Service History</h1>
          <p className="text-muted-foreground">Track all maintenance and repair records</p>
        </div>
        <Button onClick={() => actions.navigate(hasVehicles ? 'add-service' : 'vehicles')}>
          {hasVehicles ? <Plus size={18} /> : <Car size={18} />}
          {hasVehicles ? 'Add service record' : 'Add vehicle'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,1fr)_220px_190px_170px_240px]">
        <div className="min-w-0">
          <Input
            placeholder="Search service records..."
            leftIcon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <CompactDropdown options={vehicleOptions} value={vehicleFilter} onChange={setVehicleFilter} />
        <CompactDropdown options={serviceTypeOptions} value={serviceTypeFilter} onChange={setServiceTypeFilter} />
        <CompactDropdown options={dateFilterOptions} value={dateFilter} onChange={setDateFilter} />
        <CompactDropdown options={sortOptions} value={sortBy} onChange={setSortBy} />
      </div>

      <Card padding="none">
        {visibleSourceRecords.length === 0 ? (
          <div className="text-center py-14 px-4">
            {hasVehicles ? (
              <FileText size={40} className="mx-auto mb-3 text-muted-foreground" />
            ) : (
              <Car size={40} className="mx-auto mb-3 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold mb-2">{hasVehicles ? 'No service records yet' : 'No vehicles yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasVehicles ? 'Add your first service record to start tracking maintenance.' : 'Add a vehicle before creating service records.'}
            </p>
            <Button onClick={() => actions.navigate(hasVehicles ? 'add-service' : 'vehicles')}>
              {hasVehicles ? <Plus size={18} /> : <Car size={18} />}
              {hasVehicles ? 'Add service record' : 'Add vehicle'}
            </Button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-14 px-4">
            <Search size={40} className="mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No records match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">Try changing the search term or clearing one of the filters.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setVehicleFilter('all');
                setServiceTypeFilter('all');
                setDateFilter('all');
                setSortBy('recent');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mileage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Workshop</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-border hover:bg-accent/50">
                  <td className="py-4 px-4">
                    <span className="font-medium">{record.date}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium">{record.vehicle}</p>
                      <p className="text-sm text-muted-foreground">{record.plate}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">{record.type}</td>
                  <td className="py-4 px-4">{record.mileage.toLocaleString()} km</td>
                  <td className="py-4 px-4">{record.workshop}</td>
                  <td className="py-4 px-4 font-semibold">{money(record.cost)}</td>
                  <td className="py-4 px-4">
                    <Badge variant={record.status}>
                      {record.status === 'completed' ? 'Completed' : 'Scheduled'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRecordId(record.id)}>View</Button>
                      <Button variant="ghost" size="sm" onClick={() => actions.editServiceRecord(record.id)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteRecordId(record.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {filteredRecords.length} of {visibleSourceRecords.length} records</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecordId(null)}
        title="Service record details"
        size="lg"
        footer={<Button variant="outline" onClick={() => setSelectedRecordId(null)}>Close</Button>}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedRecord.type}</h3>
                <p className="text-sm text-muted-foreground">{selectedRecord.vehicle} - {selectedRecord.plate}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Date:</span> {selectedRecord.date}</div>
              <div><span className="text-muted-foreground">Mileage:</span> {selectedRecord.mileage.toLocaleString()} km</div>
              <div><span className="text-muted-foreground">Workshop:</span> {selectedRecord.workshop}</div>
              <div><span className="text-muted-foreground">Total cost:</span> {money(selectedRecord.cost)}</div>
            </div>
            {selectedRecord.receiptFileName && (
              <div className="rounded-lg border border-border bg-neutral-50 p-3 text-sm">
                <span className="text-muted-foreground">Receipt:</span>{' '}
                {selectedRecord.receiptUrl ? (
                  <a href={selectedRecord.receiptUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                    {selectedRecord.receiptFileName}
                  </a>
                ) : (
                  <span className="font-medium">{selectedRecord.receiptFileName}</span>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{selectedRecord.notes}</p>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteRecordId)}
        onClose={() => setDeleteRecordId(null)}
        onConfirm={async () => {
          if (!deleteRecordId) return;

          const deleted = await actions.deleteService(deleteRecordId);
          setDeleteRecordId(null);

          if (deleted) {
            actions.toast('success', 'Service record deleted successfully.');
            return;
          }

          actions.toast('error', 'Service record could not be deleted.');
        }}
        title="Delete service record?"
        message="Are you sure you want to delete this service record?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
