import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Import the configured client

function AuthPage() {
  // Separate state for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Separate state for signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // State for password reset
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  // Admin functions
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [diagnosticInfo, setDiagnosticInfo] = useState('');

  // Add diagnostic check on component mount
  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        // Test a simple Supabase operation
        const { data, error } = await supabase.from('_dummy_test').select('*').limit(1);
        
        // This should fail with a "relation does not exist" error, not a connection error
        console.log("Supabase test result:", { data, error });
        
        if (error && error.code === "PGRST116") {
          // This is good - it means we connected but the table doesn't exist (as expected)
          setDiagnosticInfo("✅ Supabase connection successful (received expected DB error)");
        } else if (error) {
          // Other error - could be permissions, configuration, etc.
          setDiagnosticInfo(`⚠️ Supabase responded with error: ${error.message}`);
        } else {
          setDiagnosticInfo("✅ Supabase connection successful");
        }
        
        // Also check auth features
        try {
          const { data: authData } = await supabase.auth.getSession();
          console.log("Auth session check:", authData);
          setDiagnosticInfo(prev => `${prev}\n✅ Auth API responding correctly`);
        } catch (authErr) {
          console.error("Auth check failed:", authErr);
          setDiagnosticInfo(prev => `${prev}\n❌ Auth API error: ${(authErr as Error).message}`);
        }
      } catch (err) {
        console.error("Supabase connection test failed:", err);
        setDiagnosticInfo(`❌ Supabase connection failed: ${(err as Error).message}`);
      }
    }
    
    checkSupabaseConnection();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic validation
    if (!loginEmail || !loginPassword) {
      setMessage('Login failed: Email and password are required');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    console.log('Starting login process with email:', loginEmail);
    
    try {
      console.log('Sending auth.signInWithPassword request to Supabase');
      
      // Simplify login process to avoid CORS issues
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password: loginPassword 
      });

      console.log('Login response data:', data);
      
      if (error) {
        console.error('Login error details:', error);
        if (error.message.includes('Failed to fetch')) {
          setMessage('Login failed: Network connection error. Please check your internet connection.');
        } else {
          setMessage(`Login failed: ${error.message}`);
        }
      } else if (data.user) {
        console.log('Login successful - user data:', data.user);
        setMessage('Login successful! Redirecting...');
        
        // Wait a moment before redirecting
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        console.warn('Login returned no error but no user data:', data);
        setMessage('Login failed with an unknown error. Please try again.');
      }
    } catch (err) {
      console.error('Login unexpected error:', err);
      setMessage('An unexpected error occurred. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(signupEmail)) {
      setMessage('Signup failed: Please enter a valid email address (e.g., user@example.com)');
      return;
    }
    
    // Password validation - at least 6 characters
    if (signupPassword.length < 6) {
      setMessage('Signup failed: Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    console.log('Starting signup process with email:', signupEmail);
    
    try {
      // Log the request that's about to be made
      console.log('Sending auth.signUp request to Supabase');
      
      // Simplify options to avoid CORS issues
      const { data, error } = await supabase.auth.signUp({ 
        email: signupEmail, 
        password: signupPassword
      });

      // Log the complete response for debugging
      console.log('Signup response data:', data);
      
      if (error) {
        console.error('Signup error details:', error);
        if (error.message.includes('Failed to fetch')) {
          setMessage('Signup failed: Network connection error. Please check your internet connection.');
        } else {
          setMessage(`Signup failed: ${error.message}`);
        }
      } else if (data.user && data.user.identities?.length === 0) {
          console.warn('User exists but has no identities:', data.user);
          setMessage('This email is already registered. Try logging in instead.');
      } else if (data.user) {
          console.log('Signup successful - user data:', data.user);
          setMessage('Signup successful! Please check your email for verification.');
      } else {
          console.warn('No error but no user data returned:', data);
          setMessage('Signup may have failed. Please try again.');
      }
    } catch (err) {
      // Log the full error object for debugging
      console.error('Signup unexpected error:', err);
      setMessage('An unexpected error occurred. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add Google Login button and handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard', // Redirect to dashboard after login
        },
      });
      
      if (error) {
        setMessage(`Google login failed: ${error.message}`);
        setLoading(false);
      } else {
        // Supabase handles the redirect to Google and back
        setMessage('Redirecting to Google...');
        // No need to setLoading(false) here as the page will redirect
      }
    } catch (err) {
      console.error('Google login error:', err);
      setMessage('An unexpected error occurred with Google login. Please try again later.');
      setLoading(false);
    }
  };

  // Add a diagnostic function to create a test user
  const handleTestSignup = async () => {
    setLoading(true);
    setMessage('');
    
    // Use a predictable test email with timestamp to ensure uniqueness
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    setDiagnosticInfo(prev => `${prev}\n🔄 Testing signup with: ${testEmail}`);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: testEmail, 
        password: testPassword
      });

      if (error) {
        setDiagnosticInfo(prev => `${prev}\n❌ Test signup failed: ${error.message}`);
        console.error('Test signup error:', error);
      } else if (data?.user?.id) {
        setDiagnosticInfo(prev => `${prev}\n✅ Test signup successful! User ID: ${data.user!.id}`);
        console.log('Test user created:', data.user);
      } else {
        setDiagnosticInfo(prev => `${prev}\n⚠️ Test signup - unknown result`);
      }
    } catch (err) {
      console.error('Test signup unexpected error:', err);
      setDiagnosticInfo(prev => `${prev}\n❌ Test signup unexpected error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add password reset handler
  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!resetEmail) {
      setMessage('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        setMessage(`Password reset failed: ${error.message}`);
      } else {
        setMessage('Password reset email sent! Please check your inbox.');
        setResetEmail('');
      }
    } catch (err) {
      console.error('Password reset unexpected error:', err);
      setMessage(`An unexpected error occurred: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add admin function to delete all users
  const handleDeleteAllUsers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL users? This cannot be undone!')) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'adminSecret': adminSecret
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete users');
      }
      
      setMessage(`${data.message} ${data.instructions || ''}`);
      console.log('Delete users response:', data);
    } catch (err) {
      console.error('Delete users error:', err);
      setMessage(`Failed to delete users: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle forms
  const toggleResetForm = () => {
    setShowResetForm(prev => !prev);
  };
  
  const toggleAdminPanel = () => {
    setShowAdminPanel(prev => !prev);
  };

  return (
    <div>
      <h2>Login / Sign Up</h2>
      
      {diagnosticInfo && (
        <div 
          style={{ 
            padding: '8px', 
            marginBottom: '15px', 
            borderRadius: '4px',
            backgroundColor: diagnosticInfo.includes('❌') ? '#ffebee' : 
                           diagnosticInfo.includes('⚠️') ? '#fff8e1' : '#e8f5e9',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        >
          {diagnosticInfo}
        </div>
      )}
      
      {message && (
        <div 
          style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            borderRadius: '4px',
            backgroundColor: message.includes('failed') || message.includes('error') ? '#ffebee' : '#e8f5e9',
            color: message.includes('failed') || message.includes('error') ? '#d32f2f' : '#2e7d32',
            border: `1px solid ${message.includes('failed') || message.includes('error') ? '#ffcdd2' : '#a5d6a7'}`
          }}
        >
          {message}
        </div>
      )}
      
      {/* Login Form */}
      <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
        <h3>Login</h3>
        <input
          type="email"
          placeholder="Your email"
          value={loginEmail}
          required={true}
          onChange={(e) => setLoginEmail(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Your password"
          value={loginPassword}
          required={true}
          onChange={(e) => setLoginPassword(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 15px' }}>
          {loading ? 'Loading...' : 'Login'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <button 
            type="button" 
            onClick={toggleResetForm}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#2196f3', 
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showResetForm ? 'Hide password reset' : 'Forgot password?'}
          </button>
        </div>
      </form>

      {/* Password Reset Form */}
      {showResetForm && (
        <form onSubmit={handleResetPassword} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h3>Reset Password</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          <input
            type="email"
            placeholder="Your email"
            value={resetEmail}
            required={true}
            onChange={(e) => setResetEmail(e.target.value)}
            style={{ marginRight: '10px', padding: '8px', width: '300px' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '8px 15px' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSignup} style={{ marginBottom: '20px' }}>
         <h3>Sign Up</h3>
         <input
           type="email"
           placeholder="Your email"
           value={signupEmail}
           required={true}
           onChange={(e) => setSignupEmail(e.target.value)}
           style={{ marginRight: '10px', padding: '8px' }}
         />
         <input
           type="password"
           placeholder="Your password"
           value={signupPassword}
           required={true}
           onChange={(e) => setSignupPassword(e.target.value)}
           style={{ marginRight: '10px', padding: '8px' }}
         />
        <button type="submit" disabled={loading} style={{ padding: '8px 15px' }}>
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </form>

      {/* Divider */}
      <hr style={{ margin: '20px 0' }} />

      {/* Google Login Button */}
      <button onClick={handleGoogleLogin} disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#db4437', color: 'white', border: 'none', cursor: 'pointer' }}>
        {loading ? 'Loading...' : 'Login with Google'}
      </button>
      
      {/* Admin Panel Toggle Button */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button 
          onClick={toggleAdminPanel} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#999', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showAdminPanel ? 'Hide Admin' : 'Admin Panel'}
        </button>
      </div>
      
      {/* Admin Panel */}
      {showAdminPanel && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f8f8', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4 style={{ color: '#d32f2f' }}>Admin Panel</h4>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Warning: These actions are destructive and cannot be undone.
          </p>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              style={{ marginRight: '10px', padding: '8px', width: '200px' }}
            />
          </div>
          <button 
            onClick={handleDeleteAllUsers} 
            disabled={loading || !adminSecret}
            style={{ 
              padding: '8px 15px', 
              backgroundColor: '#d32f2f', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer',
              opacity: !adminSecret ? 0.5 : 1
            }}
          >
            {loading ? 'Processing...' : 'Delete All Users & Data'}
          </button>
        </div>
      )}

      {/* Diagnostic button - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <hr style={{ margin: '20px 0' }} />
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h4>Developer Diagnostics</h4>
            <button 
              onClick={handleTestSignup} 
              disabled={loading}
              style={{ padding: '8px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none' }}
            >
              Create Test User
            </button>
            <p style={{ fontSize: '12px', marginTop: '10px' }}>
              This will attempt to create a test user with a unique email to verify Supabase auth functionality.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default AuthPage; 