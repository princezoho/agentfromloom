// Script to help fix RLS policies in Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dafizawmeehypygvgdge.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZml6YXdtZWVoeXB5Z3ZnZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDg4MjAsImV4cCI6MjA1OTMyNDgyMH0.jLPInhrkdEb2pmFjne4wGEF537rKyLVkDjC2O2zazoc";

const fixRlsPolicies = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('======================================================');
  console.log('  FIX FOR SUPABASE RLS POLICY ISSUES');
  console.log('======================================================');
  console.log('\nProblem: "new row violates row-level security policy for table Agents"');
  console.log('\nThis script will help you fix RLS policy issues in your Supabase project.');
  
  // Check connection to Supabase
  try {
    console.log('\nChecking connection to Supabase...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      console.log('Please check your Supabase credentials and try again.');
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    
    if (data.session) {
      console.log(`Logged in as: ${data.session.user.email}`);
    } else {
      console.log('You are not logged in. Some operations may be restricted.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return;
  }
  
  // Read the SQL fix file
  const sqlFilePath = path.join(__dirname, '..', 'fix_rls_policies.sql');
  try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('\n-------------------------------------------------------');
    console.log('SOLUTION: Run this SQL in the Supabase SQL Editor:');
    console.log('-------------------------------------------------------\n');
    console.log(sqlContent);
    
    console.log('\n-------------------------------------------------------');
    console.log('INSTRUCTIONS:');
    console.log('-------------------------------------------------------');
    console.log('1. Go to https://dafizawmeehypygvgdge.supabase.co');
    console.log('2. Navigate to "SQL Editor" in the left sidebar');
    console.log('3. Create a "New Query"');
    console.log('4. Copy and paste all the SQL above');
    console.log('5. Click "Run" to execute the SQL');
    console.log('6. After running the SQL, restart the server and client apps');
    
    // Try a basic operation to see if it's working
    try {
      console.log('\nTesting a basic query on Agents table...');
      const { data, error } = await supabase.from('Agents').select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42501') {
          console.log('❌ RLS policy is still restrictive. Please run the SQL commands above.');
        } else {
          console.log('❌ Error querying Agents table:', error.message);
        }
      } else {
        console.log('✅ Successfully queried Agents table! Table exists and permissions allow reading.');
      }
    } catch (err) {
      console.error('Error testing query:', err);
    }
    
  } catch (err) {
    console.error('Error reading SQL file:', err);
    console.log(`Make sure the file ${sqlFilePath} exists.`);
  }
};

fixRlsPolicies()
  .catch(err => {
    console.error('Fatal error:', err);
  }); 