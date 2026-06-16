/**
 * MarketStatusBadge.jsx
 * Premium real-time market session indicator for WealthOS header.
 * Shows: Open / Pre-Market / After Hours / Closed
 * Displays live IST clock and next open time.
 */

import { useMarketStatus } from '../lib/useMarketStatus.js';

const SESSION_STYLES = {
  open: {
    color: 'var(--aegean-green)',
    border: 'rgba(74,138,106,0.22)',
    bg: 'rgba(74,138,106,0.07)',
    dot: 'var(--aegean-green)',
    pulse: true,
  },
  pre_open: {
    color: 'var(--greek-gold)',
    border: 'rgba(212,160,23,0.22)',
    bg: 'rgba(212,160,23,0.07)',
    dot: 'var(--greek-gold)',
    pulse: false,
  },
  after_hours: {
    color: '#86A3C4',
    border: 'rgba(134,163,196,0.22)',
    bg: 'rgba(134,163,196,0.06)',
    dot: '#86A3C4',
    pulse: false,
  },
  closed: {
    color: 'var(--text-faint)',
    border: 'var(--border-subtle)',
    bg: 'transparent',
    dot: 'var(--text-faint)',
    pulse: false,
  },
};

export default function MarketStatusBadge({ showClock = true, showNextOpen = true }) {
  const { status, loading } = useMarketStatus();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 11px', borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        background: 'transparent',
        fontSize: 12, color: 'var(--text-faint)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-faint)', display: 'inline-block' }} />
        <span className="mono">--:--:--</span>
      </div>
    );
  }

  const s = SESSION_STYLES[status.session] || SESSION_STYLES.closed;

  return (
    <div
      title={`${status.exchange} · ${status.timezone}${status.next_open_label ? ' · ' + status.next_open_label : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 11px', borderRadius: 12,
        border: `1px solid ${s.border}`,
        background: s.bg,
        fontSize: 12, fontWeight: 700,
        color: s.color,
        cursor: 'default',
        userSelect: 'none',
        transition: 'all 300ms ease',
      }}
    >
      {/* Status dot — pulses only when open */}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          display: 'block', width: 7, height: 7, borderRadius: '50%',
          background: s.dot,
          boxShadow: s.pulse ? `0 0 8px ${s.dot}` : 'none',
        }} />
        {s.pulse && (
          <span style={{
            position: 'absolute', inset: -3,
            borderRadius: '50%',
            background: s.dot,
            opacity: 0.25,
            animation: 'market-pulse 2s ease-in-out infinite',
          }} />
        )}
      </span>

      {/* Label */}
      <span>{status.label}</span>

      {/* Live clock */}
      {showClock && (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, letterSpacing: '0.02em' }}>
          {status.current_time_ist}
        </span>
      )}

      {/* Next open — only shown when closed/after-hours */}
      {showNextOpen && status.next_open_label && !['open', 'pre_open'].includes(status.session) && (
        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>
          · {status.next_open_label}
        </span>
      )}
    </div>
  );
}
