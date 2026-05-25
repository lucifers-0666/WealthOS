import React, { useMemo, Suspense, lazy } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { theme, panelStyle } from '../lib/theme.js';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';
const DashboardCharts = lazy(() => import('../components/DashboardCharts.jsx'));

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function pct(n) {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}

function StatCard({ label, value, sub, tone = 'neutral' }) {
  const color = tone === 'positive' ? theme.colors.success : tone === 'negative' ? theme.colors.error : theme.colors.text;
  return (
    <div style={{ ...panelStyle({ padding: 18, minHeight: 118 }) }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 30, lineHeight: 1, color, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: theme.colors.textSoft }}>{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { portfolio, holdings, transactions, watchlist, loading, error, refresh } = usePortfolio();

  const summary = portfolio?.summary || {};

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
    { label: 'Portfolio value', value: fmt(summary.current_value), sub: 'Live portfolio valuation', tone: 'neutral' },
    { label: 'Total invested', value: fmt(summary.total_invested), sub: 'Cost basis across active positions', tone: 'neutral' },
    { label: 'Unrealised P&L', value: fmt(summary.total_pnl), sub: pct(summary.total_pnl_pct), tone: (summary.total_pnl || 0) >= 0 ? 'positive' : 'negative' },
    { label: 'Day change', value: fmt(summary.day_change), sub: pct(summary.day_change_pct), tone: (summary.day_change || 0) >= 0 ? 'positive' : 'negative' },
  ];

  if (loading) {
    return <PageLoadingState title="Loading command center…" subtitle="Resolving live holdings, performance, and signal flow." />;
  }

  if (error) {
    return <PageErrorState title="Command center unavailable" message={error} />;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24, overflow: 'hidden' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 22 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 10 }}>Portfolio command center</div>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(2rem, 3vw, 3.2rem)', letterSpacing: '-0.05em', lineHeight: 1.02 }}>Institutional view of your capital, risk, and signal flow.</h2>
            <p style={{ margin: '14px 0 0', color: theme.colors.textSoft, fontSize: 15, lineHeight: 1.65 }}>WealthOS consolidates holdings, market context, and AI insights into one calm operating layer.</p>
          </div>
          <button onClick={refresh} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '11px 14px', background: 'rgba(255,255,255,0.01)', color: theme.colors.text, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {kpis.map((item) => <StatCard key={item.label} {...item} />)}
        </div>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            {holdings.length ? (
              <Suspense fallback={<PageLoadingState title="Preparing charts…" subtitle="Rendering allocation and exposure visuals." />}>
                <DashboardCharts allocationData={allocationData} topPositions={topPositions} chartData={portfolio?.history || []} />
              </Suspense>
            ) : (
              <EmptyState title="No holdings to chart" message="Import a portfolio to unlock allocations and live exposure visuals." />
            )}
          </div>
        </div>

        <aside style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">AI brief</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 12px', fontSize: 18 }}>Portfolio intelligence summary</h3>
            <div style={{ display: 'grid', gap: 12, color: theme.colors.textSoft, lineHeight: 1.65, fontSize: 14 }}>
              <p style={{ margin: 0 }}>You hold <strong style={{ color: theme.colors.text }}>{holdings.length}</strong> active positions with <strong style={{ color: theme.colors.text }}>{pct(summary.total_pnl_pct)}</strong> unrealised return.</p>
              <p style={{ margin: 0 }}>Largest exposure: <strong style={{ color: theme.colors.text }}>{topPositions[0]?.ticker || '—'}</strong>. Watchlist coverage: <strong style={{ color: theme.colors.text }}>{watchlist.length}</strong> names.</p>
              <p style={{ margin: 0 }}>Signals are calm. Use the Advisor for rebalancing, tax, and concentration planning.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft, fontSize: 12 }}>Risk: Balanced</div>
              <div style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft, fontSize: 12 }}>Sync: Live</div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Activity feed</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 12px', fontSize: 18 }}>Recent transactions</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {activity.length ? activity.map((tx) => (
                <div key={tx.id || `${tx.ticker}-${tx.transaction_date}`} style={{ padding: 14, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{tx.ticker}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>{tx.action} · {tx.quantity} units</div>
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

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Watchlist</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 12px', fontSize: 18 }}>Market attention set</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {watchlist.length ? watchlist.map((item) => (
                <div key={item.id || item.ticker} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}` }}>
                  <span style={{ fontWeight: 700 }}>{item.ticker}</span>
                  <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>{item.target_price ? fmt(item.target_price) : 'No target'}</span>
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
