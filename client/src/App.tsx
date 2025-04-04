import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import HomePage from './components/HomePage';
import DisplayPage from './components/DisplayPage';
import AuthPage from './components/AuthPage';
import AuthCallback from './components/AuthCallback';
import AgentDashboard from './components/AgentDashboard';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for active session and handle OAuth redirects
    const handleAuth = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // Check if we're on the OAuth callback URL
      const hashParams = new URLSearchParams(window.location.hash.substr(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      // If we have auth parameters in the URL, show a loading state
      if (hashParams.has('access_token') || queryParams.has('code')) {
        console.log('Detected OAuth callback, handling authentication...');
      }
      
      // Setup auth state listener for future changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log('Auth state changed:', _event);
        setSession(newSession);
        
        // If user just logged in, redirect to dashboard
        if (_event === 'SIGNED_IN' && !session) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        }
      });
  
      return () => subscription?.unsubscribe();
    };
    
    handleAuth();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
  };

  return (
    <Router>
      <div className="App">
        <nav style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
          <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
          {session && <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>}
          {!session ? (
             <Link to="/auth" style={{ marginRight: '15px' }}>Login / Sign Up</Link>
          ) : (
             <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout ({session.user.email})</button>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={
            session ? 
            <AgentDashboard key={session.user.id} session={session} /> : 
            <div>Please log in to view the dashboard.</div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
