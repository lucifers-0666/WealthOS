import React, { useState, useEffect } from 'react';
import { getISTMarketStatus } from '../lib/marketTime.js';

export default function MarketStatusBadge() {
  const [marketInfo, setMarketInfo] = useState(getISTMarketStatus);

  // Re-evaluate every 30 seconds — catches the open/close transition live
  useEffect(() => {
    const id = setInterval(() => setMarketInfo(getISTMarketStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dotColor = {
    gain:    'var(--status-gain)',
    loss:    'var(--status-loss)',
    warning: 'var(--status-warning)',
  }[marketInfo.color] || 'var(--status-neutral)';

  return (
    <div className={`market-badge market-badge--${marketInfo.status}`} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 11px', borderRadius: 3,
      border: `1px solid var(--border-${marketInfo.color === 'warning' ? 'warning' : marketInfo.color === 'gain' ? 'gain' : 'loss'})`,
      background: `var(--fill-${marketInfo.color === 'warning' ? 'warning' : marketInfo.color === 'gain' ? 'gain' : 'loss'})`,
      fontSize: 12, fontWeight: 700,
      color: dotColor,
      cursor: 'default',
      userSelect: 'none',
      transition: 'all 300ms ease',
    }}>
      <span
        className="market-badge__dot"
        style={{ 
          display: 'block', width: 7, height: 7, borderRadius: '50%',
          background: dotColor 
        }}
        aria-hidden="true"
      />
      <span className="market-badge__label">{marketInfo.label}</span>
    </div>
  );
}
