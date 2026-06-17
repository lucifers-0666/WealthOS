import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = [
  '#C8B38E', // Soft Gold
  '#6FAE8D', // Muted Green
  '#A07840', // Warm Bronze
  '#869FC4', // Muted Slate Blue
  '#B66A6A', // Muted Rose
  '#5A7A6A', // Forest Teal
  '#7B7C70', // Muted Stone
];

const money = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
function safePct(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '-';
}

function SectionHeader({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 14, marginBottom: 14 }}>
      <div style={{ width: 2, height: '100%', background: 'var(--accent-gold)', marginRight: 8 }} />
      <span className="section-header">{title}</span>
    </div>
  );
}

export function PositionWeightsCard({ topPositions = [] }) {
  const ranked = useMemo(() => {
    const total = topPositions.reduce((s, i) => s + Number(i.current_value || 0), 0) || 1;
    return topPositions.map((item, idx) => ({ ...item, pct: (Number(item.current_value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [topPositions]);

  return (
    <div style={{ background: 'var(--bg-surface)', border: "1px solid var(--border-default)", borderRadius: 3, padding: "20px" }}>
      <SectionHeader title="POSITION WEIGHTS" />
      <div style={{ display: 'grid', gap: 12 }}>
        {ranked.map((item, i) => (
          <div key={`pw-${i}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <span className="table-company">{item.company_name || item.name || item.ticker}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent-gold)' }}>{item.pct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 2, borderRadius: 1, background: 'rgba(45,60,55,0.70)' }}>
              <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${Math.max(item.pct, 2)}%`, borderRadius: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightTile({ label, value, sub, toneColor }) {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '12px 14px' }}>
      <div className="insight-label">{label}</div>
      <div className="insight-value" style={{ color: toneColor || 'var(--text-primary)', marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{sub}</div>}
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

  const sortedByRank = [...holdings].sort((a, b) => (b[rankKey] ?? 0) - (a[rankKey] ?? 0));
  const topGainer = sortedByRank[0];
  const topLoser = sortedByRank[sortedByRank.length - 1];
  const topConc = ranked[0];
  
  const sectorsCount = new Set(holdings.map(i => i.sector).filter(Boolean)).size;

  return (
    <div style={{ background: 'var(--bg-surface)', border: "1px solid var(--border-default)", borderRadius: 3, padding: "20px" }}>
      <SectionHeader title="INSIGHTS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <InsightTile 
          label="BEST PERFORMER"      
          value={topGainer?.ticker || '-'} 
          sub={topGainer ? `${safePct(topGainer[rankKey])} ${allFlat ? 'Total' : 'Today'}` : ''} 
          toneColor={topGainer && (topGainer[rankKey] >= 0 || allFlat) ? 'var(--status-gain)' : undefined} 
        />
        <InsightTile 
          label="WORST PERFORMER"       
          value={topLoser?.ticker  || '-'} 
          sub={topLoser ? `${safePct(topLoser[rankKey])} ${allFlat ? 'Total' : 'Today'}` : ''} 
          toneColor={topLoser && (topLoser[rankKey] < 0 || allFlat) ? 'var(--status-loss)' : undefined} 
        />
        <InsightTile 
          label="CONCENTRATION"   
          value={topConc ? `${topConc.pct.toFixed(1)}%` : '-'} 
          sub={topConc ? "Top 1 holding" : ""} 
          toneColor={topConc?.pct > 30 ? 'var(--status-warning)' : undefined} 
        />
        <InsightTile 
          label="DIVERSIFICATION" 
          value={`${holdings.length} / ${sectorsCount}`} 
          sub="Stocks / Sectors" 
        />
        <InsightTile 
          label="SECTOR EXPOSURE" 
          value={holdings[0]?.sector || '-'} 
          sub={topConc ? `${topConc.pct.toFixed(1)}% (High)` : ""} 
        />
        <InsightTile 
          label="ALLOC. DRIFT"    
          value={topConc?.pct > 35 ? `${(topConc.pct - 35).toFixed(1)}%` : '0.0%'} 
          sub="From target" 
          toneColor={topConc?.pct > 35 ? 'var(--status-warning)' : undefined} 
        />
      </div>
    </div>
  );
}

export function DonutCard({ allocationData = [], portfolioValue }) {
  const [allocView, setAllocView] = useState('DONUT');

  const data = useMemo(() => {
    const total = allocationData.reduce((s, i) => s + Number(i.value || 0), 0) || 1;
    let sorted = allocationData
      .filter(i => Number(i.value || 0) > 0)
      .sort((a,b) => b.value - a.value);
    
    // Group >6 into "Others"
    let displayData = [];
    if (sorted.length > 6) {
      displayData = sorted.slice(0, 6);
      const othersVal = sorted.slice(6).reduce((s, i) => s + Number(i.value), 0);
      displayData.push({ name: 'Others', ticker: 'Others', value: othersVal });
    } else {
      displayData = sorted;
    }

    return displayData.map((item, idx) => ({ 
      ...item, 
      weight: (Number(item.value || 0) / total) * 100,
      pct: (Number(item.value || 0) / total) * 100, 
      color: COLORS[idx % COLORS.length] 
    }));
  }, [allocationData]);

  const centerVal  = portfolioValue ?? data.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div style={{ background: 'var(--bg-surface)', border: "1px solid var(--border-default)", borderRadius: 3, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <SectionHeader title="ALLOCATION" />
        <div style={{ display: 'flex', gap: 12 }}>
          {['DONUT', 'TABLE'].map(v => {
            const isActive = allocView === v;
            return (
              <button key={v}
                onClick={() => setAllocView(v)}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer', paddingBottom: 4,
                  borderBottom: isActive ? '1px solid var(--accent-gold)' : '1px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >{v}</button>
            )
          })}
        </div>
      </div>

      {allocView === 'DONUT' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 220, height: 220, position: 'relative' }}>
            {/* Inner background circle for center text area */}
            <div style={{ position: 'absolute', inset: 30, background: 'var(--bg-surface)', borderRadius: '50%', zIndex: 0 }} />
            
            <ResponsiveContainer width="100%" height="100%" style={{ zIndex: 1, position: 'relative' }}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="100%" paddingAngle={3} stroke="var(--bg-base)" strokeWidth={3}>
                  {data.map((item, i) => <Cell key={`c${i}`} fill={item.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-overlay)', border: `1px solid var(--border-default)`, borderRadius: 3, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-sans)' }} formatter={(v, _n, pl) => [`${money(v)}`, pl?.payload?.name]} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{(centerVal / 100000).toFixed(1)}L</strong>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 2 }}>PORTFOLIO</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', height: 22 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0, marginRight: 8 }} />
                <span className="table-company" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.name}
                </span>
                <span className="table-value" style={{ flexShrink: 0, marginLeft: 8 }}>
                  {(h.weight ?? 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: `1px solid var(--border-subtle)`, paddingBottom: 6 }}>
            <span className="table-header">NAME</span>
            <span className="table-header" style={{ textAlign: 'right' }}>WEIGHT</span>
            <span className="table-header" style={{ textAlign: 'right' }}>VALUE</span>
          </div>
          {data.map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', height: 24 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                <span className="table-company" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
              </span>
              <span className="table-value" style={{ textAlign: 'right' }}>{h.weight.toFixed(1)}%</span>
              <span className="table-value" style={{ textAlign: 'right' }}>{money(h.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}