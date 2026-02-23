import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        setStatus({ error: 'Unable to connect to backend' });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to SigniStruct</h1>
        <p>MERN Stack Application</p>
      </header>

      <main className="App-main">
        <div className="status-card">
          <h2>Backend Status</h2>
          {loading ? (
            <p>Checking connection...</p>
          ) : status?.error ? (
            <p className="error">{status.error}</p>
          ) : (
            <div>
              <p className="success">✓ {status?.status}</p>
              <p className="timestamp">{new Date(status?.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>

        <section className="info-section">
          <h2>Get Started</h2>
          <p>This is your MERN stack application with MongoDB, Express, React, and Node.js.</p>
          <ul>
            <li>Backend API running on port 5000</li>
            <li>Frontend React app running on port 3000</li>
            <li>MongoDB for data persistence</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
