import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// ── palette tokens ──────────────────────────────────────────────
const C = {
  surface:     '#111611',
  surface2:    '#161c16',
  border:      '#1e281e',
  borderSubtle:'#182018',
  text:        '#e8ede8',
  textMuted:   '#6b7f6b',
  textFaint:   '#3d4d3d',
  green:       '#4ade80',
  red:         '#f87171',
  yellow:      '#fbbf24',
  blue:        '#60a5fa',
  teal:        '#2dd4bf',
};

// Slice colors — teal-forward to match forest-green terminal
const COLORS = [
  '#2dd4bf', '#4ade80', '#60a5fa', '#fbbf24',
  '#f87171', '#a3e635', '#818cf8', '#34d399',
];

const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

function safePct(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '—';
}

function Insight({ label, value, sub, tone }) {
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderSubtle}`, borderRadius: 6, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: tone || C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardCharts({ allocationData = [], topPositions = [] }) {
  const data = useMemo(() => {
    const total = allocationData.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
    return allocationData
      .filter((item) => Number(item.value || 0) > 0)
      .map((item, index) => ({
        ...item,
        value: Number(item.value || 0),
        pct: (Number(item.value || 0) / total) * 100,
        color: COLORS[index % COLORS.length],
      }));
  }, [allocationData]);

  const ranked = useMemo(() => {
    const total = topPositions.reduce((sum, item) => sum + Number(item.current_value || 0), 0) || 1;
    return topPositions.map((item, index) => ({
      ...item,
      pct: (Number(item.current_value || 0) / total) * 100,
      color: COLORS[index % COLORS.length],
    }));
  }, [topPositions]);

  // ── derived insights ──
  const topGainer = topPositions.slice().sort((a, b) => (b.unrealised_pnl_pct || b.change_pct || 0) - (a.unrealised_pnl_pct || a.change_pct || 0))[0];
  const topLoser  = topPositions.slice().sort((a, b) => (a.unrealised_pnl_pct || a.change_pct || 0) - (b.unrealised_pnl_pct || b.change_pct || 0))[0];
  const topConc   = ranked.slice().sort((a, b) => b.pct - a.pct)[0];
  const sectorCount = new Set(topPositions.map((item) => item.sector).filter(Boolean)).size;
  const diversificationScore = Math.max(0, Math.min(100, Math.round((sectorCount / Math.max(topPositions.length || 1, 1)) * 100)));

  // Safe display helpers — avoids "undefined%"
  const gainerPct = topGainer?.unrealised_pnl_pct ?? topGainer?.change_pct;
  const loserPct  = topLoser?.unrealised_pnl_pct  ?? topLoser?.change_pct;
  const gainerLabel = topGainer?.ticker || topGainer?.symbol || '—';
  const loserLabel  = topLoser?.ticker  || topLoser?.symbol  || '—';
  const gainerSub = gainerPct != null ? safePct(gainerPct) : null;
  const loserSub  = loserPct  != null ? safePct(loserPct)  : null;

  const concLabel = topConc ? `${topConc.ticker || topConc.symbol || '—'}` : '—';
  const concSub   = topConc ? `${topConc.pct.toFixed(1)}% of portfolio` : null;
  const concTone  = topConc && topConc.pct > 30 ? C.yellow : C.text;

  const totalValue = ranked.reduce((s, item) => s + (item.current_value || 0), 0);

  if (!data.length) {
    return (
      <div style={{ minHeight: 280, display: 'grid', placeItems: 'center', textAlign: 'center', color: C.textMuted }}>
        <div>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14, opacity: 0.4, display: 'inline-block', color: C.teal }}>
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>No holdings yet</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Import or add holdings to see allocation</div>
          <a href="/app/portfolio" style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, textDecoration: 'none' }}>Add Holdings</a>
        </div>
      </div>
    );
  }

  return (
    <div className="allocation-module">
      {/* Donut + legend */}
      <section className="allocation-donut-panel">
        <div className="allocation-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={3}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth={1}
                animationDuration={650}
              >
                {data.map((item, index) => (
                  <Cell key={`${item.name}-${index}`} fill={item.color} className="allocation-slice" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0d170d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                formatter={(value, _name, payload) => [`${money(value)} · ${payload?.payload?.pct.toFixed(1)}%`, payload?.payload?.name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="allocation-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <strong style={{ fontSize: 18, margin: 0, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{money(totalValue)}</strong>
            <span style={{ fontSize: 10, color: C.textMuted, marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Portfolio</span>
          </div>
        </div>
        <div className="allocation-legend">
          {data.map((item, index) => (
            <div key={`${item.name}-${index}`} className="allocation-legend-row">
              <span style={{ background: item.color }} />
              <p>{item.name}</p>
              <strong>{item.pct.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Position weight bars */}
      <section className="allocation-bars-panel">
        <div className="allocation-section-head">
          <span>Position Weights</span>
          <strong>{ranked.length} tracked</strong>
        </div>
        <div className="position-bars">
          {ranked.map((item, index) => (
            <div key={`${item.ticker || item.name || 'position'}-${index}`} className="position-bar-row">
              <div className="position-bar-meta">
                <span>{item.ticker || item.name}</span>
                <strong>{item.pct.toFixed(1)}%</strong>
              </div>
              <div className="position-bar-track">
                <div className="position-bar-fill" style={{ width: `${Math.max(item.pct, 3)}%`, background: `linear-gradient(90deg, ${item.color}, rgba(74,222,128,0.3))` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insights chips — 3-column grid */}
      <section className="allocation-insights-panel">
        <Insight
          label="Top Gainer"
          value={gainerLabel}
          sub={gainerSub}
          tone={topGainer ? C.green : C.textFaint}
        />
        <Insight
          label="Top Loser"
          value={loserLabel}
          sub={loserSub}
          tone={topLoser ? C.red : C.textFaint}
        />
        <Insight
          label="Concentration"
          value={concLabel}
          sub={concSub}
          tone={concTone}
        />
        <Insight label="Diversification" value={`${diversificationScore}/100`} tone={diversificationScore > 50 ? C.green : C.yellow} />
        <Insight label="Sector Exposure" value={`${sectorCount || 0} sectors`} tone={C.text} />
        <Insight
          label="Alloc. Drift"
          value={topConc && topConc.pct > 35 ? 'Concentrated' : 'Normal'}
          tone={topConc && topConc.pct > 35 ? C.yellow : C.textMuted}
        />
      </section>
    </div>
  );
}
