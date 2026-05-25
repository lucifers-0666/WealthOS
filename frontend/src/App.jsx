import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/useAuth.js';

// Route-level lazy loading to reduce initial bundle size
const Layout = lazy(() => import('./components/Layout.jsx'));
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Portfolio = lazy(() => import('./pages/Portfolio.jsx'));
const Upload = lazy(() => import('./pages/Upload.jsx'));
const AIAdvisor = lazy(() => import('./pages/AIAdvisor.jsx'));
const News = lazy(() => import('./pages/News.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));

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
    <Suspense fallback={<div style={{padding:24}}>Loading…</div>}>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="upload" element={<Upload />} />
        <Route path="advisor" element={<AIAdvisor />} />
        <Route path="news" element={<News />} />
          <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/portfolio" element={<Navigate to="/app/portfolio" replace />} />
      <Route path="/upload" element={<Navigate to="/app/upload" replace />} />
      <Route path="/advisor" element={<Navigate to="/app/advisor" replace />} />
      <Route path="/news" element={<Navigate to="/app/news" replace />} />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
