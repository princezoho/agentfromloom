const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://dafizawmeehypygvgdge.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZml6YXdtZWVoeXB5Z3ZnZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDg4MjAsImV4cCI6MjA1OTMyNDgyMH0.jLPInhrkdEb2pmFjne4wGEF537rKyLVkDjC2O2zazoc";

// Script for Supabase setup instructions
const runSql = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Setting up database tables and disabling RLS for development...");
  
  try {
    console.log("This script only provides instructions since RPC functions require admin rights.");
    
    console.log("\n=== SQL TO RUN IN SUPABASE DASHBOARD ===");
    console.log(`
-- Agents Table
CREATE TABLE IF NOT EXISTS "Agents" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  loom_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  github_repo_url VARCHAR(255)
);

-- Chunks Table
CREATE TABLE IF NOT EXISTS "Chunks" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES "Agents"(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  name VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  learned_actions JSONB NOT NULL DEFAULT '[]',
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "Agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chunks" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own agents" ON "Agents";
DROP POLICY IF EXISTS "Users can only access chunks of their agents" ON "Chunks";
DROP POLICY IF EXISTS "Allow all access to Agents during testing" ON "Agents";
DROP POLICY IF EXISTS "Allow all access to Chunks during testing" ON "Chunks";

-- Create permissive policies for testing
CREATE POLICY "Allow all access to Agents during testing" ON "Agents"
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to Chunks during testing" ON "Chunks"
  FOR ALL
  USING (true)
  WITH CHECK (true);
`);

    console.log("\n=== NEXT STEPS ===");
    console.log("1. Go to https://dafizawmeehypygvgdge.supabase.co and log in");
    console.log("2. Go to SQL Editor and run the SQL commands above");
    console.log("3. Enable Google OAuth in Authentication → Providers → Google");
    console.log("4. Add your Google Client ID and Secret (see google-oauth-setup.md)");
    
    console.log("\nIf you don't configure these correctly:");
    console.log("- Our app has fallback mechanisms for development");
    console.log("- You'll see developer mode messages for saving agents");
    console.log("- Google login will show an error about 'provider not enabled'");
    
    // Test if supabase connection works
    try {
      const { data, error } = await supabase.from('Agents').select('count', { count: 'exact', head: true });
      if (error) {
        console.log("\nCould not connect to Supabase:", error.message);
      } else {
        console.log("\nSuccessfully connected to Supabase!");
      }
    } catch (connErr) {
      console.log("\nError testing Supabase connection:", connErr.message);
    }
  } catch (err) {
    console.error("Error:", err.message);
    console.log("Please configure tables and RLS manually in the Supabase dashboard");
  }
};

runSql()
  .catch(err => {
    console.error("Error executing script:", err);
  }); 