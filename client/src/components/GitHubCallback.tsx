import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const GitHubCallback: React.FC = () => {
  const [status, setStatus] = useState<string>('Processing GitHub authorization...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if the URL indicates an error from GitHub
        if (location.search.includes('error=')) {
          const errorDesc = new URLSearchParams(location.search).get('error_description') || 'Unknown error';
          setStatus(`GitHub authorization failed: ${errorDesc}`);
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          return;
        }

        // Check if there's a pending export in localStorage
        const pendingExport = localStorage.getItem('pendingExport');
        
        if (pendingExport) {
          // We'll redirect back to the dashboard with a flag to resume the export
          setStatus('Authorization successful! Resuming your export...');
          localStorage.removeItem('pendingExport'); // Clean up
          
          // Redirect back to dashboard with a flag to resume the export
          setTimeout(() => {
            navigate('/dashboard?github_auth=success&resume_export=true');
          }, 1500);
        } else {
          // Just a regular authorization, go back to dashboard
          setStatus('Authorization successful!');
          setTimeout(() => {
            navigate('/dashboard?github_auth=success');
          }, 1500);
        }
      } catch (error) {
        console.error('Error handling GitHub callback:', error);
        setStatus('An error occurred while processing GitHub authorization');
        
        // Navigate back to dashboard after delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '50px auto', 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '8px',
      textAlign: 'center' 
    }}>
      <h2>GitHub Authorization</h2>
      <div style={{ 
        margin: '20px 0', 
        padding: '15px', 
        backgroundColor: '#fff', 
        borderRadius: '5px', 
        border: '1px solid #ddd' 
      }}>
        <p>{status}</p>
        {status.includes('successful') && (
          <div style={{ marginTop: '10px', color: 'green' }}>
            <span role="img" aria-label="checkmark">✅</span> Redirecting you back...
          </div>
        )}
        {status.includes('failed') && (
          <div style={{ marginTop: '10px', color: 'red' }}>
            <span role="img" aria-label="error">❌</span> Redirecting you back...
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubCallback; 