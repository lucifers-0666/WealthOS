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

function formatIndian(value) {
  if (value >= 10000000) {
    return '₹' + (value / 10000000).toFixed(1) + 'Cr';
  } else if (value >= 100000) {
    return '₹' + (value / 100000).toFixed(1) + 'L';
  } else {
    return '₹' + (value || 0).toLocaleString('en-IN');
  }
}

function formatReturn(val) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '% MTD';
}

function SectionHeader({ title }) {
  return (
    <div className="section-header">
      <span className="section-header__text">{title}</span>
    </div>
  );
}

export function PositionWeightsCard({ topPositions = [] }) {
  const ranked = useMemo(() => {
    const total = topPositions.reduce((s, i) => s + Number(i.current_value || 0), 0) || 1;
    return topPositions.map((item, idx) => ({ ...item, pct: (Number(item.current_value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [topPositions]);

  return (
    <div className="kpi-card">
      <SectionHeader title="POSITION WEIGHTS" />
      <div style={{ display: 'grid', gap: 12 }}>
        {ranked.map((item, i) => (
          <div key={`pw-${i}`} className="position-row">
            <div className="position-row__header">
              <span className="position-row__name">{item.company_name || item.name || item.ticker}</span>
              <span className="position-row__pct">{item.pct.toFixed(1)}%</span>
            </div>
            <div className="position-bar-track">
              <div className="position-bar-fill" style={{ width: `${Math.max(item.pct, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightTile({ label, value, sub, toneClass }) {
  return (
    <div className="insight-tile">
      <div className="insight-label">{label}</div>
      <div className={`insight-value ${toneClass || ''}`}>{value}</div>
      {sub && <div className="insight-sub">{sub}</div>}
    </div>
  );
}

export function InsightsCard({ topPositions = [], holdings = [] }) {
  const ranked = useMemo(() => {
    const total = topPositions.reduce((s, i) => s + Number(i.current_value || 0), 0) || 1;
    return topPositions.map((item, idx) => ({ ...item, pct: (Number(item.current_value || 0) / total) * 100, color: COLORS[idx % COLORS.length] }));
  }, [topPositions]);

  // Use returnMTD if available, fallback to day_change_pct
  const sorted = [...holdings].sort((a, b) => (b.returnMTD ?? b.day_change_pct ?? 0) - (a.returnMTD ?? a.day_change_pct ?? 0));
  const best = sorted.length > 0 ? sorted[0] : null;
  const worst = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  
  const topConc = ranked[0];
  const sectorsCount = new Set(holdings.map(i => i.sector).filter(Boolean)).size;

  return (
    <div className="kpi-card">
      <SectionHeader title="INSIGHTS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <InsightTile 
          label="BEST PERFORMER"      
          value={best?.ticker || best?.name || 'No data'} 
          sub={best ? formatReturn(best.returnMTD ?? best.day_change_pct) : '–'} 
          toneClass={best && (best.returnMTD ?? best.day_change_pct) >= 0 ? 'insight-value--positive' : ''} 
        />
        <InsightTile 
          label="WORST PERFORMER"       
          value={worst?.ticker || worst?.name || 'No data'} 
          sub={worst ? formatReturn(worst.returnMTD ?? worst.day_change_pct) : '–'} 
          toneClass={worst && (worst.returnMTD ?? worst.day_change_pct) < 0 ? 'insight-value--negative' : ''} 
        />
        <InsightTile 
          label="CONCENTRATION"   
          value={topConc ? `${topConc.pct.toFixed(1)}%` : '-'} 
          sub={topConc ? "Top 1 holding" : ""} 
          toneClass={topConc?.pct > 30 ? 'insight-value--warning' : ''} 
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
          toneClass={topConc?.pct > 35 ? 'insight-value--warning' : ''} 
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

  const centerVal = portfolioValue ?? data.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div className="kpi-card">
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
            <div style={{ position: 'absolute', inset: 26, background: 'var(--bg-surface)', borderRadius: '50%', zIndex: 0 }} />
            
            <ResponsiveContainer width="100%" height="100%" style={{ zIndex: 1, position: 'relative' }}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={84} outerRadius={110} paddingAngle={3} stroke="var(--bg-base)" strokeWidth={3}>
                  {data.map((item, i) => <Cell key={`c${i}`} fill={item.color} stroke="var(--bg-base)" strokeWidth={3} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-overlay)', border: `1px solid var(--border-default)`, borderRadius: 3, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-sans)' }} formatter={(v, _n, pl) => [`${money(v)}`, pl?.payload?.name]} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
              <strong className="donut-center-value">{formatIndian(centerVal)}</strong>
              <span className="donut-center-label">PORTFOLIO</span>
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