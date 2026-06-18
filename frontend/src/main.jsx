import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import QueryProvider from './components/QueryProvider.jsx';
import { AppErrorBoundaryBase } from './components/AppErrorBoundary.jsx';
import { MarketDataProvider } from './lib/MarketDataContext.jsx';
import App from './App.jsx';
import './index.css';

/**
 * Root bootstrap.
 * AppErrorBoundaryBase wraps the BrowserRouter so it works outside Router context.
 * Inside the router, individual page boundaries use the default AppErrorBoundary
 * (which injects useLocation for route-aware reset).
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundaryBase
      fallback={({ error, errorId, onReset }) => (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0d0d0f', padding: 24,
        }}>
          <div style={{
            maxWidth: 480, background: '#141417',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 3, padding: '36px 32px',
          }}>
            <div style={{ height: 3, background: '#e05263', borderRadius: '12px 12px 0 0', marginBottom: 20 }} />
            <h2 style={{ color: '#e2e2e4', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Critical startup error</h2>
            <p style={{ color: '#8b8b9a', fontSize: 14, marginBottom: 8 }}>{error?.message}</p>
            {errorId && <p style={{ color: '#4a4a57', fontSize: 11, fontFamily: 'monospace', marginBottom: 16 }}>{errorId}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onReset} style={{
                flex: 1, padding: '10px 0', background: '#4f9cf9',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}>Try again</button>
              <button onClick={() => window.location.reload()} style={{
                flex: 1, padding: '10px 0', background: 'transparent',
                color: '#8b8b9a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, fontSize: 14, cursor: 'pointer',
              }}>Reload</button>
            </div>
          </div>
        </div>
      )}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryProvider>
          <MarketDataProvider>
            <App />
          </MarketDataProvider>
        </QueryProvider>
      </BrowserRouter>
    </AppErrorBoundaryBase>
  </StrictMode>
);
