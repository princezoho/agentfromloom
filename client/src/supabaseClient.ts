import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dafizawmeehypygvgdge.supabase.co';
// IMPORTANT: This is the anon key, safe to be published in client-side code
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZml6YXdtZWVoeXB5Z3ZnZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDg4MjAsImV4cCI6MjA1OTMyNDgyMH0.jLPInhrkdEb2pmFjne4wGEF537rKyLVkDjC2O2zazoc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 