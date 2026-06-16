import { useEffect, useMemo, useState } from 'react';
import { Bell, Car, FileText, Search, Settings, Wrench, X } from 'lucide-react';
import { Page, Reminder, ServiceRecord, Vehicle, vehicleName } from '../data/appTypes';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  vehicles: Vehicle[];
  serviceRecords: ServiceRecord[];
  reminders: Reminder[];
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'Page' | 'Vehicle' | 'Service' | 'Reminder';
  icon: JSX.Element;
  target: string;
  keywords: string;
}

const pageResults: Array<{
  id: Page;
  title: string;
  subtitle: string;
  icon: JSX.Element;
  keywords: string;
}> = [
  { id: 'dashboard', title: 'Dashboard', subtitle: 'Overview, reminders, expenses', icon: <Search size={18} />, keywords: 'home overview dashboard' },
  { id: 'vehicles', title: 'My Vehicles', subtitle: 'Garage and vehicle details', icon: <Car size={18} />, keywords: 'cars garage vehicles plate vin' },
  { id: 'service-history', title: 'Service History', subtitle: 'Maintenance and repair records', icon: <Wrench size={18} />, keywords: 'service maintenance repair records oil inspection' },
  { id: 'reminders', title: 'Reminders', subtitle: 'Upcoming and overdue tasks', icon: <Bell size={18} />, keywords: 'reminders upcoming overdue due soon' },
  { id: 'expenses', title: 'Expenses & Analytics', subtitle: 'Costs, categories, reports', icon: <FileText size={18} />, keywords: 'expenses analytics costs report export' },
  { id: 'settings', title: 'Settings', subtitle: 'Profile and preferences', icon: <Settings size={18} />, keywords: 'settings profile account preferences' }
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function resultMatches(result: SearchResult, query: string) {
  if (!query) return true;
  return normalize(`${result.title} ${result.subtitle} ${result.keywords}`).includes(query);
}

export function GlobalSearch({
  isOpen,
  onClose,
  onNavigate,
  vehicles,
  serviceRecords,
  reminders
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = normalize(query);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const pageSearchResults = pageResults.map((page) => ({
      id: `page-${page.id}`,
      title: page.title,
      subtitle: page.subtitle,
      type: 'Page' as const,
      icon: page.icon,
      target: page.id,
      keywords: page.keywords
    }));

    const vehicleResults = vehicles.map((vehicle) => ({
      id: `vehicle-${vehicle.id}`,
      title: vehicleName(vehicle),
      subtitle: `${vehicle.year} - ${vehicle.plate}`,
      type: 'Vehicle' as const,
      icon: <Car size={18} />,
      target: `vehicle:${vehicle.id}`,
      keywords: [vehicle.manufacturer, vehicle.model, vehicle.plate, vehicle.vin, vehicle.color, vehicle.fuelType].join(' ')
    }));

    const serviceResults = serviceRecords.map((record) => ({
      id: `service-${record.id}`,
      title: record.type,
      subtitle: `${record.vehicle} - ${record.date}`,
      type: 'Service' as const,
      icon: <Wrench size={18} />,
      target: 'service-history',
      keywords: [record.type, record.category, record.vehicle, record.plate, record.workshop, record.notes, record.date].join(' ')
    }));

    const reminderResults = reminders.map((reminder) => {
      const vehicle = vehicles.find((item) => item.id === reminder.vehicleId);
      return {
        id: `reminder-${reminder.id}`,
        title: reminder.title,
        subtitle: vehicle ? `${vehicleName(vehicle)} - ${vehicle.plate}` : 'Reminder',
        type: 'Reminder' as const,
        icon: <Bell size={18} />,
        target: 'reminders',
        keywords: [reminder.title, reminder.notes, reminder.status, vehicle?.manufacturer, vehicle?.model, vehicle?.plate].filter(Boolean).join(' ')
      };
    });

    return [...pageSearchResults, ...vehicleResults, ...serviceResults, ...reminderResults]
      .filter((result) => resultMatches(result, normalizedQuery))
      .slice(0, 12);
  }, [normalizedQuery, reminders, serviceRecords, vehicles]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/40 px-4 pt-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[var(--radius-card)] border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={20} className="text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vehicles, services, reminders, pages..."
            className="h-10 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                className="w-full rounded-lg px-3 py-3 text-left hover:bg-accent transition-colors"
                onClick={() => {
                  onNavigate(result.target);
                  onClose();
                  setQuery('');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    {result.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{result.title}</p>
                      <span className="text-xs text-muted-foreground">{result.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
