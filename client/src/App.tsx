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
          {/* Conditionally show Auth link or user info/logout later */}
          <Link to="/auth">Login / Sign Up</Link>
          {/* We will add a link to the Agent Dashboard here later */}
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/auth" element={<AuthPage />} />
          {/* Add other routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
