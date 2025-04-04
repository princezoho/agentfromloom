const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment or use defaults
const supabaseUrl = process.env.SUPABASE_URL || 'https://dafizawmeehypygvgdge.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZml6YXdtZWVoeXB5Z3ZnZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI0MTY2MzAsImV4cCI6MjAyNzk5MjYzMH0.5vbhFUKoQ3QJy4hLHS7QdSDnEDWj_xr1wbGDQQvF1k4';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fixes RLS policies for development by disabling RLS or creating permissive policies
 * @param {boolean} disableRLS - Whether to disable RLS completely (true) or create permissive policies (false)
 * @returns {Promise<object>} - The result of the operation
 */
async function fixRlsPolicies(disableRLS = true) {
  try {
    console.log(`Fixing RLS policies (${disableRLS ? 'disabling RLS' : 'creating permissive policies'})...`);
    
    // SQL commands to fix RLS
    let sqlCommands;
    
    if (disableRLS) {
      // Option 1: Completely disable RLS (simplest, but least secure)
      sqlCommands = `
        -- Disable RLS for easier development
        ALTER TABLE "Agents" DISABLE ROW LEVEL SECURITY;
        ALTER TABLE "Chunks" DISABLE ROW LEVEL SECURITY;
      `;
    } else {
      // Option 2: Keep RLS but make policies completely permissive
      sqlCommands = `
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
      `;
    }
    
    // Execute the SQL commands directly
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });
    
    if (error) {
      console.error('Error fixing RLS policies:', error);
      
      // If rpc fails, we might not have the exec_sql function, inform the user
      console.log(`
        It seems the 'exec_sql' RPC function might not be available in your Supabase instance.
        
        Please go to the Supabase SQL Editor and run the following SQL manually:
        
        ${sqlCommands}
      `);
      
      return { success: false, error };
    }
    
    console.log('RLS policies successfully fixed!');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error fixing RLS policies:', err);
    return { success: false, error: err };
  }
}

// Helper to generate SQL to fix RLS policies
function generateRlsFixSql(disableRLS = true) {
  if (disableRLS) {
    // Option 1: Completely disable RLS (simplest, but least secure)
    return `
      -- Disable RLS for easier development
      ALTER TABLE "Agents" DISABLE ROW LEVEL SECURITY;
      ALTER TABLE "Chunks" DISABLE ROW LEVEL SECURITY;
    `;
  } else {
    // Option 2: Keep RLS but make policies completely permissive
    return `
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
    `;
  }
}

// Export function so it can be used by server.js
module.exports = { fixRlsPolicies, generateRlsFixSql };

// If this script is run directly, print the SQL to the console
if (require.main === module) {
  const disableRLS = true; // Change to false if you want permissive policies instead
  console.log('SQL to fix RLS policies:');
  console.log(generateRlsFixSql(disableRLS));
  
  console.log('\nINSTRUCTIONS:');
  console.log('1. Log in to your Supabase dashboard: https://dafizawmeehypygvgdge.supabase.co');
  console.log('2. Go to SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Paste the SQL above');
  console.log('5. Click "Run"');
  console.log('\nImportant: This disables security for development purposes only.');
  console.log('Re-enable RLS before deploying to production.');
} 