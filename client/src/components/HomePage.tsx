import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div>
      <h1>Automate Web Tasks from Loom Videos</h1>
      <form onSubmit={handleSubmit}>
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
      </form>
    </div>
  );
}

export default HomePage; 