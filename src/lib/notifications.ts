import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type NotificationType = 'sensor_offline' | 'sensor_error' | 'system_update' | 'maintenance';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  email: string;
  type: NotificationType;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  template_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  subject: string;
  content: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);

    if (error) throw error;
  }

  async getPreferences(email: string): Promise<NotificationPreference[]> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('email', email);

    if (error) throw error;
    return data;
  }

  async updatePreference(
    email: string,
    type: NotificationType,
    enabled: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        email,
        type,
        enabled,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getTemplate(type: NotificationType): Promise<NotificationTemplate> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .single();

    if (error) throw error;
    return data;
  }
}