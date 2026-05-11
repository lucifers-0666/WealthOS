import React, { useMemo } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import KpiCard from '../components/KpiCard.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const COLORS = ['#7DD3FC', '#A78BFA', '#67E8F9', '#D6C7A1', '#6EE7B7', '#FCA5A5'];

function fmt(n, currency = 'INR') {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n) {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export default function Dashboard() {
  const { portfolio, holdings, loading, error, refresh } = usePortfolio();

  const kpis = useMemo(() => {
    if (!portfolio) return [];
    const s = portfolio.summary || {};
    return [
      { label: 'Portfolio Value', value: fmt(s.current_value), sub: 'Live valuation', trend: s.total_pnl_pct >= 0 ? 'up' : 'down' },
      { label: 'Total Invested', value: fmt(s.invested_value), sub: 'Cost basis', trend: 'neutral' },
      { label: 'Unrealised P&L', value: fmt(s.total_pnl), sub: fmtPct(s.total_pnl_pct), trend: s.total_pnl >= 0 ? 'up' : 'down' },
      { label: 'Day Change', value: fmtPct(s.day_change_pct), sub: fmt(s.day_change), trend: s.day_change >= 0 ? 'up' : 'down' },
      { label: 'Holdings', value: holdings.length, sub: 'Positions', trend: 'neutral' },
      { label: 'XIRR', value: s.xirr ? `${s.xirr.toFixed(1)}%` : '—', sub: 'Annualised return', trend: s.xirr >= 0 ? 'up' : 'down' },
    ];
  }, [portfolio, holdings]);

  const allocationData = useMemo(() => {
    if (!holdings.length) return [];
    const groups = {};
    holdings.forEach((h) => {
      const cls = h.asset_class || 'Other';
      groups[cls] = (groups[cls] || 0) + (h.current_value || 0);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const chartData = useMemo(() => {
    if (!portfolio?.history) return [];
    return portfolio.history.map((p) => ({ date: p.date, value: p.value }));
  }, [portfolio]);

  if (loading) return <div className="page-loading"><div className="shimmer-block" style={{height: 400}} /></div>;
  if (error) return <div className="page-error">Failed to load portfolio: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio Overview</h1>
          <p className="page-subtitle">Live snapshot of your wealth position</p>
        </div>
        <button className="btn-ghost" onClick={refresh}>Refresh Prices</button>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Portfolio value history */}
        <div className="chart-card">
          <SectionHeader title="Portfolio Value" subtitle="Reconstructed from transactions" />
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7DD3FC" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ background: '#0B1728', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 8, color: '#F3F4F6', fontSize: 12 }}
                  formatter={(v) => [fmt(v), 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#7DD3FC" strokeWidth={1.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state-sm">Upload transactions to see history</div>
          )}
        </div>

        {/* Allocation donut */}
        <div className="chart-card">
          <SectionHeader title="Asset Allocation" subtitle="By asset class" />
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value">
                  {allocationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0B1728', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 8, color: '#F3F4F6', fontSize: 12 }}
                  formatter={(v) => [fmt(v), 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state-sm">No holdings yet</div>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="table-card">
        <SectionHeader title="Holdings" subtitle={`${holdings.length} positions`} />
        {holdings.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th><th>Company</th><th>Qty</th>
                  <th>Avg Price</th><th>LTP</th>
                  <th>Current Value</th><th>P&amp;L</th><th>P&amp;L %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td><span className="ticker-badge">{h.ticker}</span></td>
                    <td className="text-muted">{h.company_name || '—'}</td>
                    <td>{h.quantity}</td>
                    <td>{fmt(h.avg_buy_price)}</td>
                    <td>{fmt(h.current_price)}</td>
                    <td>{fmt(h.current_value)}</td>
                    <td className={h.unrealised_pnl >= 0 ? 'text-positive' : 'text-negative'}>
                      {fmt(h.unrealised_pnl)}
                    </td>
                    <td className={h.unrealised_pnl_pct >= 0 ? 'text-positive' : 'text-negative'}>
                      {fmtPct(h.unrealised_pnl_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No holdings found.</p>
            <a href="/upload" className="btn-primary" style={{display:'inline-block', marginTop: 12}}>Upload Portfolio</a>
          </div>
        )}
      </div>
    </div>
  );
}
