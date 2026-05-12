import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { theme } from '../lib/theme.js';

export default function DashboardCharts({ allocationData = [], topPositions = [], chartData = [] }) {
  const COLORS = [theme.colors.gold, theme.colors.accent, theme.colors.success, theme.colors.warning, '#8A8678', '#AFA88F'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
      <div style={{ padding: 0 }}>
        {allocationData.length ? (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} paddingAngle={4}>
                  {allocationData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0E1E1C', border: `1px solid ${theme.colors.border}`, borderRadius: 10, color: theme.colors.text }} formatter={(v) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v), 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ color: theme.colors.textMuted, minHeight: 280, display: 'grid', placeItems: 'center' }}>No holdings yet. Import a portfolio to unlock allocations.</div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ padding: 0 }}>
          {topPositions.length ? (
            <div style={{ height: 260 }}>
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
