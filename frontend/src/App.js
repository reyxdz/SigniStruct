import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Navigation/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Forms from './pages/Forms/Forms';
import Documents from './pages/Documents/Documents';
import FormBuilder from './pages/FormBuilder/FormBuilder';
import DocumentSign from './pages/DocumentSign/DocumentSign';
import { colors, spacing } from './theme';
import './App.css';

function App() {
  const [user] = useState({
    name: 'John Doe',
    email: 'john@example.com'
  });

  const handleLogout = () => {
    // Handle logout logic
    console.log('User logged out');
  };

  return (
    <Router>
      <div className="App" style={{ backgroundColor: colors.lightGray, minHeight: '100vh' }}>
        <Header user={user} onLogout={handleLogout} />
        
        <main style={{ paddingTop: spacing.md }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/form-builder/:formId" element={<FormBuilder />} />
            <Route path="/document-sign/:documentId" element={<DocumentSign />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
