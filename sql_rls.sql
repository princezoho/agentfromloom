-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access their own agents" ON "Agents";
DROP POLICY IF EXISTS "Users can only access chunks of their agents" ON "Chunks";

-- Create more permissive policies for testing
CREATE POLICY "Allow all access to Agents during testing" ON "Agents"
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to Chunks during testing" ON "Chunks"
  FOR ALL
  USING (true)
  WITH CHECK (true); 