import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// -- palette ----------------------------------------------------
const C = {
  card:     '#111811',
  cardHov:  '#162016',
  border:   '#1f2b1f',
  borderSub:'#192319',
  text:     '#dceadc',
  muted:    '#6b806b',
  faint:    '#3a4a3a',
  green:    '#4ade80',
  red:      '#f87171',
  yellow:   '#fbbf24',
  blue:     '#60a5fa',
  teal:     '#2dd4bf',
};

// Donut slice colors — teal-forward green terminal
const COLORS = ['#2dd4bf', '#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a3e635', '#818cf8', '#34d399'];

const money = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

function safePct(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '—';
}

function Insight({ label, value, sub, tone }) {
  // Diversification: green if >70, yellow if 40-70, red if <40
  const displayTone = tone || C.text;
  return (
    <div style={{ background: C.cardHov, border: `1px solid ${C.borderSub}`, borderRadius: 6, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: displayTone }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardCharts({ allocationData = [], topPositions = [], portfolioValue }) {
  const data = useMemo(() => {
    const total = allocationData.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
    return allocationData
      .filter(item => Number(item.value || 0) > 0)
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

  // Derived insights
  const topGainer = topPositions.slice().sort((a, b) => (b.unrealised_pnl_pct || b.change_pct || 0) - (a.unrealised_pnl_pct || a.change_pct || 0))[0];
  const topLoser  = topPositions.slice().sort((a, b) => (a.unrealised_pnl_pct || a.change_pct || 0) - (b.unrealised_pnl_pct || b.change_pct || 0))[0];
  const topConc   = ranked.slice().sort((a, b) => b.pct - a.pct)[0];
  const sectorCount = new Set(topPositions.map(item => item.sector).filter(Boolean)).size;
  const divScore = Math.max(0, Math.min(100, Math.round((sectorCount / Math.max(topPositions.length || 1, 1)) * 100)));

  // Safe display
  const gainerPct = topGainer?.unrealised_pnl_pct ?? topGainer?.change_pct;
  const loserPct  = topLoser?.unrealised_pnl_pct  ?? topLoser?.change_pct;
  const gainerLabel = topGainer?.ticker || topGainer?.symbol || '—';
  const loserLabel  = topLoser?.ticker  || topLoser?.symbol  || '—';
  const gainerSub = gainerPct != null && Number.isFinite(Number(gainerPct)) ? safePct(gainerPct) : null;
  const loserSub  = loserPct  != null && Number.isFinite(Number(loserPct))  ? safePct(loserPct)  : null;
  const concLabel = topConc ? `${topConc.ticker || topConc.symbol || '—'}` : '—';
  const concSub   = topConc ? `${topConc.pct.toFixed(1)}% of portfolio` : null;
  const concTone  = topConc?.pct > 30 ? C.yellow : C.text;

  // Diversification color
  const divTone = divScore > 70 ? C.green : divScore > 40 ? C.text : C.yellow;

  // Center value — use passed portfolioValue if available, else sum ranked
  const centerValue = portfolioValue ?? ranked.reduce((s, item) => s + (item.current_value || 0), 0);

  if (!data.length) {
    return (
      <div style={{ minHeight: 240, display: 'grid', placeItems: 'center', textAlign: 'center', color: C.muted }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>No holdings yet</div>
          <div style={{ fontSize: 13, marginBottom: 14 }}>Import or add holdings to see allocation</div>
          <a href="/app/upload" style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, background: C.cardHov, color: C.text, border: `1px solid ${C.border}`, textDecoration: 'none' }}>Import Holdings</a>
        </div>
      </div>
    );
  }

  return (
    <div className="allocation-module">
      {/* Left: donut + legend */}
      <section className="allocation-donut-panel">
        <div className="allocation-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data} dataKey="value" nameKey="name"
                innerRadius="62%" outerRadius="88%"
                paddingAngle={3} stroke="rgba(0,0,0,0.2)" strokeWidth={1}
                animationDuration={650}
              >
                {data.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.color} className="allocation-slice" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0d170d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                formatter={(value, _name, payload) => [`${money(value)} · ${payload?.payload?.pct.toFixed(1)}%`, payload?.payload?.name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="allocation-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <strong style={{ fontSize: 16, margin: 0, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{money(centerValue)}</strong>
            <span style={{ fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Portfolio</span>
          </div>
        </div>
        {/* Legend — show ticker/name NOT exchange */}
        <div className="allocation-legend">
          {data.map((item, index) => (
            <div key={`${item.name}-${index}`} className="allocation-legend-row">
              <span style={{ background: item.color }} />
              {/* Show the stock name or ticker, NOT exchange */}
              <p title={item.name}>{item.name || item.ticker || '—'}</p>
              <strong>{item.pct.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Right: position weight bars */}
      <section className="allocation-bars-panel">
        <div className="allocation-section-head">
          <span>Position Weights</span>
          <strong>{ranked.length} tracked</strong>
        </div>
        <div className="position-bars">
          {ranked.map((item, index) => (
            <div key={`${item.ticker || item.name || 'pos'}-${index}`} className="position-bar-row">
              <div className="position-bar-meta">
                {/* Show company name as primary label */}
                <span title={item.company_name || item.name}>{item.company_name || item.name || item.ticker}</span>
                <strong>{item.pct.toFixed(1)}%</strong>
              </div>
              <div className="position-bar-track">
                <div className="position-bar-fill" style={{ width: `${Math.max(item.pct, 3)}%`, background: `linear-gradient(90deg, ${item.color}, rgba(74,222,128,0.3))` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insights chips — 3 columns, full width below */}
      <section className="allocation-insights-panel">
        <Insight label="Top Gainer"    value={gainerLabel} sub={gainerSub}  tone={topGainer ? C.green : C.faint} />
        <Insight label="Top Loser"     value={loserLabel}  sub={loserSub}   tone={topLoser  ? C.red   : C.faint} />
        <Insight label="Concentration" value={concLabel}   sub={concSub}    tone={concTone} />
        <Insight label="Diversification" value={`${divScore}/100`} tone={divTone} />
        <Insight label="Sector Exposure" value={`${sectorCount || 0} sector${sectorCount !== 1 ? 's' : ''}`} tone={C.text} />
        <Insight label="Alloc. Drift"    value={topConc?.pct > 35 ? 'Concentrated' : 'Normal'} tone={topConc?.pct > 35 ? C.yellow : C.muted} />
      </section>
    </div>
  );
}
