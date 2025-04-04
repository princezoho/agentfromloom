const https = require('https');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://dafizawmeehypygvgdge.supabase.co';
const faviconPath = '/favicon.ico';

console.log(`Checking if ${supabaseUrl}${faviconPath} is accessible...`);

// Function to check if the favicon exists
function checkFaviconExists() {
  return new Promise((resolve, reject) => {
    https.get(`${supabaseUrl}${faviconPath}`, (res) => {
      console.log('Response status code:', res.statusCode);
      
      if (res.statusCode === 200) {
        console.log('✅ Favicon exists on the Supabase instance!');
        
        // Save the favicon to a local file for inspection
        const downloadPath = path.join(__dirname, 'supabase-favicon-downloaded.ico');
        const file = fs.createWriteStream(downloadPath);
        
        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded favicon to ${downloadPath}`);
          resolve(true);
        });
      } else if (res.statusCode === 404) {
        console.log('❌ Favicon not found (404) on the Supabase instance.');
        console.log('This explains the 404 error in your browser console.');
        resolve(false);
      } else {
        console.log(`❓ Unexpected status code: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error('Error checking favicon:', err.message);
      reject(err);
    });
  });
}

// Function to check the auth endpoint
function checkAuthEndpoint() {
  return new Promise((resolve, reject) => {
    https.get(`${supabaseUrl}/auth/v1/`, (res) => {
      console.log('Auth endpoint status code:', res.statusCode);
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log('✅ Auth endpoint is accessible!');
        resolve(true);
      } else {
        console.log(`❌ Auth endpoint returned status code: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error('Error checking auth endpoint:', err.message);
      reject(err);
    });
  });
}

// Main function to run checks
async function runChecks() {
  try {
    const faviconExists = await checkFaviconExists();
    const authEndpointWorks = await checkAuthEndpoint();
    
    console.log('\nSummary:');
    console.log(`- Favicon exists: ${faviconExists ? 'Yes' : 'No'}`);
    console.log(`- Auth endpoint accessible: ${authEndpointWorks ? 'Yes' : 'No'}`);
    
    if (!faviconExists) {
      console.log('\nSuggestion:');
      console.log('1. If you have access to your Supabase instance, you can upload a favicon.ico file to it.');
      console.log('2. Alternatively, the favicon we created in client/public will be used for your app,');
      console.log('   but the browser will still try to fetch the Supabase favicon when accessing its API.');
    }
  } catch (error) {
    console.error('Error running checks:', error);
  }
}

runChecks(); 