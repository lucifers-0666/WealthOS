import React, { useMemo, Suspense, lazy, useEffect, useState } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { HOLDINGS as DEMO_HOLDINGS } from '../lib/data.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { request } from '../services/api.js';
const DashboardCharts = lazy(() => import('../components/DashboardCharts.jsx'));

// ── palette ────────────────────────────────────────────────────
const C = {
  bg:       '#0b0f0b',
  card:     '#111811',
  cardHov:  '#162016',
  border:   '#1f2b1f',
  borderSub:'#192319',
  text:     '#dceadc',
  muted:    '#6b806b',
  faint:    '#3a4a3a',
  green:    '#4ade80',
  green2:   '#22c55e',
  red:      '#f87171',
  yellow:   '#fbbf24',
  blue:     '#60a5fa',
  teal:     '#2dd4bf',
};

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function fmt(n) {
  if (n == null || isNaN(n)) return '\u2014';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function pct(n) {
  if (n == null || isNaN(n)) return '\u2014';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}

// ── StatCard with skeleton ─────────────────────────────────────
function StatCard({ label, value, sub, tone = 'neutral', isLoading = false }) {
  const valueColor = tone === 'positive' ? C.green : tone === 'negative' ? C.red : C.text;
  const subColor   = tone === 'positive' ? C.green : tone === 'negative' ? C.red : C.muted;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px', minHeight: 110 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      {isLoading
        ? <div style={{ height: 30, width: '60%', borderRadius: 4, background: C.cardHov, marginBottom: 8 }} />
        : <div style={{ fontSize: 26, fontWeight: 600, color: valueColor, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>{value}</div>}
      {isLoading
        ? <div style={{ height: 13, width: '40%', borderRadius: 4, background: C.cardHov }} />
        : <div style={{ fontSize: 12, color: subColor }}>{sub}</div>}
    </div>
  );
}

// ── TickerTape ─────────────────────────────────────────────────
function TickerItem({ name, value, change }) {
  const color  = change > 0 ? C.green : change < 0 ? C.red : C.yellow;
  const prefix = change > 0 ? '▲' : change < 0 ? '▼' : '—';
  const val = typeof value === 'number' && value > 0
    ? (value > 1000 ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`)
    : (value || '—');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 22px', borderRight: `1px solid ${C.borderSub}`, fontSize: 11, flexShrink: 0, height: '100%' }}>
      <span style={{ color: C.muted, fontWeight: 600, letterSpacing: '0.05em' }}>{name}</span>
      <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
      <span style={{ fontSize: 10, color }}>{prefix} {Math.abs(change).toFixed(2)}%</span>
    </span>
  );
}

function TickerTape({ items }) {
  const doubled = [...items, ...items];
  return (
    <div style={{
      width: '100%', overflow: 'hidden',
      background: C.card,
      borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
      height: 36, display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', gap: 0,
        animation: 'ticker-scroll 50s linear infinite',
        whiteSpace: 'nowrap', height: '100%', alignItems: 'center',
      }}>
        {doubled.map((item, i) => <TickerItem key={i} {...item} />)}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const { portfolio, transactions, loading, error } = usePortfolio();
  const { holdings: liveHoldings, watchlist: liveWatchlist, marketStatus, wsStatus } = useMarketData();

  const [sparkData, setSparkData] = useState([]);
  const [tickerItems, setTickerItems] = useState([
    { name: 'NIFTY 50',  value: 0, change: 0 },
    { name: 'SENSEX',    value: 0, change: 0 },
    { name: 'BANKNIFTY', value: 0, change: 0 },
  ]);

  // Fetch sparkline data
  useEffect(() => {
    request('GET', '/api/portfolio/history', null, { days: 7 })
      .then(data => { if (Array.isArray(data)) setSparkData(data.map(d => ({ v: d.value }))); })
      .catch(() => {});
  }, []);

  // Fetch ticker data every 60s
  useEffect(() => {
    const load = () => {
      request('GET', '/api/market/ticker')
        .then(data => { if (Array.isArray(data)) setTickerItems(data); })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const liveHoldingsHaveValue = liveHoldings.some(h => Number(h?.current_value || 0) > 0 || Number(h?.ltp || 0) > 0);
  const liveWatchlistHaveValue = liveWatchlist.some(item => Number(item?.current_price || 0) > 0);

  const holdings = liveHoldingsHaveValue ? liveHoldings : (portfolio?.holdings || []);
  const watchlist = liveWatchlistHaveValue ? liveWatchlist : (portfolio?.watchlist || []);

  const demoHoldings = useMemo(() => DEMO_HOLDINGS.map(item => ({
    ticker: item.symbol,
    name: item.name,
    company_name: item.name,
    sector: item.symbol === 'VTI' || item.symbol === 'QQQ' ? 'US Market' : item.symbol === 'WIPRO' ? 'IT' : item.symbol === 'HDFCBANK' ? 'Banking' : item.symbol === 'RELIANCE' ? 'Energy' : item.symbol === 'INFY' ? 'IT' : 'Equity',
    current_value: Number(item.qty || 0) * Number(item.avg || 0),
    invested_amount: Number(item.qty || 0) * Number(item.avg || 0),
    day_change: 0, day_change_pct: 0,
    current_price: Number(item.ltp || item.avg || 0),
  })), []);

  const visibleHoldings = holdings.length && holdings.some(h => Number(h?.current_value || 0) > 0)
    ? holdings : demoHoldings;

  const summary = useMemo(() => {
    if (!visibleHoldings.length) return portfolio?.summary || {};
    const current_value  = visibleHoldings.reduce((s, h) => s + (h.current_value  || 0), 0);
    const total_invested = visibleHoldings.reduce((s, h) => s + (h.invested_amount || 0), 0);
    const total_pnl      = current_value - total_invested;
    const total_pnl_pct  = total_invested ? (total_pnl / total_invested) * 100 : 0;
    const day_change     = visibleHoldings.reduce((s, h) => s + (h.day_change     || 0), 0);
    const day_change_pct = current_value ? (day_change / current_value) * 100 : 0;
    return { current_value, total_invested, total_pnl, total_pnl_pct, day_change, day_change_pct };
  }, [visibleHoldings, portfolio?.summary]);

  const allocationData = useMemo(() => visibleHoldings.map(h => ({
    name: h.company_name || h.name || h.ticker || 'Unknown',
    ticker: h.ticker || h.symbol,
    value: h.current_value || 0,
  })), [visibleHoldings]);

  const topPositions = useMemo(
    () => visibleHoldings.slice().sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).slice(0, 8),
    [visibleHoldings]
  );

  const activity = useMemo(() => (transactions || []).slice(0, 5), [transactions]);

  const showSkeleton = loading && !liveHoldings.length;

  const kpis = [
    { label: 'Portfolio Value',  value: fmt(summary.current_value),  sub: 'Live portfolio valuation',           tone: 'neutral',  isLoading: showSkeleton },
    { label: 'Total Invested',   value: fmt(summary.total_invested),  sub: 'Cost basis across active positions', tone: 'neutral',  isLoading: showSkeleton },
    { label: 'Unrealised P&L',   value: fmt(summary.total_pnl),       sub: pct(summary.total_pnl_pct),           tone: (summary.total_pnl  || 0) >= 0 ? 'positive' : 'negative', isLoading: showSkeleton },
    { label: 'Day Change',       value: fmt(summary.day_change),      sub: pct(summary.day_change_pct),          tone: (summary.day_change || 0) >= 0 ? 'positive' : 'negative', isLoading: showSkeleton },
  ];

  // Connection badge
  let connColor = C.yellow; let connLabel = 'Connecting…';
  if (wsStatus === 'connected') { connColor = C.green; connLabel = 'Live'; }
  else if (wsStatus === 'error') { connColor = C.red; connLabel = 'Reconnecting…'; }
  else if (marketStatus && !marketStatus.is_open) { connColor = C.yellow; connLabel = 'Markets Closed'; }

  if (loading && !liveHoldings.length) return <PageLoadingState title="Loading command center…" subtitle="Resolving live holdings, performance, and signal flow." />;
  if (error && !liveHoldings.length) return <PageErrorState title="Command center unavailable" message={error} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg }}>

      {/* ── Command bar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: 48, flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Command Center</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: connColor, display: 'inline-block', animation: connColor === C.green ? 'livepulse 2s ease-in-out infinite' : 'none' }} />
            <span style={{ fontSize: 11, color: connColor }}>{connLabel}</span>
          </span>
        </div>
        <span style={{ fontSize: 11, color: C.faint }}>{visibleHoldings.length} positions</span>
      </div>

      {/* ── Scrollable body ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* KPI row */}
        <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {kpis.map(item => <StatCard key={item.label} {...item} />)}
          </div>
        </div>

        {/* Ticker tape */}
        <div style={{ flexShrink: 0, marginTop: 16 }}>
          <TickerTape items={tickerItems} />
        </div>

        {/* Body grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 320px',
          gap: 16, padding: '16px 24px 24px',
          alignItems: 'start', flex: 1,
        }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Charts card */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
              {visibleHoldings.length ? (
                <Suspense fallback={<PageLoadingState title="Preparing charts…" subtitle="Rendering allocation and exposure visuals." />}>
                  <DashboardCharts
                    allocationData={allocationData}
                    topPositions={topPositions}
                    portfolioValue={summary.current_value}
                  />
                </Suspense>
              ) : (
                <EmptyState title="No holdings to chart" message="Import a portfolio to unlock allocations and live exposure visuals." />
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320, flexShrink: 0 }}>

            {/* AI Brief */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 10 }}>AI Brief</div>
              <div style={{ display: 'grid', gap: 8, color: C.muted, lineHeight: 1.65, fontSize: 13 }}>
                {visibleHoldings.length ? (
                  <>
                    <p style={{ margin: 0 }}>You hold <strong style={{ color: C.text }}>{visibleHoldings.length}</strong> active positions.</p>
                    <p style={{ margin: 0 }}>Unrealised P&L: <strong style={{ color: (summary.total_pnl || 0) >= 0 ? C.green : C.red }}>{fmt(summary.total_pnl)} ({pct(summary.total_pnl_pct)})</strong></p>
                    <p style={{ margin: 0 }}>Largest: <strong style={{ color: C.text }}>{topPositions[0]?.ticker || topPositions[0]?.symbol || '—'}</strong> at <strong style={{ color: C.text }}>{((topPositions[0]?.current_value || 0) / (summary.current_value || 1) * 100).toFixed(1)}%</strong></p>
                    <p style={{ margin: 0 }}>Watchlist: <strong style={{ color: C.text }}>{watchlist.length}</strong> tracked</p>
                    {sparkData.length > 1 && (
                      <div style={{ marginTop: 8, height: 48 }}>
                        <ResponsiveContainer width="100%" height={48}>
                          <LineChart data={sparkData}>
                            <Line type="monotone" dataKey="v" stroke={C.green} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ margin: 0 }}>Add your first holding to activate the intelligence layer.</p>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 10 }}>Activity Feed</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {activity.length ? activity.map((tx, i) => (
                  <div key={tx.id || i} style={{ padding: '9px 12px', borderRadius: 6, border: `1px solid ${C.borderSub}`, background: C.cardHov }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: tx.action === 'BUY' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                          color: tx.action === 'BUY' ? C.green : C.red,
                          border: `1px solid ${tx.action === 'BUY' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                        }}>{tx.action}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{tx.ticker}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{tx.quantity} @ {fmt(tx.price)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: tx.action === 'BUY' ? C.green : C.red }}>
                        {tx.action === 'BUY' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ color: C.faint, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.faint }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>No transactions yet.</span>
                    <a href="/app/upload" style={{ color: C.blue, textDecoration: 'none', fontSize: 12 }}>Import your holdings →</a>
                  </div>
                )}
              </div>
            </div>

            {/* Watchlist */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 10 }}>Watchlist</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {watchlist.length ? watchlist.map(item => (
                  <div key={item.id || item.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.borderSub}` }}>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{item.ticker}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                      {item.current_price && <span style={{ fontVariantNumeric: 'tabular-nums', color: C.text }}>{fmt(item.current_price)}</span>}
                      {item.change_pct != null && <span style={{ color: item.change_pct >= 0 ? C.green : C.red }}>{pct(item.change_pct)}</span>}
                      {!item.current_price && <span style={{ color: C.muted }}>{item.target_price ? fmt(item.target_price) : 'No target'}</span>}
                    </div>
                  </div>
                )) : (
                  <a href="/app/watchlist" style={{ color: C.blue, textDecoration: 'none', fontSize: 13 }}>Add symbols from the Watchlist page →</a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
