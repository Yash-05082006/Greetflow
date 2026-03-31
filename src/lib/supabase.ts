import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase first.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: 'Lead' | 'Client' | 'User';
  date_of_birth: string;
  anniversary_date?: string;
  preferences?: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseTemplate {
  id: string;
  name: string;
  category: 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting';
  age_group: 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)';
  content: string;
  description: string;
  design: {
    background: string;
    textColor: string;
    fontFamily: string;
  };
  usage_count: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEmailLog {
  id: string;
  user_id: string;
  template_id?: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}