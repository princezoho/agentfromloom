const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dafizawmeehypygvgdge.supabase.co';
// Using the anon key for basic auth operations initially.
// Consider using service_role key via environment variables for privileged operations later.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZml6YXdtZWVoeXB5Z3ZnZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDg4MjAsImV4cCI6MjA1OTMyNDgyMH0.jLPInhrkdEb2pmFjne4wGEF537rKyLVkDjC2O2zazoc';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase; 