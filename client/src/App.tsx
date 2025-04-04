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
import AgentDashboard from './components/AgentDashboard';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
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
