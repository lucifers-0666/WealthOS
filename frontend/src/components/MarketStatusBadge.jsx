/**
 * MarketStatusBadge.jsx
 * Premium real-time market session indicator for WealthOS header.
 * Shows: Open / Pre-Market / After Hours / Closed
 * Displays live IST clock and next open time.
 */

import { useMarketStatus } from '../lib/useMarketStatus.js';

const SESSION_STYLES = {
  open: {
    color: '#6FAE8D',
    border: 'rgba(111,174,141,0.22)',
    bg: 'rgba(111,174,141,0.07)',
    dot: '#6FAE8D',
    pulse: true,
  },
  pre_open: {
    color: '#C8B38E',
    border: 'rgba(200,179,142,0.22)',
    bg: 'rgba(200,179,142,0.07)',
    dot: '#C8B38E',
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
    color: '#6B7F78',
    border: 'rgba(107,127,120,0.18)',
    bg: 'rgba(107,127,120,0.05)',
    dot: '#6B7F78',
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
        border: '1px solid rgba(107,127,120,0.18)',
        background: 'rgba(107,127,120,0.05)',
        fontSize: 12, color: '#6B7F78',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6B7F78', display: 'inline-block' }} />
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
