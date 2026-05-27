/**
 * WSHealthMonitor — unobtrusive status bar shown only when WS is not healthy.
 * Shows: reconnecting spinner, stale data warning, last updated timestamp.
 */
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { useEffect, useState } from 'react';

function formatAge(ms) {
  if (!ms) return 'never';
  const age = Math.floor((Date.now() - ms) / 1000);
  if (age < 60) return `${age}s ago`;
  if (age < 3600) return `${Math.floor(age / 60)}m ago`;
  return `${Math.floor(age / 3600)}h ago`;
}

export function WSHealthMonitor() {
  const { connectionStatus, lastUpdated, isConnected } = useMarketData();
  const [ageStr, setAgeStr] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgeStr(formatAge(lastUpdated));
      setVisible(!isConnected || (lastUpdated && Date.now() - lastUpdated > 30_000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, lastUpdated]);

  if (!visible) return null;

  const isReconnecting = connectionStatus === 'connecting';
  const isStaleData = isConnected && lastUpdated && Date.now() - lastUpdated > 30_000;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.875rem',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
        backdropFilter: 'blur(12px)',
        background: isReconnecting
          ? 'rgba(220,150,0,0.12)'
          : isStaleData
          ? 'rgba(160,80,0,0.12)'
          : 'rgba(200,0,50,0.12)',
        border: `1px solid ${
          isReconnecting ? 'rgba(220,150,0,0.3)'
          : isStaleData ? 'rgba(160,80,0,0.3)'
          : 'rgba(200,0,50,0.3)'
        }`,
        color: isReconnecting ? '#d4a017' : isStaleData ? '#c07000' : '#cc2244',
      }}
      role="status"
      aria-live="polite"
    >
      {isReconnecting && (
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'wsspin 0.8s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {!isReconnecting && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      )}
      <span>
        {isReconnecting
          ? 'Reconnecting to market feed…'
          : isStaleData
          ? `Market data may be stale · Updated ${ageStr}`
          : 'Market feed disconnected'}
      </span>
      <style>{`@keyframes wsspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/**
 * StalePriceIndicator — inline badge for a single symbol's price staleness.
 */
export function StalePriceIndicator({ symbol, style }) {
  const { isStale, getPrice } = useMarketData();
  const price = getPrice(symbol);
  const stale = isStale(symbol);

  if (!stale || !price) return null;

  const age = price._ts ? Math.floor((Date.now() - price._ts) / 1000) : null;

  return (
    <span
      title={`Price may be delayed${age ? ` (updated ${age}s ago)` : ''}`}
      style={{
        fontSize: '0.65rem',
        color: '#c07000',
        background: 'rgba(192,112,0,0.1)',
        border: '1px solid rgba(192,112,0,0.25)',
        borderRadius: '0.25rem',
        padding: '1px 4px',
        letterSpacing: '0.03em',
        ...style,
      }}
    >
      DELAYED
    </span>
  );
}

/**
 * PriceSourceBadge — tiny indicator of data source confidence
 */
export function PriceSourceBadge({ symbol }) {
  const { getPrice } = useMarketData();
  const price = getPrice(symbol);
  if (!price?.fetch_source) return null;

  const src = price.fetch_source.toUpperCase();
  const conf = price.confidence || 'medium';
  const color = conf === 'high' ? '#16a34a' : conf === 'medium' ? '#ca8a04' : '#dc2626';

  return (
    <span
      title={`Source: ${src} · Confidence: ${conf}${price.latency_ms ? ` · ${price.latency_ms}ms` : ''}`}
      style={{
        fontSize: '0.6rem',
        color,
        opacity: 0.7,
        letterSpacing: '0.04em',
        cursor: 'default',
      }}
    >
      {src}
    </span>
  );
}

export default WSHealthMonitor;
