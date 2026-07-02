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
const Advisor = lazy(() => import('./pages/AIAdvisor.jsx'));
const News = lazy(() => import('./pages/News.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Watchlist = lazy(() => import('./pages/Watchlist.jsx'));
const Signals = lazy(() => import('./pages/Signals.jsx'));
const ImportPortfolio = lazy(() => import('./pages/ImportPortfolio.jsx'));
const MarketWatch = lazy(() => import('./pages/MarketWatch.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Sandbox = lazy(() => import('./pages/Sandbox/index.jsx'));

import { useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-inner">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Arca">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="#7DD3FC" strokeWidth="1.5"/>
            <path d="M8 22L13 12L18 18L22 10" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="10" r="2" fill="#A78BFA"/>
          </svg>
          <span>Initialising Arca...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isVerified = localStorage.getItem('broker_verified') === 'true';
  if (!isVerified && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Suspense fallback={<div style={{padding:24}}>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/market-watch" element={<MarketWatch />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/import" element={<ImportPortfolio />} />
          <Route path="/sandbox" element={<Sandbox />} />
        </Route>
        {/* Legacy redirects */}
        <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
