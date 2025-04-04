import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current auth state
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error in auth callback:', error);
          setStatus('error');
          setMessage('Authentication failed: ' + error.message);
          return;
        }

        if (data.session) {
          console.log('Authentication successful, redirecting...');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          // No session found
          setStatus('error');
          setMessage('Authentication failed: No session found. Please try again.');
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '300px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h2>Authentication {status === 'loading' ? 'in Progress' : status === 'success' ? 'Successful' : 'Failed'}</h2>
      
      {status === 'loading' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {status === 'success' && (
        <div style={{ 
          marginTop: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#e6f7e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'green',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          ✓
        </div>
      )}
      
      {status === 'error' && (
        <div style={{ 
          marginTop: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#ffebee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'red',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          ✗
        </div>
      )}
      
      <p style={{ 
        marginTop: '20px',
        color: status === 'error' ? '#d32f2f' : 
              status === 'success' ? '#2e7d32' : '#666'
      }}>
        {message}
      </p>
    </div>
  );
}

export default AuthCallback; 