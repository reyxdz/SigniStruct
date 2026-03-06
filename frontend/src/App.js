import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Navigation/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Forms from './pages/Forms/Forms';
import Documents from './pages/Documents/Documents';
import DocumentEditorPage from './pages/DocumentEditor/DocumentEditorPage';
import DocumentSigningPage from './pages/DocumentEditor/DocumentSigningPage';
import FormBuilder from './pages/FormBuilder/FormBuilder';
import DocumentSign from './pages/DocumentSign/DocumentSign';
import CreateSignaturePage from './pages/Signature/CreateSignaturePage';
import LandingPage from './pages/LandingPage/LandingPage';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
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

  // Routes that require the header (authenticated routes)
  const authenticatedRoutes = ['/dashboard', '/forms', '/documents', '/documents/:documentId/editor', '/form-builder', '/document-sign', '/create-signature'];
  
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent user={user} handleLogout={handleLogout} authenticatedRoutes={authenticatedRoutes} />
      </Router>
    </AuthProvider>
  );
}

function AppContent({ user, handleLogout, authenticatedRoutes }) {
  const location = useLocation();
  const isAuthenticatedRoute = authenticatedRoutes.some(route => location.pathname.startsWith(route));
  // Don't show header on document editor page (it has its own header)
  const isDocumentEditor = location.pathname.includes('/editor');
  // Don't show header on signing page
  const isSigningPage = location.pathname.includes('/sign/');
  const shouldShowHeader = isAuthenticatedRoute && !isDocumentEditor && !isSigningPage;

  return (
    <div className="App" style={{ backgroundColor: colors.lightGray, minHeight: '100vh', width: '100%' }}>
      {shouldShowHeader && <Header user={user} onLogout={handleLogout} />}
      
      <main style={!isDocumentEditor && !isSigningPage ? (isAuthenticatedRoute ? { paddingTop: spacing.md } : {}) : { width: '100%', margin: 0, padding: 0 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Authenticated Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:documentId/editor" element={<DocumentEditorPage />} />
          <Route path="/documents/:documentId/sign/:signingToken" element={<DocumentSigningPage />} />
          <Route path="/form-builder/:formId" element={<FormBuilder />} />
          <Route path="/document-sign/:documentId" element={<DocumentSign />} />
          <Route path="/create-signature" element={<CreateSignaturePage />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
