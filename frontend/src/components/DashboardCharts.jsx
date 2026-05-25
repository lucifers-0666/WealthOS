import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { theme } from '../lib/theme.js';

export default function DashboardCharts({ allocationData = [], topPositions = [], chartData = [] }) {
  const COLORS = ['#D6C2A1', '#8FA7C9', '#8BC5A1', '#C9A27E', '#A6A29A', '#B9B39A'];
  const totalAllocation = allocationData.reduce((sum, item) => sum + item.value, 0) || 1;
  const allocationRows = allocationData.map((item, index) => ({
    ...item,
    pct: (item.value / totalAllocation) * 100,
    color: COLORS[index % COLORS.length],
  }));

  const sortedByMove = topPositions.slice().sort((a, b) => (b.day_change_pct || b.unrealised_pnl_pct || 0) - (a.day_change_pct || a.unrealised_pnl_pct || 0));
  const sortedByGain = topPositions.slice().sort((a, b) => (b.unrealised_pnl_pct || 0) - (a.unrealised_pnl_pct || 0));
  const sortedByLoss = topPositions.slice().sort((a, b) => (a.unrealised_pnl_pct || 0) - (b.unrealised_pnl_pct || 0));

  const topMover = sortedByMove[0];
  const biggestGain = sortedByGain[0];
  const biggestLoss = sortedByLoss[0];

  const concentration = allocationRows.slice().sort((a, b) => b.pct - a.pct)[0];
  const concentrationWarning = concentration && concentration.pct > 45
    ? `High concentration in ${concentration.name} (${concentration.pct.toFixed(1)}%)`
    : concentration
      ? `Concentration balanced · ${concentration.name} at ${concentration.pct.toFixed(1)}%`
      : 'Awaiting allocation breakdown';

  const sentimentScore = sortedByGain.length
    ? sortedByGain.reduce((sum, h) => sum + (h.day_change_pct || 0), 0) / sortedByGain.length
    : 0;
  const sentiment = sentimentScore > 0.4 ? 'Bullish' : sentimentScore < -0.4 ? 'Bearish' : 'Neutral';

  return (
    <div className="allocation-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
      <div style={{ padding: 0, minWidth: 0 }}>
        {allocationData.length ? (
          <div className="allocation-inner" style={{ minHeight: 320, display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)', gap: 16, alignItems: 'center' }}>
            <div style={{ height: 300, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationRows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={78}
                    outerRadius={120}
                    paddingAngle={3}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1}
                    animationDuration={1200}
                  >
                    {allocationRows.map((item, index) => <Cell key={item.name || index} fill={item.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0E1E1C', border: `1px solid ${theme.colors.border}`, borderRadius: 10, color: theme.colors.text }}
                    formatter={(v, _n, payload) => [
                      `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)} · ${((payload?.payload?.value || 0) / totalAllocation * 100 || 0).toFixed(1)}%`,
                      payload?.payload?.name || 'Allocation',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Equity</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: theme.colors.text }}>100.0%</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {allocationRows.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color, boxShadow: '0 0 0 4px rgba(255,255,255,0.02)' }} />
                    <span style={{ color: theme.colors.textSoft, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  </div>
                  <span style={{ color: theme.colors.text, fontSize: 13, fontWeight: 700 }}>{item.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: theme.colors.textMuted, minHeight: 280, display: 'grid', placeItems: 'center' }}>No holdings yet. Import a portfolio to unlock allocations.</div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ padding: 0 }}>
          {topPositions.length ? (
            <div style={{ height: 280, display: 'grid', gap: 10 }}>
              {topPositions.map((item, index) => {
                const total = topPositions.reduce((sum, entry) => sum + (entry.current_value || 0), 0) || 1;
                const pct = ((item.current_value || 0) / total) * 100;
                return (
                  <div key={item.ticker || index} style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: theme.colors.textSoft, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.ticker}</span>
                      <span style={{ color: theme.colors.text, fontSize: 12, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(pct, 4).toFixed(1)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, rgba(214,194,161,0.6))`,
                          transition: 'width 700ms ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: theme.colors.textMuted, minHeight: 260, display: 'grid', placeItems: 'center' }}>No holdings to rank yet.</div>
          )}
        </div>

        <div style={{ padding: 0 }}>
          <div style={{ display: 'grid', gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Signals & summaries</div>
            <div style={{ display: 'grid', gap: 10, fontSize: 13, color: theme.colors.textSoft }}>
              <div>Top mover: <strong style={{ color: theme.colors.text }}>{topMover?.ticker || '—'}</strong></div>
              <div>Biggest gain: <strong style={{ color: theme.colors.success }}>{biggestGain?.ticker || '—'}</strong></div>
              <div>Biggest loss: <strong style={{ color: theme.colors.error }}>{biggestLoss?.ticker || '—'}</strong></div>
              <div>{concentrationWarning}</div>
              <div>Market sentiment: <strong style={{ color: theme.colors.text }}>{sentiment}</strong></div>
              <div>Allocation drift: <strong style={{ color: theme.colors.text }}>Target mix pending</strong></div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .allocation-grid { grid-template-columns: 1fr; }
          .allocation-inner { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
