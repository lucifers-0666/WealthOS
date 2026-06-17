import { Component } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * AppErrorBoundary — production-grade error boundary.
 *
 * Features:
 * - Route-aware reset: clears error automatically on navigation change
 * - key-based unmount strategy via `resetKey` prop (pass from parent)
 * - `onReset` callback so parent can clear state on retry
 * - componentStack capture for structured error reporting
 * - Sentry-ready: calls window.__sentryReportError if available
 * - No emojis, calm institutional styling
 */
class AppErrorBoundaryBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: null,
      errorId: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36),
    };
  }

  componentDidCatch(error, info) {
    const componentStack = info?.componentStack ?? null;
    this.setState({ componentStack });

    // Structured console error
    console.error('[Arca ErrorBoundary]', {
      message: error?.message,
      stack: error?.stack,
      componentStack,
      errorId: this.state.errorId,
    });

    // Sentry-compatible hook
    if (typeof window.__sentryReportError === 'function') {
      window.__sentryReportError(error, { componentStack });
    }
  }

  componentDidUpdate(prevProps) {
    // Route-aware reset: when location pathname changes, clear error
    if (
      this.state.hasError &&
      prevProps.locationKey !== this.props.locationKey
    ) {
      this.handleReset();
    }
    // resetKey-based reset (parent can increment to force clear)
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.handleReset();
    }
  }

  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      componentStack: null,
      errorId: null,
    });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  }

  render() {
    const { hasError, error, componentStack, errorId } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    // Custom fallback from parent
    if (typeof fallback === 'function') {
      return fallback({ error, componentStack, errorId, onReset: this.handleReset });
    }

    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.indicator} />
          <h2 style={styles.title}>Something went wrong</h2>
          <p style={styles.message}>
            {error?.message || 'An unexpected error occurred.'}
          </p>
          {errorId && (
            <p style={styles.errorId}>Error ID: {errorId}</p>
          )}
          {componentStack && (
            <details style={styles.details}>
              <summary style={styles.summary}>Component trace</summary>
              <pre style={styles.pre}>{componentStack.trim()}</pre>
            </details>
          )}
          <div style={styles.actions}>
            <button style={styles.btnPrimary} onClick={this.handleReset}>
              Try again
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Functional wrapper to inject router-aware props
export default function AppErrorBoundary(props) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <AppErrorBoundaryBase
      {...props}
      locationKey={location.pathname + location.search}
      navigate={navigate}
    />
  );
}

// Named export for contexts outside Router (e.g., root provider wraps)
export { AppErrorBoundaryBase };

const styles = {
  overlay: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg, #0d0d0f)',
    padding: '24px',
  },
  card: {
    maxWidth: 480,
    width: '100%',
    background: 'var(--color-surface, #141417)',
    border: '1px solid var(--color-border, rgba(255,255,255,0.07))',
    borderRadius: 12,
    padding: '36px 32px',
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'var(--color-error, #e05263)',
    borderRadius: '12px 12px 0 0',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--color-text, #e2e2e4)',
    marginBottom: 8,
    letterSpacing: '-0.01em',
  },
  message: {
    fontSize: 14,
    color: 'var(--color-text-muted, #8b8b9a)',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  errorId: {
    fontSize: 11,
    color: 'var(--color-text-faint, #4a4a57)',
    fontFamily: 'monospace',
    marginBottom: 16,
    letterSpacing: '0.04em',
  },
  details: {
    marginBottom: 20,
  },
  summary: {
    fontSize: 12,
    color: 'var(--color-text-muted, #8b8b9a)',
    cursor: 'pointer',
    userSelect: 'none',
    marginBottom: 8,
  },
  pre: {
    fontSize: 11,
    color: 'var(--color-text-muted, #8b8b9a)',
    background: 'var(--color-surface-offset, #1a1a1e)',
    border: '1px solid var(--color-border, rgba(255,255,255,0.06))',
    borderRadius: 6,
    padding: '10px 12px',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.5,
    maxHeight: 200,
    overflowY: 'auto',
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
  btnPrimary: {
    flex: 1,
    padding: '10px 0',
    background: 'var(--color-primary, #4f9cf9)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 150ms ease',
  },
  btnSecondary: {
    flex: 1,
    padding: '10px 0',
    background: 'transparent',
    color: 'var(--color-text-muted, #8b8b9a)',
    border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'border-color 150ms ease, color 150ms ease',
  },
};
