import { Reminder } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type ReminderRow = Database['public']['Tables']['reminders']['Row'];
type ReminderInsert = Database['public']['Tables']['reminders']['Insert'];
type ReminderUpdate = Database['public']['Tables']['reminders']['Update'];

export function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    vehicleId: row.vehicle_id,
    reminderType: row.reminder_type,
    dueDate: row.due_date || undefined,
    dueMileage: row.due_mileage || undefined,
    status: row.legacy_status || undefined,
    notes: row.notes || undefined,
    isCompleted: row.is_completed,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function reminderPayload(reminder: Reminder, userId: string): ReminderInsert {
  return {
    user_id: userId,
    vehicle_id: reminder.vehicleId,
    title: reminder.title,
    reminder_type: reminder.reminderType || reminder.title || 'General Maintenance',
    due_date: reminder.dueDate || null,
    due_mileage: reminder.dueMileage || null,
    notes: reminder.notes || null,
    is_completed: Boolean(reminder.isCompleted),
    completed_at: reminder.completedAt || null,
    legacy_status: reminder.status || null
  };
}

export async function getReminders(userId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapReminder);
}

export async function createReminder(reminder: Reminder, userId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminderPayload(reminder, userId))
    .select()
    .single();

  if (error) throw error;
  return mapReminder(data);
}

export async function updateReminder(reminder: Reminder, userId: string) {
  const payload = reminderPayload(reminder, userId) as ReminderUpdate;
  delete payload.user_id;

  const { data, error } = await supabase
    .from('reminders')
    .update(payload)
    .eq('id', reminder.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapReminder(data);
}

export async function deleteReminder(reminderId: string, userId: string) {
  const { error } = await supabase.from('reminders').delete().eq('id', reminderId).eq('user_id', userId);
  if (error) throw error;
}

export async function completeReminder(reminderId: string, userId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('reminders')
    .update({ is_completed: true, completed_at: now, legacy_status: 'completed' })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapReminder(data);
}
