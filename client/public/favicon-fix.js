/**
 * This script fixes the missing favicon issue with Supabase
 * It intercepts favicon.ico requests to the Supabase domain and redirects them
 * to our local proxy endpoint
 */
(function() {
  // Only run this if fetch is supported
  if (typeof window.fetch !== 'function') return;

  const originalFetch = window.fetch;
  const supabaseDomain = 'dafizawmeehypygvgdge.supabase.co';
  
  // Override the fetch function to intercept requests
  window.fetch = function(resource, options) {
    // Check if the request is for a favicon on the Supabase domain
    if (typeof resource === 'string' && 
        resource.includes(supabaseDomain) && 
        resource.endsWith('/favicon.ico')) {
      
      console.log('[Favicon Fix] Intercepted favicon request to Supabase');
      
      // Redirect to our proxy endpoint instead
      // For local development, the proxy is on port 3001
      return originalFetch('http://localhost:3001/proxy-favicon', options);
    }
    
    // Otherwise, proceed with the original fetch request
    return originalFetch.apply(this, arguments);
  };

  console.log('[Favicon Fix] Installed favicon request interceptor');
})(); 