import React, { useEffect, useMemo, useState } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Activity, LineChart as LineChartIcon, Shield, Percent, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { panelStyle, theme } from '../lib/theme.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
function fmtCrore(n) {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e7) return `₹${fmt(n / 1e7, 2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${fmt(n / 1e5, 2)} L`;
  return `₹${fmt(n, 0)}`;
}

// ── Donut ────────────────────────────────────────────────────────
const DONUT_COLORS = [
  theme.colors.gold,
  theme.colors.accent,
  theme.colors.success,
  theme.colors.warning,
  '#8B9DBC',
  '#7ABFA5',
  '#C4A882',
];

function AllocationDonut({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return null;
  const r = 48, cx = 64, cy = 64, stroke = 16;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices.map((s, i) => {
    const pct = s.value / total;
    const dash = pct * circ;
    const arc = { ...s, dash, gap: circ - dash, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += dash;
    return arc;
  });
  return (
    <svg width={128} height={128} viewBox="0 0 128 128" aria-label="Allocation donut chart">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={circ / 4 - arc.offset}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={theme.colors.text} fontSize="11" fontWeight="700">{slices.length}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill={theme.colors.textMuted} fontSize="9">classes</text>
    </svg>
  );
}

// ── P&L Bar ──────────────────────────────────────────────────────
function PnLBar({ pnl, maxAbs }) {
  const pct = maxAbs > 0 ? Math.abs(pnl) / maxAbs : 0;
  const positive = pnl >= 0;
  return (
    <div style={{ flex: 1, height: 8, borderRadius: 99, background: theme.colors.border, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: 99,
          background: positive ? theme.colors.success : theme.colors.error,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ── Day Change Heatmap ───────────────────────────────────────────
function DayHeatmapCell({ ticker, pct }) {
  const intensity = Math.min(Math.abs(pct || 0) / 5, 1);
  const positive = (pct || 0) >= 0;
  const bg = positive
    ? `rgba(111,174,141,${0.15 + intensity * 0.65})`
    : `rgba(182,106,106,${0.15 + intensity * 0.65})`;
  return (
    <div
      style={{
        borderRadius: 10,
        padding: '8px 10px',
        background: bg,
        border: `1px solid ${positive ? 'rgba(111,174,141,0.22)' : 'rgba(182,106,106,0.22)'}`,
        minWidth: 72,
        textAlign: 'center',
      }}
    >
      <div style={{ color: theme.colors.text, fontWeight: 700, fontSize: 12 }}>{ticker}</div>
      <div style={{ color: positive ? theme.colors.success : theme.colors.error, fontSize: 11, fontWeight: 600, marginTop: 2 }}>
        {pct != null ? `${pct >= 0 ? '+' : ''}${fmt(pct, 2)}%` : '—'}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ ...panelStyle({ padding: '16px 18px' }), display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {Icon && <Icon size={13} />}{label}
      </div>
      <div style={{ color: color || theme.colors.text, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function calcReturns(values) {
  const out = [];
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1];
    const curr = values[i];
    if (!prev || !curr) continue;
    out.push((curr - prev) / prev);
  }
  return out;
}

function calcStdDev(numbers) {
  if (!numbers.length) return 0;
  const mean = numbers.reduce((s, n) => s + n, 0) / numbers.length;
  const variance = numbers.reduce((s, n) => s + ((n - mean) ** 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

function calcCagr(first, last, days) {
  if (!first || !last || first <= 0 || days <= 0) return 0;
  const years = days / 365;
  if (years <= 0) return 0;
  return ((last / first) ** (1 / years) - 1) * 100;
}

function calcDrawdownSeries(values) {
  let peak = 0;
  return values.map((value) => {
    peak = Math.max(peak, value);
    return peak > 0 ? ((value - peak) / peak) * 100 : 0;
  });
}

function calcBeta(portfolioReturns, benchmarkReturns) {
  const pairs = portfolioReturns
    .map((r, i) => [r, benchmarkReturns[i]])
    .filter(([p, b]) => Number.isFinite(p) && Number.isFinite(b));
  if (pairs.length < 2) return 0;
  const pMean = pairs.reduce((s, [p]) => s + p, 0) / pairs.length;
  const bMean = pairs.reduce((s, [, b]) => s + b, 0) / pairs.length;
  const cov = pairs.reduce((s, [p, b]) => s + ((p - pMean) * (b - bMean)), 0) / pairs.length;
  const bVar = pairs.reduce((s, [, b]) => s + ((b - bMean) ** 2), 0) / pairs.length;
  return bVar > 0 ? cov / bVar : 0;
}

function calcXirr(transactions, currentValue) {
  if (!transactions.length || !currentValue) return 0;
  const cashFlows = [];
  transactions.forEach((txn) => {
    const date = txn.transaction_date || txn.date;
    const action = (txn.action || 'buy').toLowerCase();
    const amount = (Number(txn.price || 0) * Number(txn.quantity || 0));
    if (!date || !amount) return;
    cashFlows.push({
      date: new Date(date),
      value: action === 'sell' ? amount : -amount,
    });
  });
  cashFlows.push({ date: new Date(), value: Number(currentValue) });
  if (cashFlows.length < 2) return 0;

  const daysBetween = (a, b) => (b - a) / (1000 * 60 * 60 * 24);
  const npv = (rate) => cashFlows.reduce((sum, cf) => {
    const years = daysBetween(cashFlows[0].date, cf.date) / 365;
    return sum + (cf.value / ((1 + rate) ** years));
  }, 0);

  let rate = 0.12;
  for (let i = 0; i < 30; i += 1) {
    const f = npv(rate);
    const eps = 1e-5;
    const deriv = (npv(rate + eps) - f) / eps;
    if (!Number.isFinite(deriv) || deriv === 0) break;
    const next = rate - (f / deriv);
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-6) return next * 100;
    rate = next;
  }
  return rate * 100;
}

// ── Main Page ────────────────────────────────────────────────────
export default function Analytics() {
  const { holdings, summary, loading } = usePortfolio();
  const [range, setRange] = useState('90');
  const [history, setHistory] = useState([]);
  const [benchmark, setBenchmark] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token') || '';
        const [portfolioRes, benchmarkRes, txnRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/portfolio/history?days=${range}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/market/history?symbol=NIFTYBEES&range=${range === '30' ? '1M' : range === '90' ? '3M' : range === '365' ? '1Y' : '1M'}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
        ]);

        const portfolioJson = portfolioRes.ok ? await portfolioRes.json() : { history: [] };
        const benchmarkJson = benchmarkRes.ok ? await benchmarkRes.json() : { points: [] };
        const txnJson = txnRes.ok ? await txnRes.json() : [];

        setHistory(portfolioJson.history || []);
        setBenchmark(benchmarkJson.points || []);
        setTransactions(Array.isArray(txnJson) ? txnJson : (txnJson.transactions || txnJson.data || []));
      } catch {
        setHistory([]);
        setBenchmark([]);
        setTransactions([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
    return () => controller.abort();
  }, [range]);

  const [transactions, setTransactions] = useState([]);

  const derived = useMemo(() => {
    if (!holdings.length) return null;

    // P&L per holding
    const withPnl = holdings.map((h) => {
      const cost = (h.avg_buy_price || 0) * (h.quantity || 0);
      const ltp = h.ltp || h.avg_buy_price || 0;
      const current = ltp * (h.quantity || 0);
      const pnl = current - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, pnl, pnlPct, current, cost };
    });

    const sorted = [...withPnl].sort((a, b) => b.pnl - a.pnl);
    const maxAbs = Math.max(...withPnl.map((h) => Math.abs(h.pnl)), 1);

    // Allocation slices by asset_class
    const byClass = {};
    withPnl.forEach((h) => {
      const cls = (h.asset_class || 'equity').toLowerCase();
      byClass[cls] = (byClass[cls] || 0) + h.current;
    });
    const donutSlices = Object.entries(byClass).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const totalPnl = withPnl.reduce((s, h) => s + h.pnl, 0);
    const totalCost = withPnl.reduce((s, h) => s + h.cost, 0);
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    const historyValues = history.map((p) => Number(p.value || 0)).filter(Boolean);
    const benchmarkValues = benchmark.map((p) => Number(p.value || p.Close || 0)).filter(Boolean);
    const portfolioReturns = calcReturns(historyValues);
    const benchmarkReturns = calcReturns(benchmarkValues);
    const drawdownSeries = calcDrawdownSeries(historyValues);
    const maxDrawdown = drawdownSeries.length ? Math.min(...drawdownSeries) : 0;
    const volatility = calcStdDev(portfolioReturns) * Math.sqrt(252) * 100;
    const sharpe = portfolioReturns.length ? ((portfolioReturns.reduce((s, r) => s + r, 0) / portfolioReturns.length) * 252 * 100 - 6.5) / (volatility || 1) : 0;
    const cagr = calcCagr(historyValues[0], historyValues[historyValues.length - 1], Number(range));
    const beta = calcBeta(portfolioReturns, benchmarkReturns);
    const xirr = calcXirr(transactions, summary?.total_value || historyValues[historyValues.length - 1] || totalCost + totalPnl);

    const chartData = history.map((p, index) => ({
      date: p.date,
      portfolio: Number(p.value || 0),
      benchmark: Number(benchmark[index]?.value || benchmark[index]?.Close || 0),
      drawdown: drawdownSeries[index] || 0,
    }));

    return { withPnl, sorted, maxAbs, donutSlices, best, worst, totalPnl, totalPnlPct, cagr, xirr, volatility, sharpe, beta, maxDrawdown, chartData };
  }, [benchmark, history, holdings, range, summary?.total_value, transactions]);

  if (loading) return <PageLoadingState title="Loading analytics…" subtitle="Crunching portfolio performance data." />;
  if (!holdings.length) return <EmptyState title="No holdings to analyse" message="Import or add holdings to see your analytics dashboard." />;

  const { withPnl, sorted, maxAbs, donutSlices, best, worst, totalPnl, totalPnlPct, cagr, xirr, volatility, sharpe, beta, maxDrawdown, chartData } = derived;

  const winners = sorted.filter((h) => h.pnl >= 0);
  const losers = sorted.filter((h) => h.pnl < 0).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="section-label">Performance Analytics</div>
          <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>Historical return analysis, benchmark comparison, and risk metrics.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['30', '90', '365'].map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${range === value ? theme.colors.gold : theme.colors.border}`,
                background: range === value ? 'rgba(213,181,115,0.12)' : 'transparent',
                color: theme.colors.text,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {value === '30' ? '30D' : value === '90' ? '90D' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard
          label="Total P&L"
          value={fmtCrore(totalPnl)}
          sub={`${totalPnl >= 0 ? '+' : ''}${fmt(totalPnlPct, 2)}% overall`}
          color={totalPnl >= 0 ? theme.colors.success : theme.colors.error}
          icon={BarChart2}
        />
        <StatCard
          label="Best Performer"
          value={best?.ticker || '—'}
          sub={best ? `+${fmt(best.pnlPct, 2)}%` : ''}
          color={theme.colors.success}
          icon={TrendingUp}
        />
        <StatCard
          label="Worst Performer"
          value={worst?.ticker || '—'}
          sub={worst ? `${fmt(worst.pnlPct, 2)}%` : ''}
          color={theme.colors.error}
          icon={TrendingDown}
        />
        <StatCard
          label="Active Positions"
          value={holdings.length}
          sub={`${winners.length} winners · ${losers.length} losers`}
          icon={Activity}
        />
        <StatCard
          label="CAGR"
          value={`${fmt(cagr, 2)}%`}
          sub="Annualized return"
          color={cagr >= 0 ? theme.colors.success : theme.colors.error}
          icon={ArrowUpRight}
        />
        <StatCard
          label="XIRR"
          value={`${fmt(xirr, 2)}%`}
          sub="Cash-flow weighted return"
          color={xirr >= 0 ? theme.colors.success : theme.colors.error}
          icon={Percent}
        />
        <StatCard
          label="Volatility"
          value={`${fmt(volatility, 2)}%`}
          sub="Annualized standard deviation"
          icon={Shield}
        />
        <StatCard
          label="Sharpe / Beta"
          value={`${fmt(sharpe, 2)} / ${fmt(beta, 2)}`}
          sub={`Max drawdown ${fmt(maxDrawdown, 2)}%`}
          icon={Scale}
        />
      </div>

      <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Portfolio vs Benchmark</div>
        <div style={{ height: 280, width: '100%' }}>
          {loadingHistory ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textMuted }}>Loading history…</div>
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: '#0f1e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: theme.colors.text }}
                />
                <Line type="monotone" dataKey="portfolio" stroke={theme.colors.gold} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="benchmark" stroke={theme.colors.accent} strokeWidth={2} dot={false} strokeDasharray="5 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textMuted }}>No history available yet.</div>
          )}
        </div>
      </div>

      <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Drawdown Profile</div>
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.colors.error} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={theme.colors.error} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ background: '#0f1e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: theme.colors.text }} />
              <Area type="monotone" dataKey="drawdown" stroke={theme.colors.error} fill="url(#drawdownFill)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Allocation + P&L ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'min(260px, 100%) 1fr', gap: 14 }}>
        {/* Donut */}
        <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
          <div className="section-label" style={{ marginBottom: 14 }}>Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <AllocationDonut slices={donutSlices} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donutSlices.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: theme.colors.textSoft, flex: 1, textTransform: 'capitalize' }}>{s.label}</span>
                  <span style={{ color: theme.colors.text, fontWeight: 700 }}>
                    {fmt((s.value / donutSlices.reduce((a, x) => a + x.value, 0)) * 100, 1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* P&L bars */}
        <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
          <div className="section-label" style={{ marginBottom: 14 }}>P&amp;L by Holding</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {sorted.map((h) => (
              <div key={h.id || h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 28 }}>
                <span style={{ color: theme.colors.textSoft, fontSize: 12, fontWeight: 700, width: 72, flexShrink: 0 }}>{h.ticker}</span>
                <PnLBar pnl={h.pnl} maxAbs={maxAbs} />
                <span
                  style={{
                    color: h.pnl >= 0 ? theme.colors.success : theme.colors.error,
                    fontSize: 12, fontWeight: 700, width: 80, textAlign: 'right', flexShrink: 0,
                  }}
                >
                  {h.pnl >= 0 ? '+' : ''}{fmtCrore(h.pnl)}
                </span>
                <span
                  style={{
                    color: h.pnl >= 0 ? theme.colors.success : theme.colors.error,
                    fontSize: 11, width: 52, textAlign: 'right', flexShrink: 0,
                  }}
                >
                  {h.pnl >= 0 ? '+' : ''}{fmt(h.pnlPct, 1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day Change Heatmap ── */}
      <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Day Change Heatmap</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {withPnl.map((h) => (
            <DayHeatmapCell key={h.ticker} ticker={h.ticker} pct={h.day_change_pct ?? null} />
          ))}
        </div>
      </div>

      {/* ── Top Winners / Losers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[{ label: '🏆 Top Winners', items: winners.slice(0, 5), positive: true }, { label: '📉 Top Losers', items: losers.slice(0, 5), positive: false }].map(({ label, items, positive }) => (
          <div key={label} style={{ ...panelStyle({ padding: '16px 14px' }) }}>
            <div className="section-label" style={{ marginBottom: 12 }}>{label}</div>
            {!items.length ? (
              <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>None</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((h) => (
                  <div key={h.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <div style={{ color: theme.colors.text, fontWeight: 700 }}>{h.ticker}</div>
                      <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>{h.company_name || h.asset_class}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: positive ? theme.colors.success : theme.colors.error, fontWeight: 700 }}>
                        {h.pnl >= 0 ? '+' : ''}{fmtCrore(h.pnl)}
                      </div>
                      <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                        {h.pnlPct >= 0 ? '+' : ''}{fmt(h.pnlPct, 2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
