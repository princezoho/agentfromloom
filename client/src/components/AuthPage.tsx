import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Import the configured client

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      setMessage('Login successful! Redirecting...');
      // TODO: Redirect user after successful login (e.g., to dashboard or previous page)
      console.log('User logged in');
      // Example: window.location.href = '/'; // Or use useNavigate
    }
    setLoading(false);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(`Signup failed: ${error.message}`);
    } else if (data.user && data.user.identities?.length === 0) {
        // This case handles when email confirmation might be required but wasn't completed
        // or if there was some other issue preventing user creation despite no direct error.
        setMessage('Signup initiated, but user confirmation might be pending or failed. Please check your email or try logging in.');
    } else if (data.user) {
        setMessage('Signup successful! Please check your email for verification.');
        console.log('User signed up:', data.user);
    } else {
        // Fallback case if no user and no error
        setMessage('Signup may have failed. Please try again.');
    }
    setLoading(false);
  };

  // Add Google Login button and handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Optional: Add scopes or redirect options if needed
        // redirectTo: window.location.origin // Redirect back to the app after login
      },
    });
    if (error) {
      setMessage(`Google login failed: ${error.message}`);
      setLoading(false);
    } else {
      // Supabase handles the redirect to Google and back.
      // If successful, the user session will be updated automatically.
      setMessage('Redirecting to Google...');
      // No need to setLoading(false) here as the page will redirect
    }
  };

  return (
    <div>
      <h2>Login / Sign Up</h2>
      {message && <p style={{ color: message.includes('failed') ? 'red' : 'green' }}>{message}</p>}
      <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
        <h3>Login</h3>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          required={true}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Your password"
          value={password}
          required={true}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 15px' }}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <form onSubmit={handleSignup} style={{ marginBottom: '20px' }}>
         <h3>Sign Up</h3>
         {/* Reuse email/password fields visually or duplicate them for clarity */}
         <input
           type="email"
           placeholder="Your email"
           value={email}
           required={true}
           onChange={(e) => setEmail(e.target.value)}
           style={{ marginRight: '10px', padding: '8px' }}
         />
         <input
           type="password"
           placeholder="Your password"
           value={password}
           required={true}
           onChange={(e) => setPassword(e.target.value)}
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
    </div>
  );
}

export default AuthPage; 