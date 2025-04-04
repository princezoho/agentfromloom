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

-- Enable RLS if it's not already enabled
ALTER TABLE "Agents" ENABLE ROW LEVEL SECURITY;

-- Create policy (will not error if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'Agents' AND policyname = 'Users can only access their own agents'
  ) THEN
    CREATE POLICY "Users can only access their own agents" ON "Agents"
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

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

-- Enable RLS if it's not already enabled
ALTER TABLE "Chunks" ENABLE ROW LEVEL SECURITY;

-- Create policy (will not error if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'Chunks' AND policyname = 'Users can only access chunks of their agents'
  ) THEN
    CREATE POLICY "Users can only access chunks of their agents" ON "Chunks"
      FOR ALL USING (
        agent_id IN (
          SELECT id FROM "Agents" WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$; 