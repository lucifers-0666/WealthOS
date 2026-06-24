/**
 * LiveIndicator — shows a pulsing green dot when WS is live,
 * a yellow spinning dot when connecting, and a grey dot when disconnected.
 * Also shows a human-readable "Updated X seconds ago" label.
 */
import React, { useEffect, useState } from 'react';
import { getISTMarketStatus } from '../lib/marketTime.js';

const STYLES = {
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.72rem',
    letterSpacing: '0.03em',
    userSelect: 'none',
  },
  dot: (status) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    background:
      status === 'open'         ? 'var(--color-success, #4ade80)'
      : status === 'connecting' ? 'var(--color-gold, #facc15)'
      :                           'var(--color-text-faint, #6b7280)',
    boxShadow:
      status === 'open' ? '0 0 0 0 var(--color-success, #4ade80)' : 'none',
    animation:
      status === 'open'         ? 'ws-pulse 2s infinite'
      : status === 'connecting' ? 'ws-spin 1s linear infinite'
      :                           'none',
  }),
  label: {
    color: 'var(--color-text-muted, #9ca3af)',
  },
};

const KEYFRAMES = `
@keyframes ws-pulse {
  0%   {  }
  70%  {  }
  100% {  }
}
@keyframes ws-spin {
  to { transform: rotate(360deg); }
}
`;

function useSecondsAgo(updatedAt) {
  const [secs, setSecs] = useState(null);
  useEffect(() => {
    if (!updatedAt) { setSecs(null); return; }
    const calc = () => {
      const diff = Math.floor(Date.now() / 1000 - updatedAt);
      setSecs(diff < 0 ? 0 : diff);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [updatedAt]);
  return secs;
}

export default function LiveIndicator({ wsStatus, updatedAt, className }) {
  const secs = useSecondsAgo(updatedAt);

  const marketInfo = getISTMarketStatus();
  const isMarketOpen = marketInfo.status === 'open' || marketInfo.status === 'preopen';

  const label = !isMarketOpen ? 'Market Closed' :
    wsStatus === 'open'
      ? secs === null ? 'Live'
        : secs < 5     ? 'Just updated'
        : `Updated ${secs}s ago`
    : wsStatus === 'connecting' ? 'Connecting…'
    : 'Disconnected';

  const effectiveStatus = !isMarketOpen ? 'closed' : wsStatus;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <span style={STYLES.wrapper} className={className} title={label}>
        <span style={STYLES.dot(effectiveStatus)} aria-hidden="true" />
        <span style={STYLES.label}>{label}</span>
      </span>
    </>
  );
}
