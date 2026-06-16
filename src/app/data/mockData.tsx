import { ReactNode } from 'react';
import { AlertCircle, Bell, Car, CheckCircle, Wrench } from 'lucide-react';

export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'welcome'
  | 'add-first-vehicle'
  | 'dashboard'
  | 'vehicles'
  | 'vehicle-details'
  | 'upcoming-services'
  | 'overdue-services'
  | 'monthly-expenses'
  | 'service-history'
  | 'add-service'
  | 'reminders'
  | 'expenses'
  | 'settings'
  | 'notifications';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface AppActions {
  navigate: (page: Page) => void;
  openVehicleDetails: (vehicleId: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
  updateProfile: (profile: UserProfile) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  logOutEverywhere: () => Promise<boolean>;
  deleteAllData: () => Promise<boolean>;
  logout: () => Promise<void>;
  toast: (type: ToastType, message: string) => void;
  addVehicle: (vehicle: Vehicle) => Promise<boolean>;
  updateVehicle: (vehicle: Vehicle) => Promise<boolean>;
  deleteVehicle: (vehicleId: string) => Promise<boolean>;
  addService: (record: ServiceRecord) => Promise<boolean>;
  updateService: (record: ServiceRecord) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  addReminder: (reminder: Reminder) => Promise<boolean>;
  updateReminder: (reminder: Reminder) => Promise<boolean>;
  deleteReminder: (reminderId: string) => Promise<boolean>;
  completeReminder: (reminderId: string) => Promise<boolean>;
  addServiceRecord: (record: ServiceRecord) => Promise<boolean>;
  editServiceRecord: (recordId: string) => void;
  createReminderForVehicle: (vehicleId: string) => void;
}

export interface Vehicle {
  id: string;
  manufacturerId?: string;
  modelId?: string;
  manufacturer: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  vin: string;
  fuelType: string;
  transmission: string;
  engine: string;
  color: string;
  dateAdded: string;
  lastService: string;
  nextReminder: string;
  status: 'healthy' | 'needs-attention';
}

export interface ServiceRecord {
  id: string;
  date: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  type: string;
  category: string;
  mileage: number;
  workshop: string;
  laborCost: number;
  partsCost: number;
  additionalCost: number;
  cost: number;
  status: 'completed' | 'scheduled';
  notes: string;
  createdAt?: string;
  parts: { name: string; brand: string; quantity: number; unitPrice: number }[];
}

export interface Reminder {
  id: string;
  title: string;
  vehicleId: string;
  vehicle?: string;
  plate?: string;
  reminderType?: string;
  dueDate?: string;
  dueMileage?: number;
  currentMileage?: number;
  status?: 'overdue' | 'due-soon' | 'upcoming' | 'completed';
  remainingDays?: number;
  remainingKm?: number;
  overdueDays?: number;
  notes?: string;
  isCompleted?: boolean;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: 'Maintenance' | 'System';
}

export const user = {
  name: 'User',
  email: 'example@email.com',
  currency: 'GEL',
  currencySymbol: '₾',
  distanceUnit: 'km'
};

export const vehicles: Vehicle[] = [
  {
    id: 'subaru',
    manufacturer: 'Subaru',
    model: 'Forester XT',
    year: 2004,
    plate: 'AA-123-BB',
    mileage: 281450,
    vin: 'JF1SF63641H726541',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: '2.5L Turbo',
    color: 'Silver',
    dateAdded: 'Jan 15, 2026',
    lastService: 'Oil change - 2 days ago',
    nextReminder: 'Due in 600 km',
    status: 'needs-attention'
  },
  {
    id: 'hyundai',
    manufacturer: 'Hyundai',
    model: 'Elantra',
    year: 2017,
    plate: 'CC-456-DD',
    mileage: 126300,
    vin: 'KMHD841CBHU482910',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: '1.8L',
    color: 'White',
    dateAdded: 'Feb 3, 2026',
    lastService: 'Routine inspection - 3 weeks ago',
    nextReminder: 'Due in 18 days',
    status: 'healthy'
  }
];

export const serviceRecords: ServiceRecord[] = [
  {
    id: 'srv-1',
    date: '2026-06-05',
    vehicleId: 'subaru',
    vehicle: 'Subaru Forester XT',
    plate: 'AA-123-BB',
    type: 'Oil and filter change',
    category: 'Maintenance',
    mileage: 281450,
    workshop: 'AutoService Plus',
    laborCost: 50,
    partsCost: 70,
    additionalCost: 0,
    cost: 120,
    status: 'completed',
    notes: 'Engine oil and oil filter replaced.',
    parts: [{ name: 'Oil filter', brand: 'Mann', quantity: 1, unitPrice: 35 }]
  },
  {
    id: 'srv-2',
    date: '2026-05-15',
    vehicleId: 'subaru',
    vehicle: 'Subaru Forester XT',
    plate: 'AA-123-BB',
    type: 'Brake pad replacement',
    category: 'Repairs',
    mileage: 279800,
    workshop: 'Brake Specialists',
    laborCost: 120,
    partsCost: 230,
    additionalCost: 0,
    cost: 350,
    status: 'completed',
    notes: 'Front brake pads replaced and brake system inspected.',
    parts: [{ name: 'Front brake pads', brand: 'Brembo', quantity: 1, unitPrice: 230 }]
  },
  {
    id: 'srv-3',
    date: '2026-05-28',
    vehicleId: 'hyundai',
    vehicle: 'Hyundai Elantra',
    plate: 'CC-456-DD',
    type: 'Routine inspection',
    category: 'Inspection',
    mileage: 125800,
    workshop: 'Official Service Center',
    laborCost: 80,
    partsCost: 0,
    additionalCost: 0,
    cost: 80,
    status: 'completed',
    notes: 'Routine inspection completed with no critical issues.',
    parts: []
  },
  {
    id: 'srv-4',
    date: '2026-06-20',
    vehicleId: 'hyundai',
    vehicle: 'Hyundai Elantra',
    plate: 'CC-456-DD',
    type: 'Annual technical inspection',
    category: 'Inspection',
    mileage: 126500,
    workshop: 'Inspection Center',
    laborCost: 45,
    partsCost: 0,
    additionalCost: 0,
    cost: 45,
    status: 'scheduled',
    notes: 'Scheduled annual technical inspection.',
    parts: []
  }
];

export const reminders: Reminder[] = [
  {
    id: 'rem-1',
    title: 'Brake system inspection',
    vehicleId: 'subaru',
    vehicle: 'Subaru Forester XT',
    plate: 'AA-123-BB',
    dueDate: '2026-05-25',
    currentMileage: 281450,
    status: 'overdue',
    overdueDays: 12
  },
  {
    id: 'rem-2',
    title: 'Engine oil change',
    vehicleId: 'subaru',
    vehicle: 'Subaru Forester XT',
    plate: 'AA-123-BB',
    dueMileage: 282000,
    currentMileage: 281450,
    status: 'due-soon',
    remainingKm: 600
  },
  {
    id: 'rem-3',
    title: 'Annual technical inspection',
    vehicleId: 'hyundai',
    vehicle: 'Hyundai Elantra',
    plate: 'CC-456-DD',
    dueDate: '2026-06-25',
    currentMileage: 126300,
    status: 'upcoming',
    remainingDays: 18
  },
  {
    id: 'rem-4',
    title: 'Tire rotation',
    vehicleId: 'hyundai',
    vehicle: 'Hyundai Elantra',
    plate: 'CC-456-DD',
    dueMileage: 130000,
    currentMileage: 126300,
    status: 'upcoming',
    remainingKm: 3700
  }
];

export const monthlyExpenses = [
  { month: 'Jan', amount: 450 },
  { month: 'Feb', amount: 320 },
  { month: 'Mar', amount: 780 },
  { month: 'Apr', amount: 290 },
  { month: 'May', amount: 520 },
  { month: 'Jun', amount: 420 }
];

export const categoryData = [
  { name: 'Maintenance', value: 1200, color: '#3b82f6' },
  { name: 'Repairs', value: 800, color: '#22c55e' },
  { name: 'Parts', value: 550, color: '#f97316' },
  { name: 'Tires', value: 230, color: '#0ea5e9' },
  { name: 'Inspection', value: 230, color: '#6366f1' }
];

export const appNotifications: AppNotification[] = [
  {
    id: 'n-1',
    icon: <AlertCircle size={20} />,
    title: 'Oil change is due in 7 days',
    description: 'Subaru Forester XT needs an oil change soon',
    time: '2 hours ago',
    read: false,
    category: 'Maintenance'
  },
  {
    id: 'n-2',
    icon: <AlertCircle size={20} className="text-danger-500" />,
    title: 'Brake inspection is overdue',
    description: 'Subaru Forester XT - overdue by 12 days',
    time: '1 day ago',
    read: false,
    category: 'Maintenance'
  },
  {
    id: 'n-3',
    icon: <CheckCircle size={20} className="text-success-500" />,
    title: 'Reminder created successfully',
    description: 'Annual technical inspection reminder has been set',
    time: '2 days ago',
    read: true,
    category: 'System'
  },
  {
    id: 'n-4',
    icon: <Car size={20} />,
    title: 'Vehicle mileage reminder approaching',
    description: 'Tire rotation due at 130,000 km',
    time: '3 days ago',
    read: true,
    category: 'Maintenance'
  },
  {
    id: 'n-5',
    icon: <Wrench size={20} className="text-success-500" />,
    title: 'Service record added',
    description: 'Oil and filter change completed for Subaru Forester XT',
    time: '5 days ago',
    read: true,
    category: 'System'
  },
  {
    id: 'n-6',
    icon: <Bell size={20} />,
    title: 'Monthly expense summary is ready',
    description: 'You spent ₾420 on vehicle care this month',
    time: '1 week ago',
    read: true,
    category: 'System'
  }
];

export function money(value: number) {
  return `₾${value.toLocaleString()}`;
}

export function vehicleName(vehicle: Vehicle) {
  return `${vehicle.manufacturer} ${vehicle.model}`;
}
