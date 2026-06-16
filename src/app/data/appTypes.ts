import type { ReactNode } from 'react';

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

export function money(value: number) {
  return `\u20be${value.toLocaleString()}`;
}

export function vehicleName(vehicle: Vehicle) {
  return `${vehicle.manufacturer} ${vehicle.model}`;
}
