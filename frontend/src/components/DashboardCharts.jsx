import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { theme } from '../lib/theme.js';

export default function DashboardCharts({ allocationData = [], topPositions = [], chartData = [] }) {
  const COLORS = ['#D6C2A1', '#8FA7C9', '#8BC5A1', '#C9A27E', '#A6A29A', '#B9B39A'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
      <div style={{ padding: 0 }}>
        {allocationData.length ? (
          <div style={{ height: 320, display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={114}
                  paddingAngle={3}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                  animationDuration={1200}
                >
                  {allocationData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0E1E1C', border: `1px solid ${theme.colors.border}`, borderRadius: 10, color: theme.colors.text }}
                  formatter={(v, _n, payload) => [
                    `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)} · ${((payload?.payload?.value || 0) / allocationData.reduce((sum, item) => sum + item.value, 0) * 100 || 0).toFixed(1)}%`,
                    payload?.payload?.name || 'Allocation',
                  ]}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ color: theme.colors.textSoft, paddingLeft: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gap: 10 }}>
              {allocationData.map((item, index) => {
                const total = allocationData.reduce((sum, entry) => sum + entry.value, 0) || 1;
                const pct = (item.value / total) * 100;
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS[index % COLORS.length], boxShadow: '0 0 0 4px rgba(255,255,255,0.02)' }} />
                      <span style={{ color: theme.colors.textSoft, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    <span style={{ color: theme.colors.text, fontSize: 13, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ color: theme.colors.textMuted, minHeight: 280, display: 'grid', placeItems: 'center' }}>No holdings yet. Import a portfolio to unlock allocations.</div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ padding: 0 }}>
          {topPositions.length ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPositions} layout="vertical" margin={{ left: 10, right: 18, top: 6, bottom: 6 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="ticker" width={84} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0E1E1C', border: `1px solid ${theme.colors.border}`, borderRadius: 10, color: theme.colors.text }} formatter={(v) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v), 'Value']} />
                  <Bar dataKey="current_value" radius={[0, 12, 12, 0]} barSize={18}>
                    {topPositions.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ color: theme.colors.textMuted, minHeight: 260, display: 'grid', placeItems: 'center' }}>No holdings to rank yet.</div>
          )}
        </div>

        <div style={{ padding: 0 }}>
          {/* Placeholder for additional mini-charts or KPI visualizations if needed */}
          <div style={{ color: theme.colors.textMuted, minHeight: 80, display: 'grid', placeItems: 'center' }}>Signals & summaries</div>
        </div>
      </div>
    </div>
  );
}
