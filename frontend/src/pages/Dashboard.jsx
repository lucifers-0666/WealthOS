import React, { useMemo, Suspense, lazy } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { HOLDINGS as DEMO_HOLDINGS } from '../lib/data.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';
const DashboardCharts = lazy(() => import('../components/DashboardCharts.jsx'));

// ── palette tokens (forest green terminal) ─────────────────────
const C = {
  bg:          '#0a0e0a',
  surface:     '#111611',
  surface2:    '#161c16',
  border:      '#1e281e',
  borderSubtle:'#182018',
  text:        '#e8ede8',
  textMuted:   '#6b7f6b',
  textFaint:   '#3d4d3d',
  green:       '#4ade80',
  green2:      '#22c55e',
  red:         '#f87171',
  yellow:      '#fbbf24',
  blue:        '#60a5fa',
  teal:        '#2dd4bf',
};

function fmt(n) {
  if (n == null) return '\u2014';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function pct(n) {
  if (n == null) return '\u2014';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}

function StatCard({ label, value, sub, tone = 'neutral', isLoading = false }) {
  const valueColor =
    tone === 'positive' ? C.green
    : tone === 'negative' ? C.red
    : C.text;
  const subColor =
    tone === 'positive' ? C.green
    : tone === 'negative' ? C.red
    : C.textMuted;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px', minHeight: 118 }}>
      <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </div>
      {isLoading ? (
        <div className="skeleton-shimmer" style={{ height: 32, width: '60%', borderRadius: 4, marginBottom: 8 }} />
      ) : (
        <div style={{ fontSize: 26, fontWeight: 600, color: valueColor, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
          {value}
        </div>
      )}
      {isLoading ? (
        <div className="skeleton-shimmer" style={{ height: 14, width: '40%', borderRadius: 4 }} />
      ) : (
        <div style={{ fontSize: 12, color: subColor }}>{sub}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { portfolio, transactions, loading, error, refresh } = usePortfolio();
  const {
    holdings: liveHoldings,
    watchlist: liveWatchlist,
    marketStatus,
    wsStatus,
    forceRefresh,
  } = useMarketData();

  const liveHoldingsHaveValue = liveHoldings.some((h) => Number(h?.current_value || h?.current_value_inr || 0) > 0 || Number(h?.ltp || 0) > 0);
  const liveWatchlistHaveValue = liveWatchlist.some((item) => Number(item?.current_price || item?.ltp || 0) > 0);

  const holdings = liveHoldingsHaveValue ? liveHoldings : (portfolio?.holdings || []);
  const watchlist = liveWatchlistHaveValue ? liveWatchlist : (portfolio?.watchlist || []);

  const demoHoldings = useMemo(() => DEMO_HOLDINGS.map((item) => ({
    ticker: item.symbol,
    company_name: item.name,
    sector: item.symbol === 'VTI' || item.symbol === 'QQQ' ? 'US Market' : item.symbol === 'WIPRO' ? 'IT' : item.symbol === 'HDFCBANK' ? 'Banking' : item.symbol === 'RELIANCE' ? 'Energy' : item.symbol === 'INFY' ? 'IT' : 'Equity',
    current_value: Number(item.qty || 0) * Number(item.avg || 0),
    invested_amount: Number(item.qty || 0) * Number(item.avg || 0),
    day_change: 0,
    day_change_pct: 0,
    current_price: Number(item.ltp || item.avg || 0),
  })), []);

  const visibleHoldings = holdings.length && holdings.some((h) => Number(h?.current_value || 0) > 0)
    ? holdings
    : demoHoldings;

  const summary = useMemo(() => {
    if (!visibleHoldings.length) return portfolio?.summary || {};
    const current_value   = visibleHoldings.reduce((s, h) => s + (h.current_value   || 0), 0);
    const total_invested  = visibleHoldings.reduce((s, h) => s + (h.invested_amount || 0), 0);
    const total_pnl       = current_value - total_invested;
    const total_pnl_pct   = total_invested ? (total_pnl / total_invested) * 100 : 0;
    const day_change      = visibleHoldings.reduce((s, h) => s + (h.day_change      || 0), 0);
    const day_change_pct  = current_value ? (day_change / current_value) * 100 : 0;
    return { current_value, total_invested, total_pnl, total_pnl_pct, day_change, day_change_pct };
  }, [visibleHoldings, portfolio?.summary]);

  const allocationData = useMemo(() => {
    return visibleHoldings.map((h) => ({
      name: h.ticker || h.symbol || 'Unknown',
      value: h.current_value || 0,
    }));
  }, [visibleHoldings]);

  const topPositions = useMemo(
    () => visibleHoldings.slice().sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).slice(0, 6),
    [visibleHoldings],
  );

  const activity = useMemo(() => transactions.slice(0, 5), [transactions]);

  const showSkeleton = loading || (!visibleHoldings.length && !error);

  const kpis = [
    { label: 'Portfolio Value',   value: fmt(summary.current_value),  sub: 'Live portfolio valuation',           tone: 'neutral',  isLoading: showSkeleton },
    { label: 'Total Invested',    value: fmt(summary.total_invested),  sub: 'Cost basis across active positions', tone: 'neutral',  isLoading: showSkeleton },
    { label: 'Unrealised P&L',    value: fmt(summary.total_pnl),       sub: pct(summary.total_pnl_pct),           tone: (summary.total_pnl  || 0) >= 0 ? 'positive' : 'negative', isLoading: showSkeleton },
    { label: 'Day Change',        value: fmt(summary.day_change),      sub: pct(summary.day_change_pct),          tone: (summary.day_change || 0) >= 0 ? 'positive' : 'negative', isLoading: showSkeleton },
  ];

  const tickerRibbon = useMemo(() => {
    const base = [
      { ticker: 'NIFTY 50',  day_change_pct: marketStatus?.nifty_change   || 0, current_price: null },
      { ticker: 'SENSEX',    day_change_pct: marketStatus?.sensex_change   || 0, current_price: null },
      { ticker: 'BANKNIFTY', day_change_pct: marketStatus?.banknifty_change || 0, current_price: null },
      ...visibleHoldings.slice(0, 8),
    ];
    return [...base, ...base];
  }, [visibleHoldings, marketStatus]);

  // Connection badge
  let connColor = C.yellow;
  let connLabel = 'Connecting…';
  if (wsStatus === 'connected') { connColor = C.green; connLabel = 'Live'; }
  else if (wsStatus === 'error') { connColor = C.red;  connLabel = 'Reconnecting…'; }
  else if (marketStatus && !marketStatus.is_open) { connColor = C.yellow; connLabel = 'Markets Closed'; }

  if (loading && !liveHoldings.length) {
    return <PageLoadingState title="Loading command center\u2026" subtitle="Resolving live holdings, performance, and signal flow." />;
  }

  if (error && !liveHoldings.length) {
    return <PageErrorState title="Command center unavailable" message={error} />;
  }

  return (
    <div style={{ display: 'grid', gap: 0, padding: '0 0 24px 0' }}>

      {/* ── Command bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: 56, padding: '0 24px',
        borderBottom: `1px solid ${C.border}`, marginBottom: 20,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Command Center
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: connColor, display: 'inline-block' }} />
          <span style={{ color: connColor, fontWeight: 500 }}>{connLabel}</span>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ padding: '0 24px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {kpis.map((item) => <StatCard key={item.label} {...item} />)}
        </div>
      </div>

      {/* ── Ticker ribbon ── */}
      <div style={{
        overflow: 'hidden',
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        marginBottom: 20,
      }}>
        <div className="ticker-ribbon">
          <div className="ticker-ribbon-track" style={{ padding: '6px 0' }}>
            {tickerRibbon.map((item, index) => {
              const changeVal = item.day_change_pct || 0;
              const pColor = changeVal > 0 ? C.green : changeVal < 0 ? C.red : C.textMuted;
              return (
                <span
                  key={`${item.ticker}-${index}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRight: `1px solid ${C.borderSubtle}`, fontSize: 12, color: C.text }}
                >
                  <strong style={{ fontWeight: 600, color: C.textMuted }}>{item.ticker}</strong>
                  {item.current_price || item.current_price_inr ? (
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(item.current_price || item.current_price_inr)}</span>
                  ) : (
                    <span style={{ color: C.textFaint }}>—</span>
                  )}
                  <em style={{ color: pColor, fontStyle: 'normal' }}>{pct(changeVal)}</em>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, padding: '0 24px', alignItems: 'start' }}>

        {/* Left: Charts */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          {visibleHoldings.length ? (
            <Suspense fallback={<PageLoadingState title="Preparing charts\u2026" subtitle="Rendering allocation and exposure visuals." />}>
              <DashboardCharts
                allocationData={allocationData}
                topPositions={topPositions}
                chartData={portfolio?.history || []}
              />
            </Suspense>
          ) : (
            <EmptyState title="No holdings to chart" message="Import a portfolio to unlock allocations and live exposure visuals." />
          )}
        </div>

        {/* Right: side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* AI Brief */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, marginBottom: 10 }}>AI Brief</div>
            <div style={{ display: 'grid', gap: 8, color: C.textMuted, lineHeight: 1.65, fontSize: 13 }}>
              {visibleHoldings.length ? (
                <>
                  <p style={{ margin: 0 }}>You hold <strong style={{ color: C.text }}>{visibleHoldings.length}</strong> active positions.</p>
                  <p style={{ margin: 0 }}>Unrealised P&L: <strong style={{ color: (summary.total_pnl || 0) >= 0 ? C.green : C.red }}>{fmt(summary.total_pnl)} ({pct(summary.total_pnl_pct)})</strong></p>
                  <p style={{ margin: 0 }}>Largest: <strong style={{ color: C.text }}>{topPositions[0]?.ticker || topPositions[0]?.symbol || '\u2014'}</strong> at <strong style={{ color: C.text }}>{((topPositions[0]?.current_value || 0) / (summary.current_value || 1) * 100).toFixed(1)}%</strong></p>
                  <p style={{ margin: 0 }}>Watchlist: <strong style={{ color: C.text }}>{watchlist.length}</strong> tracked</p>
                </>
              ) : (
                <p style={{ margin: 0 }}>Add your first holding to activate the intelligence layer.</p>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, marginBottom: 10 }}>Activity Feed</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {activity.length ? activity.map((tx) => (
                <div key={tx.id || `${tx.ticker}-${tx.transaction_date}`} style={{ padding: '10px 12px', borderRadius: 6, border: `1px solid ${C.borderSubtle}`, background: C.surface2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{tx.ticker}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{tx.action} · {tx.quantity} units</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: tx.action === 'BUY' ? C.green : C.red }}>
                      {tx.action === 'BUY' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(tx.price)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ color: C.textFaint, fontSize: 13, padding: '10px 0' }}>No transaction history yet.</div>
              )}
            </div>
          </div>

          {/* Watchlist */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, marginBottom: 10 }}>Watchlist</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {watchlist.length ? watchlist.map((item) => (
                <div key={item.id || item.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px', borderRadius: 6, border: `1px solid ${C.borderSubtle}` }}>
                  <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{item.ticker}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    {item.current_price && (
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: C.text }}>{fmt(item.current_price)}</span>
                    )}
                    {item.change_pct != null && (
                      <span style={{ color: item.change_pct >= 0 ? C.green : C.red }}>{pct(item.change_pct)}</span>
                    )}
                    {!item.current_price && (
                      <span style={{ color: C.textMuted }}>{item.target_price ? fmt(item.target_price) : 'No target'}</span>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ color: C.textFaint, fontSize: 13 }}>
                  <a href="/app/watchlist" style={{ color: C.blue, textDecoration: 'none' }}>Add symbols from the Watchlist page →</a>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
