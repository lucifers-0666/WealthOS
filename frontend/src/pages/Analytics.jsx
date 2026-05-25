import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { panelStyle, theme } from '../lib/theme.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
function fmtCrore(n) {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e7) return `₹${fmt(n / 1e7, 2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${fmt(n / 1e5, 2)} L`;
  return `₹${fmt(n, 0)}`;
}

// ── Donut ────────────────────────────────────────────────────────
const DONUT_COLORS = [
  theme.colors.gold,
  theme.colors.accent,
  theme.colors.success,
  theme.colors.warning,
  '#8B9DBC',
  '#7ABFA5',
  '#C4A882',
];

function AllocationDonut({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return null;
  const r = 48, cx = 64, cy = 64, stroke = 16;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices.map((s, i) => {
    const pct = s.value / total;
    const dash = pct * circ;
    const arc = { ...s, dash, gap: circ - dash, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += dash;
    return arc;
  });
  return (
    <svg width={128} height={128} viewBox="0 0 128 128" aria-label="Allocation donut chart">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={circ / 4 - arc.offset}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={theme.colors.text} fontSize="11" fontWeight="700">{slices.length}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill={theme.colors.textMuted} fontSize="9">classes</text>
    </svg>
  );
}

// ── P&L Bar ──────────────────────────────────────────────────────
function PnLBar({ pnl, maxAbs }) {
  const pct = maxAbs > 0 ? Math.abs(pnl) / maxAbs : 0;
  const positive = pnl >= 0;
  return (
    <div style={{ flex: 1, height: 8, borderRadius: 99, background: theme.colors.border, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: 99,
          background: positive ? theme.colors.success : theme.colors.error,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ── Day Change Heatmap ───────────────────────────────────────────
function DayHeatmapCell({ ticker, pct }) {
  const intensity = Math.min(Math.abs(pct || 0) / 5, 1);
  const positive = (pct || 0) >= 0;
  const bg = positive
    ? `rgba(111,174,141,${0.15 + intensity * 0.65})`
    : `rgba(182,106,106,${0.15 + intensity * 0.65})`;
  return (
    <div
      style={{
        borderRadius: 10,
        padding: '8px 10px',
        background: bg,
        border: `1px solid ${positive ? 'rgba(111,174,141,0.22)' : 'rgba(182,106,106,0.22)'}`,
        minWidth: 72,
        textAlign: 'center',
      }}
    >
      <div style={{ color: theme.colors.text, fontWeight: 700, fontSize: 12 }}>{ticker}</div>
      <div style={{ color: positive ? theme.colors.success : theme.colors.error, fontSize: 11, fontWeight: 600, marginTop: 2 }}>
        {pct != null ? `${pct >= 0 ? '+' : ''}${fmt(pct, 2)}%` : '—'}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ ...panelStyle({ padding: '16px 18px' }), display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {Icon && <Icon size={13} />}{label}
      </div>
      <div style={{ color: color || theme.colors.text, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Analytics() {
  const { holdings, summary, loading } = usePortfolio();

  const derived = useMemo(() => {
    if (!holdings.length) return null;

    // P&L per holding
    const withPnl = holdings.map((h) => {
      const cost = (h.avg_buy_price || 0) * (h.quantity || 0);
      const ltp = h.ltp || h.avg_buy_price || 0;
      const current = ltp * (h.quantity || 0);
      const pnl = current - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, pnl, pnlPct, current, cost };
    });

    const sorted = [...withPnl].sort((a, b) => b.pnl - a.pnl);
    const maxAbs = Math.max(...withPnl.map((h) => Math.abs(h.pnl)), 1);

    // Allocation slices by asset_class
    const byClass = {};
    withPnl.forEach((h) => {
      const cls = (h.asset_class || 'equity').toLowerCase();
      byClass[cls] = (byClass[cls] || 0) + h.current;
    });
    const donutSlices = Object.entries(byClass).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const totalPnl = withPnl.reduce((s, h) => s + h.pnl, 0);
    const totalCost = withPnl.reduce((s, h) => s + h.cost, 0);
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return { withPnl, sorted, maxAbs, donutSlices, best, worst, totalPnl, totalPnlPct };
  }, [holdings]);

  if (loading) return <PageLoadingState title="Loading analytics…" subtitle="Crunching portfolio performance data." />;
  if (!holdings.length) return <EmptyState title="No holdings to analyse" message="Import or add holdings to see your analytics dashboard." />;

  const { withPnl, sorted, maxAbs, donutSlices, best, worst, totalPnl, totalPnlPct } = derived;

  const winners = sorted.filter((h) => h.pnl >= 0);
  const losers = sorted.filter((h) => h.pnl < 0).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard
          label="Total P&L"
          value={fmtCrore(totalPnl)}
          sub={`${totalPnl >= 0 ? '+' : ''}${fmt(totalPnlPct, 2)}% overall`}
          color={totalPnl >= 0 ? theme.colors.success : theme.colors.error}
          icon={BarChart2}
        />
        <StatCard
          label="Best Performer"
          value={best?.ticker || '—'}
          sub={best ? `+${fmt(best.pnlPct, 2)}%` : ''}
          color={theme.colors.success}
          icon={TrendingUp}
        />
        <StatCard
          label="Worst Performer"
          value={worst?.ticker || '—'}
          sub={worst ? `${fmt(worst.pnlPct, 2)}%` : ''}
          color={theme.colors.error}
          icon={TrendingDown}
        />
        <StatCard
          label="Active Positions"
          value={holdings.length}
          sub={`${winners.length} winners · ${losers.length} losers`}
          icon={Activity}
        />
      </div>

      {/* ── Allocation + P&L ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'min(260px, 100%) 1fr', gap: 14 }}>
        {/* Donut */}
        <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
          <div className="section-label" style={{ marginBottom: 14 }}>Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <AllocationDonut slices={donutSlices} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donutSlices.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: theme.colors.textSoft, flex: 1, textTransform: 'capitalize' }}>{s.label}</span>
                  <span style={{ color: theme.colors.text, fontWeight: 700 }}>
                    {fmt((s.value / donutSlices.reduce((a, x) => a + x.value, 0)) * 100, 1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* P&L bars */}
        <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
          <div className="section-label" style={{ marginBottom: 14 }}>P&amp;L by Holding</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {sorted.map((h) => (
              <div key={h.id || h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 28 }}>
                <span style={{ color: theme.colors.textSoft, fontSize: 12, fontWeight: 700, width: 72, flexShrink: 0 }}>{h.ticker}</span>
                <PnLBar pnl={h.pnl} maxAbs={maxAbs} />
                <span
                  style={{
                    color: h.pnl >= 0 ? theme.colors.success : theme.colors.error,
                    fontSize: 12, fontWeight: 700, width: 80, textAlign: 'right', flexShrink: 0,
                  }}
                >
                  {h.pnl >= 0 ? '+' : ''}{fmtCrore(h.pnl)}
                </span>
                <span
                  style={{
                    color: h.pnl >= 0 ? theme.colors.success : theme.colors.error,
                    fontSize: 11, width: 52, textAlign: 'right', flexShrink: 0,
                  }}
                >
                  {h.pnl >= 0 ? '+' : ''}{fmt(h.pnlPct, 1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day Change Heatmap ── */}
      <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Day Change Heatmap</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {withPnl.map((h) => (
            <DayHeatmapCell key={h.ticker} ticker={h.ticker} pct={h.day_change_pct ?? null} />
          ))}
        </div>
      </div>

      {/* ── Top Winners / Losers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[{ label: '🏆 Top Winners', items: winners.slice(0, 5), positive: true }, { label: '📉 Top Losers', items: losers.slice(0, 5), positive: false }].map(({ label, items, positive }) => (
          <div key={label} style={{ ...panelStyle({ padding: '16px 14px' }) }}>
            <div className="section-label" style={{ marginBottom: 12 }}>{label}</div>
            {!items.length ? (
              <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>None</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((h) => (
                  <div key={h.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <div style={{ color: theme.colors.text, fontWeight: 700 }}>{h.ticker}</div>
                      <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>{h.company_name || h.asset_class}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: positive ? theme.colors.success : theme.colors.error, fontWeight: 700 }}>
                        {h.pnl >= 0 ? '+' : ''}{fmtCrore(h.pnl)}
                      </div>
                      <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                        {h.pnlPct >= 0 ? '+' : ''}{fmt(h.pnlPct, 2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
