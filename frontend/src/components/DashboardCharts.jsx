import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const C = {
  card:     'var(--bg-card)',
  cardHov:  'var(--bg-card-hover)',
  border:   'var(--border)',
  borderSub:'var(--border-subtle)',
  text:     'var(--text-primary)',
  muted:    'var(--text-secondary)',
  faint:    'var(--text-faint)',
  green:    'var(--aegean-green)',
  red:      'var(--terracotta)',
  yellow:   'var(--amber-gold)',
  blue:     'var(--accent-blue)',
  teal:     'var(--accent-teal)',
};

const COLORS = [
  '#d4a017',  // greek-gold
  '#b8960a',  // amber-gold
  '#f0e6c8',  // parchment
  '#e8d8a8',  // cream
  '#c4b48a',  // sand
  '#4a8a6a',  // aegean-green
  '#3d2e0a',  // border-dark
  '#6b2e2e',  // terracotta
  '#8b7b54',  // muted sand
];
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
      <div className="card-header" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>Position Weights</div>
      <div className="position-bars">
        {ranked.map((item, i) => {
          const isTop = i === 0;
          return (
            <div key={`b${i}`} className="position-bar-row" style={{
              background: isTop ? 'rgba(212,160,23,0.04)' : 'transparent',
              borderLeft: isTop ? '2px solid var(--greek-gold)' : '2px solid transparent',
              paddingLeft: 4, marginLeft: -6, paddingRight: 4
            }}>
              <div className="position-bar-meta">
                <span title={item.company_name || item.name} style={{ fontFamily: 'var(--font-serif)' }}>{item.company_name || item.name || item.ticker}</span>
                <strong style={{ color: 'var(--greek-gold)' }}>{item.pct.toFixed(1)}%</strong>
              </div>
              <div className="position-bar-track">
                <div className="position-bar-fill" style={{ width: `${Math.max(item.pct, 2)}%`, background: `linear-gradient(90deg, ${item.color}, rgba(212,160,23,0.25))` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Insight({ label, value, sub, tone }) {
  return (
    <div className="insights-chip" style={{ background: C.cardHov, border: `1px solid ${C.borderSub}`, borderRadius: 6, padding: '12px 14px', transition: 'all 0.2s' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: tone || C.text, fontFamily: 'var(--font-serif)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function InsightsCard({ topPositions = [], holdings = [] }) {
  const ranked = useMemo(() => {
    const total = topPositions.reduce((s, i) => s + Number(i.current_value || 0), 0) || 1;
    return topPositions.map((item, idx) => ({ ...item, pct: (Number(item.current_value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [topPositions]);

  const allFlat = holdings.length > 0 && holdings.every(h => Math.abs(h.day_change_pct ?? 0) < 0.01);
  const rankKey = allFlat ? 'pnl_pct' : 'day_change_pct';
  const rankLabel = allFlat ? 'BEST PERFORMER' : 'TOP GAINER';
  const rankLabel2 = allFlat ? 'WORST PERFORMER' : 'TOP LOSER';

  const sortedByRank = [...holdings].sort((a, b) => (b[rankKey] ?? 0) - (a[rankKey] ?? 0));
  const topGainer = sortedByRank[0];
  const topLoser = sortedByRank[sortedByRank.length - 1];

  const topConc = ranked.slice().sort((a, b) => b.pct - a.pct)[0];
  
  const divScore = useMemo(() => {
    if (!holdings.length) return 0;
    const total = holdings.reduce((s, h) => s + (h.current_value || 0), 0) || 1;
    const weights = holdings.map(h => (h.current_value || 0) / total);
    const hhi = weights.reduce((s, w) => s + w * w, 0);
    const countScore = Math.min((holdings.length / 25) * 100, 100);
    const hhiScore = (1 - hhi) * 100;
    const sectors = new Set(holdings.map(h => h.sector).filter(Boolean));
    const sectorScore = Math.min((sectors.size / 8) * 100, 100);
    return Math.round(countScore * 0.25 + hhiScore * 0.5 + sectorScore * 0.25);
  }, [holdings]);

  const concLabel  = topConc ? (topConc.ticker || topConc.symbol || '-') : '-';
  const concSub    = topConc ? `${topConc.pct.toFixed(1)}% of portfolio` : null;
  const concTone   = topConc?.pct > 30 ? C.yellow : C.text;
  const divTone    = divScore > 70 ? C.green : divScore >= 40 ? C.text : C.yellow;
  const sectorsCount = new Set(holdings.map(i => i.sector).filter(Boolean)).size;

  return (
    <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      <Insight 
        label={rankLabel}      
        value={topGainer?.ticker || '-'} 
        sub={<>{topGainer ? safePct(topGainer[rankKey]) : null} <span style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2, display: 'block' }}>{allFlat ? 'by total return' : 'today'}</span></>} 
        tone={topGainer && (topGainer[rankKey] >= 0 || allFlat) ? C.green : C.faint} 
      />
      <Insight 
        label={rankLabel2}       
        value={topLoser?.ticker  || '-'} 
        sub={<>{topLoser  ? safePct(topLoser[rankKey])  : null} <span style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2, display: 'block' }}>{allFlat ? 'by total return' : 'today'}</span></>} 
        tone={topLoser && (topLoser[rankKey] < 0 || allFlat) ? C.red   : C.faint} 
      />
      <Insight label="Concentration"   value={concLabel} sub={concSub} tone={concTone} />
      <Insight label="Diversification" value={`${divScore}/100`} tone={divTone} />
      <Insight label="Sector Exposure" value={`${sectorsCount || 0} sector${sectorsCount !== 1 ? 's' : ''}`} tone={C.text} />
      <Insight label="Alloc. Drift"    value={topConc?.pct > 35 ? 'Concentrated' : 'Normal'} tone={topConc?.pct > 35 ? C.yellow : C.muted} />
    </div>
  );
}

export function DonutCard({ allocationData = [], portfolioValue }) {
  const [allocView, setAllocView] = useState('DONUT');

  const data = useMemo(() => {
    const total = allocationData.reduce((s, i) => s + Number(i.value || 0), 0) || 1;
    return allocationData
      .filter(i => Number(i.value || 0) > 0)
      .map((item, idx) => ({ 
        ...item, 
        weight: (Number(item.value || 0) / total) * 100,
        pct: (Number(item.value || 0) / total) * 100, 
        color: COLORS[idx % COLORS.length] 
      }));
  }, [allocationData]);

  const centerVal  = portfolioValue ?? data.reduce((s, i) => s + (i.value || 0), 0);
  const legendData = data.slice().sort((a, b) => b.weight - a.weight).slice(0, 7);

  return (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="card-header" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted }}>Allocation</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['DONUT', 'TABLE'].map(v => (
            <button key={v}
              onClick={() => setAllocView(v)}
              style={{
                fontSize: 9, padding: '3px 8px', borderRadius: 3,
                border: '1px solid var(--border)',
                background: allocView === v ? 'var(--greek-gold)' : 'transparent',
                color: allocView === v ? '#1a1206' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em'
              }}
            >{v}</button>
          ))}
        </div>
      </div>

      {allocView === 'DONUT' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, alignItems: 'start' }}>
          <div className="allocation-chart-wrap" style={{ width: 160, height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="86%" paddingAngle={3} stroke="none" animationDuration={600}>
                  {data.map((item, i) => <Cell key={`c${i}`} fill={item.color} className="allocation-slice" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1206', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'var(--font-sans)' }} formatter={(v, _n, pl) => [`${money(v)} - ${pl?.payload?.pct?.toFixed(1)}%`, pl?.payload?.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="allocation-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <strong style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{money(centerVal)}</strong>
              <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>Portfolio</span>
            </div>
          </div>
          <div className="allocation-legend" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {legendData.map((h, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.name || h.symbol || h.ticker}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {(h.weight ?? 0).toFixed(1)}%
                  </span>
                </div>
                {/* Mini bar */}
                <div style={{ height: 2, background: 'var(--border)', borderRadius: 1, marginLeft: 15 }}>
                  <div style={{ height: 2, borderRadius: 1, background: h.color, width: `${Math.min(h.weight ?? 0, 100)}%`, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: 10, color: C.muted, letterSpacing: '0.05em', borderBottom: `1px solid ${C.borderSub}`, paddingBottom: 6 }}>
            <span>NAME</span>
            <span style={{ textAlign: 'right' }}>WEIGHT</span>
            <span style={{ textAlign: 'right' }}>VALUE</span>
            <span style={{ textAlign: 'right' }}>P&L%</span>
          </div>
          {data.slice().sort((a,b) => b.weight - a.weight).map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: 12, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                <span style={{ color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name || h.ticker}</span>
              </span>
              <span style={{ textAlign: 'right', color: C.text }}>{h.weight.toFixed(1)}%</span>
              <span style={{ textAlign: 'right', color: C.text }}>{money(h.value)}</span>
              <span style={{ textAlign: 'right', color: (h.pnl_pct || h.change_pct || 0) >= 0 ? C.green : C.red }}>{safePct(h.pnl_pct || h.change_pct)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}