import { AppNotification } from '../data/appTypes';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export interface NotificationInput {
  type: string;
  title: string;
  message: string;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt?: string;
}

export function mapNotification(row: NotificationRow): AppNotification {
  const category: AppNotification['category'] = row.type.startsWith('service') ? 'System' : 'Maintenance';

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.message,
    time: '',
    read: Boolean(row.read_at),
    createdAt: row.created_at,
    category,
    sourceType: row.source_type,
    sourceId: row.source_id
  };
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function upsertNotifications(userId: string, notifications: NotificationInput[]) {
  const payload: NotificationInsert[] = notifications
    .filter((notification) => notification.sourceType && notification.sourceId)
    .map((notification) => ({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      source_type: notification.sourceType || null,
      source_id: notification.sourceId || null,
      created_at: notification.createdAt || new Date().toISOString()
    }));

  if (payload.length === 0) return [];

  const { data, error } = await supabase
    .from('notifications')
    .upsert(payload, { onConflict: 'user_id,source_type,source_id,type' })
    .select();

  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw error;
  return mapNotification(data);
}

export async function markAllNotificationsRead(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
    .is('deleted_at', null)
    .select();

  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function deleteNotification(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
}
