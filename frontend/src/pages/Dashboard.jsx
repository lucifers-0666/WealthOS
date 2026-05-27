import React, { useMemo, Suspense, lazy } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { theme, panelStyle } from '../lib/theme.js';
import { RefreshCw, TrendingDown, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';
import LiveIndicator from '../components/LiveIndicator.jsx';
const DashboardCharts = lazy(() => import('../components/DashboardCharts.jsx'));

function fmt(n) {
  if (n == null) return '\u2014';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function pct(n) {
  if (n == null) return '\u2014';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}

function StatCard({ label, value, sub, tone = 'neutral', live = false }) {
  const color =
    tone === 'positive' ? theme.colors.success
    : tone === 'negative' ? theme.colors.error
    : theme.colors.text;
  return (
    <div style={{ ...panelStyle({ padding: 18, minHeight: 118 }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.colors.textMuted }}>
          {label}
        </div>
        {live && (
          <span style={{
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--color-success, #4ade80)',
            border: '1px solid var(--color-success, #4ade80)',
            borderRadius: 999, padding: '1px 6px',
          }}>LIVE</span>
        )}
      </div>
      <div style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 30, lineHeight: 1, color, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: theme.colors.textSoft }}>{sub}</div>
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
    updatedAt,
    isLive,
    forceRefresh,
  } = useMarketData();

  // Prefer live holdings from WS; fall back to static portfolio
  const holdings = liveHoldings.length > 0 ? liveHoldings : (portfolio?.holdings || []);
  const watchlist = liveWatchlist.length > 0 ? liveWatchlist : (portfolio?.watchlist || []);

  const summary = useMemo(() => {
    if (!holdings.length) return portfolio?.summary || {};
    const current_value   = holdings.reduce((s, h) => s + (h.current_value   || 0), 0);
    const total_invested  = holdings.reduce((s, h) => s + (h.invested_amount || 0), 0);
    const total_pnl       = current_value - total_invested;
    const total_pnl_pct   = total_invested ? (total_pnl / total_invested) * 100 : 0;
    const day_change      = holdings.reduce((s, h) => s + (h.day_change      || 0), 0);
    const day_change_pct  = current_value ? (day_change / current_value) * 100 : 0;
    return { current_value, total_invested, total_pnl, total_pnl_pct, day_change, day_change_pct };
  }, [holdings, portfolio?.summary]);

  const allocationData = useMemo(() => {
    const groups = {};
    holdings.forEach((h) => {
      const key = h.asset_class || 'Other';
      groups[key] = (groups[key] || 0) + (h.current_value || 0);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const topPositions = useMemo(
    () => holdings.slice().sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).slice(0, 6),
    [holdings],
  );

  const activity = useMemo(() => transactions.slice(0, 5), [transactions]);

  const kpis = [
    { label: 'Portfolio value',  value: fmt(summary.current_value),  sub: 'Live portfolio valuation',         tone: 'neutral',  live: isLive },
    { label: 'Total invested',   value: fmt(summary.total_invested),  sub: 'Cost basis across active positions', tone: 'neutral',  live: false  },
    { label: 'Unrealised P&L',   value: fmt(summary.total_pnl),       sub: pct(summary.total_pnl_pct),         tone: (summary.total_pnl   || 0) >= 0 ? 'positive' : 'negative', live: isLive },
    { label: 'Day change',       value: fmt(summary.day_change),      sub: pct(summary.day_change_pct),        tone: (summary.day_change  || 0) >= 0 ? 'positive' : 'negative', live: isLive },
  ];

  const tickerRibbon = useMemo(() => {
    const base = [
      { ticker: 'NIFTY 50',  day_change_pct: marketStatus?.nifty_change  || 0, current_price: null },
      { ticker: 'SENSEX',    day_change_pct: marketStatus?.sensex_change  || 0, current_price: null },
      { ticker: 'BANKNIFTY', day_change_pct: marketStatus?.banknifty_change || 0, current_price: null },
      ...holdings.slice(0, 8),
    ];
    return [...base, ...base];
  }, [holdings, marketStatus]);

  const handleRefresh = () => {
    refresh();
    forceRefresh();
  };

  if (loading && !liveHoldings.length) {
    return <PageLoadingState title="Loading command center\u2026" subtitle="Resolving live holdings, performance, and signal flow." />;
  }

  if (error && !liveHoldings.length) {
    return <PageErrorState title="Command center unavailable" message={error} />;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Hero panel */}
      <section style={{ ...panelStyle({ padding: 24, overflow: 'hidden' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 22 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 10 }}>
              Portfolio command center
            </div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(2rem, 3vw, 3.2rem)', letterSpacing: '-0.05em', lineHeight: 1.02 }}>
              Institutional view of your capital, risk, and signal flow.
            </h2>
            <p style={{ margin: '14px 0 0', color: theme.colors.textSoft, fontSize: 15, lineHeight: 1.65 }}>
              WealthOS consolidates holdings, market context, and AI insights into one calm operating layer.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <LiveIndicator wsStatus={wsStatus} updatedAt={updatedAt} />
            <button
              onClick={handleRefresh}
              style={{
                border: `1px solid ${theme.colors.border}`, borderRadius: 12,
                padding: '11px 14px', background: 'rgba(255,255,255,0.01)',
                color: theme.colors.text, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Market status banner */}
        {marketStatus && (
          <div style={{
            marginBottom: 16, padding: '8px 14px', borderRadius: 10,
            background: marketStatus.is_open
              ? 'rgba(74,222,128,0.06)'
              : 'rgba(255,255,255,0.02)',
            border: `1px solid ${marketStatus.is_open ? 'rgba(74,222,128,0.2)' : theme.colors.border}`,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
            color: theme.colors.textSoft,
          }}>
            {marketStatus.is_open
              ? <Wifi size={14} color="var(--color-success,#4ade80)" />
              : <WifiOff size={14} />}
            <span>
              {marketStatus.is_open
                ? `Market OPEN \u2014 ${marketStatus.exchange || 'NSE'}`
                : `Market CLOSED \u2014 next open ${marketStatus.next_open || 'Mon 09:15 IST'}`
              }
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {kpis.map((item) => <StatCard key={item.label} {...item} />)}
        </div>

        {/* Ticker ribbon */}
        <div className="ticker-ribbon" style={{ marginTop: 16 }}>
          <div className="ticker-ribbon-track">
            {tickerRibbon.map((item, index) => (
              <span
                key={`${item.ticker}-${index}`}
                className={(item.day_change_pct || 0) >= 0 ? 'ticker-up' : 'ticker-down'}
              >
                <strong>{item.ticker}</strong>
                {item.current_price ? fmt(item.current_price) : (item.current_price_inr ? fmt(item.current_price_inr) : 'Index')}
                <em>{pct(item.day_change_pct || 0)}</em>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Body grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            {holdings.length ? (
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
        </div>

        <aside style={{ display: 'grid', gap: 18 }}>
          {/* AI brief */}
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">AI brief</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 12px', fontSize: 18 }}>Portfolio intelligence summary</h3>
            <div style={{ display: 'grid', gap: 12, color: theme.colors.textSoft, lineHeight: 1.65, fontSize: 14 }}>
              <p style={{ margin: 0 }}>You hold <strong style={{ color: theme.colors.text }}>{holdings.length}</strong> active positions with <strong style={{ color: theme.colors.text }}>{pct(summary.total_pnl_pct)}</strong> unrealised return.</p>
              <p style={{ margin: 0 }}>Largest exposure: <strong style={{ color: theme.colors.text }}>{topPositions[0]?.ticker || '\u2014'}</strong>. Watchlist coverage: <strong style={{ color: theme.colors.text }}>{watchlist.length}</strong> names.</p>
              <p style={{ margin: 0 }}>Signals are calm. Use the Advisor for rebalancing, tax, and concentration planning.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft, fontSize: 12 }}>Risk: Balanced</div>
              <div style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: isLive ? 'var(--color-success,#4ade80)' : theme.colors.textSoft, fontSize: 12 }}>Sync: {isLive ? 'Live' : 'Cached'}</div>
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Activity feed</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 12px', fontSize: 18 }}>Recent transactions</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {activity.length ? activity.map((tx) => (
                <div key={tx.id || `${tx.ticker}-${tx.transaction_date}`} style={{ padding: 14, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{tx.ticker}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>{tx.action} \u00b7 {tx.quantity} units</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tx.action === 'BUY' ? theme.colors.success : theme.colors.error }}>
                      {tx.action === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(tx.price)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ color: theme.colors.textMuted, padding: '14px 0' }}>No transaction history yet.</div>
              )}
            </div>
          </div>

          {/* Watchlist */}
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Watchlist</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 12px', fontSize: 18 }}>Market attention set</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {watchlist.length ? watchlist.map((item) => (
                <div key={item.id || item.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}` }}>
                  <span style={{ fontWeight: 700 }}>{item.ticker}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                    {item.current_price && (
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.text }}>
                        {fmt(item.current_price)}
                      </span>
                    )}
                    {item.change_pct != null && (
                      <span style={{ color: item.change_pct >= 0 ? 'var(--color-success,#4ade80)' : 'var(--color-error,#f87171)' }}>
                        {pct(item.change_pct)}
                      </span>
                    )}
                    {!item.current_price && (
                      <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        {item.target_price ? fmt(item.target_price) : 'No target'}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ color: theme.colors.textMuted }}>No watchlist yet.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
