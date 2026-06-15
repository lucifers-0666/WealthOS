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

export function PositionWeightsCard({ topPositions = [] }) {
  const ranked = useMemo(() => {
    const total = topPositions.reduce((s, i) => s + Number(i.current_value || 0), 0) || 1;
    return topPositions.map((item, idx) => ({ ...item, pct: (Number(item.current_value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [topPositions]);

  return (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>Position Weights</div>
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
    </div>
  );
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

export function InsightsCard({ topPositions = [] }) {
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

  return (
    <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      <Insight label="Top Gainer"      value={topGainer?.ticker || '-'} sub={topGainer ? safePct(topGainer.unrealised_pnl_pct ?? topGainer.day_change_pct) : null} tone={topGainer ? C.green : C.faint} />
      <Insight label="Top Loser"       value={topLoser?.ticker  || '-'} sub={topLoser  ? safePct(topLoser.unrealised_pnl_pct  ?? topLoser.day_change_pct)  : null} tone={topLoser  ? C.red   : C.faint} />
      <Insight label="Concentration"   value={concLabel} sub={concSub} tone={concTone} />
      <Insight label="Diversification" value={`${divScore}/100`} tone={divTone} />
      <Insight label="Sector Exposure" value={`${sectors.size || 0} sector${sectors.size !== 1 ? 's' : ''}`} tone={C.text} />
      <Insight label="Alloc. Drift"    value={topConc?.pct > 35 ? 'Concentrated' : 'Normal'} tone={topConc?.pct > 35 ? C.yellow : C.muted} />
    </div>
  );
}

export function DonutCard({ allocationData = [], portfolioValue }) {
  const data = useMemo(() => {
    const total = allocationData.reduce((s, i) => s + Number(i.value || 0), 0) || 1;
    return allocationData
      .filter(i => Number(i.value || 0) > 0)
      .map((item, idx) => ({ ...item, value: Number(item.value || 0), pct: (Number(item.value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [allocationData]);

  const centerVal  = portfolioValue ?? data.reduce((s, i) => s + (i.value || 0), 0);
  const legendData = data.slice(0, 7); // max 7 items

  return (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, alignItems: 'start' }}>
        <div className="allocation-chart-wrap" style={{ width: 160, height: 160, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="86%" paddingAngle={3} strokeWidth={1} stroke="rgba(0,0,0,0.2)" animationDuration={600}>
                {data.map((item, i) => <Cell key={`c${i}`} fill={item.color} className="allocation-slice" />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d170d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} formatter={(v, _n, pl) => [`${money(v)} - ${pl?.payload?.pct?.toFixed(1)}%`, pl?.payload?.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="allocation-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <strong style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{money(centerVal)}</strong>
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>Portfolio</span>
          </div>
        </div>
        <div className="allocation-legend" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {legendData.map((item, i) => (
            <div key={`l${i}`} className="allocation-legend-row" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <p title={item.name} style={{ margin: 0, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name || item.ticker || '-'}</p>
              <strong style={{ color: C.text }}>{item.pct.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}