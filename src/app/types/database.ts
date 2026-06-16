export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          manufacturer_id: string | null;
          model_id: string | null;
          manufacturer: string;
          model: string;
          production_year: number;
          license_plate: string;
          current_mileage: number;
          vin: string | null;
          fuel_type: string;
          transmission: string | null;
          engine_size: string | null;
          color: string | null;
          date_added: string;
          last_service: string;
          next_reminder: string;
          status: 'healthy' | 'needs-attention';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          manufacturer_id?: string | null;
          model_id?: string | null;
          manufacturer: string;
          model: string;
          production_year: number;
          license_plate: string;
          current_mileage?: number;
          vin?: string | null;
          fuel_type: string;
          transmission?: string | null;
          engine_size?: string | null;
          color?: string | null;
          date_added?: string;
          last_service?: string;
          next_reminder?: string;
          status?: 'healthy' | 'needs-attention';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      service_records: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          service_date: string;
          vehicle_name_snapshot: string | null;
          plate_snapshot: string | null;
          service_type: string;
          category: string;
          mileage: number;
          workshop: string;
          labor_cost: number;
          parts_cost: number;
          additional_cost: number;
          total_cost: number;
          status: 'completed' | 'scheduled';
          notes: string;
          parts: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          service_date: string;
          vehicle_name_snapshot?: string | null;
          plate_snapshot?: string | null;
          service_type: string;
          category: string;
          mileage: number;
          workshop?: string;
          labor_cost?: number;
          parts_cost?: number;
          additional_cost?: number;
          total_cost?: number;
          status?: 'completed' | 'scheduled';
          notes?: string;
          parts?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_records']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          title: string;
          reminder_type: string;
          due_date: string | null;
          due_mileage: number | null;
          notes: string | null;
          is_completed: boolean;
          completed_at: string | null;
          reminder_email_sent_at: string | null;
          reminder_email_last_status: string | null;
          legacy_status: 'overdue' | 'due-soon' | 'upcoming' | 'completed' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          title: string;
          reminder_type?: string;
          due_date?: string | null;
          due_mileage?: number | null;
          notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          reminder_email_sent_at?: string | null;
          reminder_email_last_status?: string | null;
          legacy_status?: 'overdue' | 'due-soon' | 'upcoming' | 'completed' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
    };
  };
}
