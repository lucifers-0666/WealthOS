import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

const COLORS = ['#2dd4bf', '#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a3e635', '#818cf8', '#34d399'];
const money = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

function safePct(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '-';
}

function Insight({ label, value, sub, tone }) {
  return (
    <div style={{ background: C.cardHov, border: `1px solid ${C.borderSub}`, borderRadius: 6, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: tone || C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardCharts({ allocationData = [], topPositions = [], portfolioValue }) {
  const data = useMemo(() => {
    const total = allocationData.reduce((s, i) => s + Number(i.value || 0), 0) || 1;
    return allocationData
      .filter(i => Number(i.value || 0) > 0)
      .map((item, idx) => ({ ...item, value: Number(item.value || 0), pct: (Number(item.value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [allocationData]);

  const ranked = useMemo(() => {
    const total = topPositions.reduce((s, i) => s + Number(i.current_value || 0), 0) || 1;
    return topPositions.map((item, idx) => ({ ...item, pct: (Number(item.current_value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [topPositions]);

  const topGainer  = topPositions.slice().sort((a, b) => (b.unrealised_pnl_pct || b.day_change_pct || 0) - (a.unrealised_pnl_pct || a.day_change_pct || 0))[0];
  const topLoser   = topPositions.slice().sort((a, b) => (a.unrealised_pnl_pct || a.day_change_pct || 0) - (b.unrealised_pnl_pct || b.day_change_pct || 0))[0];
  const topConc    = ranked.slice().sort((a, b) => b.pct - a.pct)[0];
  const sectors    = new Set(topPositions.map(i => i.sector).filter(Boolean));
  const divScore   = Math.max(0, Math.min(100, Math.round((sectors.size / Math.max(topPositions.length, 1)) * 100)));

  const concLabel  = topConc ? (topConc.ticker || topConc.symbol || '-') : '-';
  const concSub    = topConc ? `${topConc.pct.toFixed(1)}% of portfolio` : null;
  const concTone   = topConc?.pct > 30 ? C.yellow : C.text;
  const divTone    = divScore > 70 ? C.green : divScore > 40 ? C.text : C.yellow;
  const centerVal  = portfolioValue ?? ranked.reduce((s, i) => s + (i.current_value || 0), 0);

  if (!data.length) {
    return (
      <div style={{ minHeight: 200, display: 'grid', placeItems: 'center', color: C.muted, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>No holdings to chart</div>
          <a href="/app/upload" style={{ fontSize: 12, color: C.blue, textDecoration: 'none' }}>Import Holdings</a>
        </div>
      </div>
    );
  }

  return (
    <div className="allocation-module">

      <section className="allocation-donut-panel">
        <div className="allocation-donut-inner">
          <div className="allocation-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="86%" paddingAngle={3} strokeWidth={1} stroke="rgba(0,0,0,0.2)" animationDuration={600}>
                  {data.map((item, i) => <Cell key={`c${i}`} fill={item.color} className="allocation-slice" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d170d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} formatter={(v, _n, pl) => [`${money(v)} - ${pl?.payload?.pct?.toFixed(1)}%`, pl?.payload?.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="allocation-center">
              <strong>{money(centerVal)}</strong>
              <span>Portfolio</span>
            </div>
          </div>
          <div className="allocation-legend">
            {data.map((item, i) => (
              <div key={`l${i}`} className="allocation-legend-row">
                <span style={{ background: item.color }} />
                <p title={item.name}>{item.name || item.ticker || '-'}</p>
                <strong>{item.pct.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="allocation-bars-panel">
        <div className="allocation-section-head">
          <span>Position Weights</span>
          <strong>{ranked.length} tracked</strong>
        </div>
        <div className="position-bars">
          {ranked.map((item, i) => (
            <div key={`b${i}`} className="position-bar-row">
              <div className="position-bar-meta">
                <span title={item.company_name || item.name}>{item.company_name || item.name || item.ticker}</span>
                <strong>{item.pct.toFixed(1)}%</strong>
              </div>
              <div className="position-bar-track">
                <div className="position-bar-fill" style={{ width: `${Math.max(item.pct, 2)}%`, background: `linear-gradient(90deg, ${item.color}, rgba(74,222,128,0.25))` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="allocation-insights-panel">
        <Insight label="Top Gainer"      value={topGainer?.ticker || '-'} sub={topGainer ? safePct(topGainer.unrealised_pnl_pct ?? topGainer.day_change_pct) : null} tone={topGainer ? C.green : C.faint} />
        <Insight label="Top Loser"       value={topLoser?.ticker  || '-'} sub={topLoser  ? safePct(topLoser.unrealised_pnl_pct  ?? topLoser.day_change_pct)  : null} tone={topLoser  ? C.red   : C.faint} />
        <Insight label="Concentration"   value={concLabel} sub={concSub} tone={concTone} />
        <Insight label="Diversification" value={`${divScore}/100`} tone={divTone} />
        <Insight label="Sector Exposure" value={`${sectors.size || 0} sector${sectors.size !== 1 ? 's' : ''}`} tone={C.text} />
        <Insight label="Alloc. Drift"    value={topConc?.pct > 35 ? 'Concentrated' : 'Normal'} tone={topConc?.pct > 35 ? C.yellow : C.muted} />
      </section>

    </div>
  );
}