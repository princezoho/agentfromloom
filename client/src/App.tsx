import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import HomePage from './components/HomePage';
import DisplayPage from './components/DisplayPage';
import AuthPage from './components/AuthPage';
import AgentDashboard from './components/AgentDashboard';
import './App.css';

function App() {
  // Basic check for user session (we will refine this later)
  // const [session, setSession] = React.useState(supabase.auth.getSession());
  // React.useEffect(() => {
  //   supabase.auth.onAuthStateChange((_event, session) => {
  //     setSession(session)
  //   })
  // }, [])

  return (
    <Router>
      <div className="App">
        <nav style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
          <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
          <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>
          <Link to="/auth">Login / Sign Up</Link>
          {/* We might conditionally show Login/Signup OR Dashboard/Logout later */}
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<AgentDashboard />} />
          {/* Add other routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
