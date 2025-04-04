-- This script fixes RLS policies for development testing
-- Run this in the Supabase SQL Editor

-- First, disable RLS for easier development
ALTER TABLE "Agents" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Chunks" DISABLE ROW LEVEL SECURITY;

-- Optional: If you want to use RLS but make it permissive for development
-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access their own agents" ON "Agents";
DROP POLICY IF EXISTS "Users can only access chunks of their agents" ON "Chunks";
DROP POLICY IF EXISTS "Allow all access to Agents during testing" ON "Agents";
DROP POLICY IF EXISTS "Allow all access to Chunks during testing" ON "Chunks";

-- Create completely permissive policies
CREATE POLICY "Allow all access to Agents during testing" ON "Agents"
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to Chunks during testing" ON "Chunks"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS with the permissive policies
ALTER TABLE "Agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chunks" ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' AND (tablename = 'Agents' OR tablename = 'Chunks'); 