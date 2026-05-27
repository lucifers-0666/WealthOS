/**
 * AppErrorBoundary — global React error boundary.
 * Catches render errors, logs structured info, shows clean recovery UI.
 * No stack traces exposed to user. Dev mode shows detail.
 */
import { Component } from 'react';

export class AppErrorBoundary extends Component {
  state = { hasError: false, errorId: null, message: '' };

  static getDerivedStateFromError(error) {
    const errorId = `ERR_${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, errorId, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // Structured log — replace with Sentry.captureException in production
    console.error('[WealthOS Error Boundary]', {
      errorId: this.state.errorId,
      message: error?.message,
      stack: error?.stack,
      component: info?.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: null, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg, #171614)',
          fontFamily: 'inherit',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 480, width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Application Error</span>
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text, #cdccca)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #797876)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            WealthOS encountered an unexpected error. Your portfolio data is safe.
          </p>

          {/* Error ID */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.625rem 0.875rem',
            background: 'var(--color-surface, #1c1b19)',
            border: '1px solid var(--color-border, #393836)',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Error ID</span>
            <code style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', letterSpacing: '0.05em' }}>
              {this.state.errorId}
            </code>
          </div>

          {/* Dev detail */}
          {isDev && this.state.message && (
            <details style={{ marginBottom: '1.5rem' }}>
              <summary style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: '0.5rem' }}>Technical detail</summary>
              <code style={{
                display: 'block',
                padding: '0.75rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: '#dc2626',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}>
                {this.state.message}
              </code>
            </details>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--color-primary, #4f98a3)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--color-border, #393836)',
                background: 'transparent',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
