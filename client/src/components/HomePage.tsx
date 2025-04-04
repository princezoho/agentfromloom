import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Default Loom video for analysis
const DEFAULT_LOOM_URL = 'https://www.loom.com/share/ddcffe26b75c4fdcb8d6faeb29f413a3?sid=c30af7c5-06e2-485b-9cd5-a6d9cf417849';

function HomePage() {
  const [loomUrl, setLoomUrl] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoomUrl(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (loomUrl) {
      // Pass the URL as a query parameter
      navigate(`/display?url=${encodeURIComponent(loomUrl)}`);
    } else {
      alert('Please enter a Loom URL.');
    }
  };

  const useDefaultVideo = () => {
    setLoomUrl(DEFAULT_LOOM_URL);
  };

  const analyzeDefaultVideo = () => {
    navigate(`/display?url=${encodeURIComponent(DEFAULT_LOOM_URL)}`);
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Automate Web Tasks from Loom Videos</h1>
      <p style={{ marginBottom: '20px' }}>Upload a Loom video to analyze and automate web tasks, or use our sample video.</p>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={loomUrl}
            onChange={handleInputChange}
            placeholder="Enter Loom Video URL"
            style={{ width: '400px', padding: '10px', marginRight: '10px' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>
            Analyze Loom
          </button>
        </div>
        <div>
          <button type="button" onClick={useDefaultVideo} style={{ marginRight: '10px' }}>
            Use Sample Video
          </button>
          <button type="button" onClick={analyzeDefaultVideo}>
            Analyze Sample Video
          </button>
        </div>
      </form>
      
      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Sample Video</h3>
        <p style={{ fontSize: '0.9em' }}>Our sample video demonstrates a simple web task you can automate.</p>
        <code style={{ display: 'block', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '3px', wordBreak: 'break-all', marginTop: '10px' }}>
          {DEFAULT_LOOM_URL}
        </code>
      </div>
    </div>
  );
}

export default HomePage; 