import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Upload from './pages/Upload.jsx';
import AIAdvisor from './pages/AIAdvisor.jsx';
import News from './pages/News.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './lib/useAuth.js';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-inner">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="WealthOS">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="#7DD3FC" strokeWidth="1.5"/>
            <path d="M8 22L13 12L18 18L22 10" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="10" r="2" fill="#A78BFA"/>
          </svg>
          <span>Initialising WealthOS...</span>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="upload" element={<Upload />} />
        <Route path="advisor" element={<AIAdvisor />} />
        <Route path="news" element={<News />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
