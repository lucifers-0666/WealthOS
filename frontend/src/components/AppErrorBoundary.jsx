import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { panelStyle, theme } from '../lib/theme.js';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ minHeight: '100dvh', padding: 24, display: 'grid', placeItems: 'center', background: theme.colors.bg }}>
          <div style={{ ...panelStyle({ padding: 24, maxWidth: 640, width: '100%' }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.warning, marginBottom: 12 }}>
              <AlertTriangle size={18} />
              <strong>WealthOS encountered a rendering issue</strong>
            </div>
            <p style={{ margin: 0, color: theme.colors.textSoft, lineHeight: 1.7 }}>
              The interface hit an unexpected problem, but your data and backend services remain untouched.
            </p>
            <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', color: theme.colors.textMuted, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 12, border: `1px solid ${theme.colors.border}` }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button onClick={this.handleReset} style={{ marginTop: 16, border: 0, borderRadius: 12, padding: '11px 14px', background: theme.colors.text, color: '#0A201F', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <RefreshCw size={15} /> Reload interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
