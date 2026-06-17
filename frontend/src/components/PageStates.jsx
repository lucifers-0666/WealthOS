import React from 'react';
import { AlertTriangle, Loader2, Inbox } from 'lucide-react';
import { panelStyle, theme } from '../lib/theme.js';

export function PageLoadingState({ title = 'Loading Arca…', subtitle = 'Preparing secure market context.' }) {
  return (
    <div style={{ ...panelStyle({ padding: 24, minHeight: 240, display: 'grid', placeItems: 'center' }) }}>
      <div style={{ textAlign: 'center', color: theme.colors.textSoft }}>
        <Loader2 size={22} className="animate-spin-slow" style={{ marginBottom: 12 }} />
        <div style={{ color: theme.colors.text, fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{subtitle}</div>
      </div>
    </div>
  );
}

export function PageErrorState({ title = 'Unable to load content', message = 'We hit a temporary service issue.' }) {
  return (
    <div style={{ ...panelStyle({ padding: 24, minHeight: 220 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.warning, marginBottom: 10 }}>
        <AlertTriangle size={18} />
        <strong>{title}</strong>
      </div>
      <div style={{ color: theme.colors.textSoft, lineHeight: 1.65 }}>{message}</div>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message = 'This section will populate once data arrives.' }) {
  return (
    <div style={{ ...panelStyle({ padding: 24, minHeight: 180, display: 'grid', placeItems: 'center' }) }}>
      <div style={{ textAlign: 'center', color: theme.colors.textSoft }}>
        <Inbox size={22} style={{ marginBottom: 12 }} />
        <div style={{ color: theme.colors.text, fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{message}</div>
      </div>
    </div>
  );
}
