import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { theme } from '../lib/theme.js';

const COLORS = ['#D6C2A1', '#8FA7C9', '#8BC5A1', '#C9A27E', '#A6A29A', '#B9B39A', '#6FAE8D'];

const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

function Insight({ label, value, tone = theme.colors.text }) {
  return (
    <div className="allocation-insight">
      <span>{label}</span>
      <strong style={{ color: tone }}>{value}</strong>
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

  const topGainer = topPositions.slice().sort((a, b) => (b.unrealised_pnl_pct || 0) - (a.unrealised_pnl_pct || 0))[0];
  const topLoser = topPositions.slice().sort((a, b) => (a.unrealised_pnl_pct || 0) - (b.unrealised_pnl_pct || 0))[0];
  const concentration = ranked.slice().sort((a, b) => b.pct - a.pct)[0];
  const sectorCount = new Set(topPositions.map((item) => item.sector).filter(Boolean)).size;
  const diversificationScore = Math.max(0, Math.min(100, Math.round((sectorCount / Math.max(topPositions.length || 1, 1)) * 100)));
  const drift = concentration?.pct > 35 ? `${concentration.ticker} dominates allocation` : 'Within normal operating range';

  if (!data.length) {
    return <div className="allocation-empty">No holdings yet. Import a portfolio to unlock allocations.</div>;
  }

  return (
    <div className="allocation-module">
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
                stroke="rgba(236,224,204,0.08)"
                strokeWidth={1}
                animationDuration={650}
              >
                {data.map((item, index) => (
                  <Cell key={`${item.name}-${index}`} fill={item.color} className="allocation-slice" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#102321', border: `1px solid ${theme.colors.border}`, borderRadius: 12, color: theme.colors.text, boxShadow: theme.shadow }}
                formatter={(value, _name, payload) => [`${money(value)} · ${payload?.payload?.pct.toFixed(1)}%`, payload?.payload?.name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="allocation-center">
            <span>Total Mix</span>
            <strong>100%</strong>
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

      <section className="allocation-bars-panel">
        <div className="allocation-section-head">
          <span>Position Weights</span>
          <strong>{ranked.length} tracked</strong>
        </div>
        <div className="position-bars">
          {ranked.map((item, index) => (
            <div key={`${item.ticker || item.name || 'position'}-${index}`} className="position-bar-row">
              <div className="position-bar-meta">
                <span>{item.ticker}</span>
                <strong>{item.pct.toFixed(1)}%</strong>
              </div>
              <div className="position-bar-track">
                <div className="position-bar-fill" style={{ width: `${Math.max(item.pct, 3)}%`, background: `linear-gradient(90deg, ${item.color}, rgba(214,194,161,0.52))` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="allocation-insights-panel">
        <div className="allocation-section-head">
          <span>Institutional Insights</span>
          <strong>Live</strong>
        </div>
        <Insight label="Top gainer" value={topGainer?.ticker || 'Pending'} tone={theme.colors.success} />
        <Insight label="Top loser" value={topLoser?.ticker || 'Pending'} tone={theme.colors.error} />
        <Insight label="Concentration" value={concentration ? `${concentration.ticker} ${concentration.pct.toFixed(1)}%` : 'Pending'} tone={concentration?.pct > 35 ? theme.colors.warning : theme.colors.text} />
        <Insight label="Diversification" value={`${diversificationScore}/100`} />
        <Insight label="Sector exposure" value={`${sectorCount || 0} sectors`} />
        <Insight label="Allocation drift" value={drift} tone={concentration?.pct > 35 ? theme.colors.warning : theme.colors.textSoft} />
      </section>
    </div>
  );
}
