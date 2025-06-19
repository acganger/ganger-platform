// Cloudflare Workers Edge Runtime
export const runtime = 'experimental-edge';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [timestamp, setTimestamp] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimestamp(new Date().toISOString());
  }, []);

  if (!isClient) {
    return <div>Loading Worker...</div>;
  }

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🎉 SUCCESS! Dynamic Worker Dashboard</h1>
      <p>This page is served by Cloudflare Workers - NOT static HTML!</p>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '1rem', 
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
        <h2>Proof this is dynamic:</h2>
        <p><strong>Timestamp:</strong> {timestamp}</p>
        <p><strong>Math.random():</strong> {Math.random()}</p>
        <p><strong>React State:</strong> {isClient ? 'Active' : 'Loading'}</p>
      </div>
      <button 
        onClick={() => setTimestamp(new Date().toISOString())}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Update Timestamp (Proves Interactivity)
      </button>
    </div>
  );
}