import React, { useMemo, Suspense, useEffect, useState } from "react";
import { usePortfolio } from "../lib/usePortfolio.js";
import { useMarketData } from "../lib/MarketDataContext.jsx";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageLoadingState, PageErrorState, EmptyState } from "../components/PageStates.jsx";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { request } from "../services/api.js";
import { DonutCard, InsightsCard, PositionWeightsCard } from "../components/DashboardCharts.jsx";

const C = {
  bg: "#0b0f0b", card: "#111811", cardHov: "#162016",
  border: "#1f2b1f", borderSub: "#192319",
  text: "#dceadc", muted: "#6b806b", faint: "#3a4a3a",
  green: "#4ade80", green2: "#22c55e", red: "#f87171",
  yellow: "#fbbf24", blue: "#60a5fa", teal: "#2dd4bf",
};

function fmt(n) {
  if (n == null || isNaN(n)) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function pct(n) {
  if (n == null || isNaN(n)) return "-";
  return (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%";
}

function StatCard({ label, value, sub, tone = "neutral", isLoading = false, trend, borderLeftColor }) {
  const valueColor = tone === "positive" ? C.green : tone === "negative" ? C.red : C.text;
  const subColor   = tone === "positive" ? C.green : tone === "negative" ? C.red : C.muted;
  return (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderLeft: borderLeftColor ? `2px solid ${borderLeftColor}` : `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", minHeight: 110 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      {isLoading
        ? <div style={{ height: 30, width: "60%", borderRadius: 4, background: C.cardHov, marginBottom: 8 }} />
        : <div style={{ fontSize: 26, fontWeight: 600, color: valueColor, fontVariantNumeric: "tabular-nums", marginBottom: 6 }}>{value}</div>}
      {isLoading
        ? <div style={{ height: 13, width: "40%", borderRadius: 4, background: C.cardHov }} />
        : <div style={{ fontSize: 12, color: subColor }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop: 6, fontSize: 10, color: trend >= 0 ? 'var(--accent-green, #4ade80)' : 'var(--accent-red, #f87171)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{trend >= 0 ? '▲' : '▼'}</span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{Math.abs(trend).toFixed(2)}% vs yesterday</span>
        </div>
      )}
    </div>
  );
}

function TickerItem({ name, value, change }) {
  const color  = change > 0 ? C.green : change < 0 ? C.red : C.yellow;
  const prefix = change > 0 ? "+" : change < 0 ? "-" : "";
  const valStr = (typeof value === "number" && value > 0)
    ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 22px", borderRight: "1px solid " + C.borderSub, fontSize: 11, flexShrink: 0, height: "100%" }}>
      <span style={{ color: C.muted, fontWeight: 600, letterSpacing: "0.05em" }}>{name}</span>
      {valStr && <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{valStr}</span>}
      <span style={{ fontSize: 10, color }}>{prefix}{Math.abs(change).toFixed(2)}%</span>
    </span>
  );
}

function TickerTape({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap" style={{ width: "100%", overflow: "hidden", background: C.card, borderTop: "1px solid " + C.border, borderBottom: "1px solid " + C.border, height: 36, display: "flex", alignItems: "center" }}>
      <div className="ticker-track" style={{ display: "flex", gap: 0, animation: "ticker-scroll 50s linear infinite", whiteSpace: "nowrap", height: "100%", alignItems: "center" }}>
        {doubled.map((item, i) => <TickerItem key={i} {...item} />)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { portfolio, transactions, loading, error } = usePortfolio();
  const { holdings: liveHoldings, watchlist: liveWatchlist, marketStatus, wsStatus } = useMarketData();

  const [sparkData, setSparkData] = useState([]);
  const [tickerItems, setTickerItems] = useState([
    { name: "NIFTY 50",  value: 24820.50, change: 0.45 },
    { name: "SENSEX",    value: 81620.30, change: -0.12 },
    { name: "BANKNIFTY", value: 52430.00, change: 0.00 },
  ]);

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    request("GET", "/api/portfolio/history", null, { days: 7 })
      .then(data => { if (Array.isArray(data)) setSparkData(data.map(d => ({ value: d.value }))); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = () => {
      request("GET", "/api/market/ticker")
        .then(data => { if (Array.isArray(data) && data.length) setTickerItems(data); })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const liveHaveVal = liveHoldings.some(h => Number(h?.current_value || 0) > 0 || Number(h?.ltp || 0) > 0);
  const holdings    = liveHaveVal ? liveHoldings : (portfolio?.holdings || []);
  const watchlist   = liveWatchlist.some(i => Number(i?.current_price || 0) > 0)
    ? liveWatchlist : (portfolio?.watchlist || []);

  const summary = useMemo(() => {
    const h = holdings;
    if (!h.length) return portfolio?.summary || {};
    const current_value  = h.reduce((s, x) => s + (x.current_value  || 0), 0);
    const total_invested = h.reduce((s, x) => s + (x.invested_amount || x.invested || 0), 0);
    const total_pnl      = current_value - total_invested;
    const total_pnl_pct  = total_invested ? (total_pnl / total_invested) * 100 : 0;
    const day_change     = h.reduce((s, x) => s + (x.day_change     || 0), 0);
    const day_change_pct = current_value ? (day_change / current_value) * 100 : 0;
    return { current_value, total_invested, total_pnl, total_pnl_pct, day_change, day_change_pct };
  }, [holdings, portfolio?.summary]);

  const allocationData = useMemo(() =>
    holdings.map(h => ({ name: h.company_name || h.name || h.ticker || "Unknown", ticker: h.ticker || h.symbol, value: h.current_value || 0 })),
    [holdings]
  );

  const topPositions = useMemo(() => {
    const total = summary.current_value || 1;
    return holdings.slice().sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).map(h => ({ ...h, weight: ((h.current_value || 0) / total) * 100 })).slice(0, 8);
  }, [holdings, summary.current_value]);

  const activity = useMemo(() => (transactions || []).slice(0, 5), [transactions]);

  const showSkeleton = loading && !liveHoldings.length;

  const yesterdayVal = sparkData.length > 1 ? sparkData[sparkData.length - 2].value : null;
  const todayVal = sparkData.length > 0 ? sparkData[sparkData.length - 1].value : null;
  const trend = yesterdayVal && todayVal ? ((todayVal - yesterdayVal) / yesterdayVal) * 100 : undefined;

  const kpis = [
    { label: "Portfolio Value", value: fmt(summary.current_value),  sub: "Live portfolio valuation",           tone: "neutral",  isLoading: showSkeleton, trend: trend, borderLeftColor: "var(--accent-green, #4ade80)" },
    { label: "Total Invested",  value: fmt(summary.total_invested),  sub: "Cost basis across active positions", tone: "neutral",  isLoading: showSkeleton, trend: trend, borderLeftColor: "var(--text-faint, #3a4a3a)" },
    { label: "Unrealised P&L",  value: fmt(summary.total_pnl),       sub: pct(summary.total_pnl_pct),          tone: (summary.total_pnl  || 0) >= 0 ? "positive" : "negative", isLoading: showSkeleton, trend: trend, borderLeftColor: (summary.total_pnl  || 0) >= 0 ? "var(--accent-green, #4ade80)" : "var(--accent-red, #f87171)" },
    { label: "Day Change",      value: fmt(summary.day_change),      sub: pct(summary.day_change_pct),         tone: (summary.day_change || 0) >= 0 ? "positive" : "negative", isLoading: showSkeleton, trend: trend, borderLeftColor: (summary.day_change || 0) >= 0 ? "var(--accent-green, #4ade80)" : "var(--accent-red, #f87171)" },
  ];

  let connColor = C.yellow, connLabel = "Connecting...";
  if (wsStatus === "connected")   { connColor = C.green;  connLabel = "Live"; }
  else if (wsStatus === "error")  { connColor = C.red;    connLabel = "Reconnecting..."; }
  else if (marketStatus && !marketStatus.is_open) { connColor = C.yellow; connLabel = "Markets Closed"; }

  if (loading && !liveHoldings.length) return <PageLoadingState title="Loading command center..." subtitle="Resolving live holdings and signal flow." />;
  if (error && !liveHoldings.length) return <PageErrorState title="Command center unavailable" message={error} />;

  const topHolding = topPositions[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg }}>

      {/* Command bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", height: 48, flexShrink: 0, borderBottom: "1px solid " + C.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Command Center</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connColor, display: "inline-block", animation: connColor === C.green ? "livepulse 2s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 11, color: connColor }}>{connLabel}</span>
          </span>
        </div>
        <span style={{ fontSize: 11, color: C.faint }}>{holdings.length} positions</span>
      </div>

      {topHolding?.weight > 20 && !dismissed && (
        <div style={{ margin: '8px 24px 0', padding: '8px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ color: 'var(--accent-yellow, #fbbf24)', fontSize: 13 }}>⚠</span>
          <span style={{ color: 'var(--text-secondary, #6b806b)' }}>
            Concentration alert:
            <strong style={{ color: 'var(--accent-yellow, #fbbf24)', marginLeft: 4 }}>{topHolding.name || topHolding.symbol || topHolding.ticker}</strong>
            {' '}represents{' '}
            <strong style={{ color: 'var(--accent-yellow, #fbbf24)' }}>{topHolding.weight.toFixed(1)}%</strong>
            {' '}of your portfolio. Consider rebalancing.
          </span>
          <button onClick={() => setDismissed(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-faint, #3a4a3a)', cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      )}

      {/* KPI row */}
      <div style={{ padding: "16px 24px 0", flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {kpis.map(item => <StatCard key={item.label} {...item} />)}
        </div>
      </div>

      {/* Ticker tape */}
      <div style={{ flexShrink: 0, marginTop: 16 }}>
        <TickerTape items={tickerItems} />
      </div>

      {/* Body grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, padding: "16px 24px 24px", alignItems: "start", flex: 1, minHeight: 0 }}>

        {/* Left column */}
        <div className="left-column" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, paddingBottom: 24 }}>
          
          {/* AI Brief */}
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: "18px 20px" }}>
            <div className="card-header" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>AI Brief</div>
            <div style={{ display: "grid", gap: 8, color: C.muted, lineHeight: 1.65, fontSize: 13 }}>
              {holdings.length ? (
                <>
                  <p style={{ margin: 0 }}>You hold <strong style={{ color: C.text }}>{holdings.length}</strong> active positions. Unrealised P&amp;L stands at <strong style={{ color: (summary.total_pnl || 0) >= 0 ? C.green : C.red }}>{fmt(summary.total_pnl)} ({pct(summary.total_pnl_pct)})</strong>. Your largest exposure is <strong style={{ color: C.text }}>{topPositions[0]?.ticker || topPositions[0]?.symbol || "-"}</strong> at <strong style={{ color: C.text }}>{((topPositions[0]?.current_value || 0) / (summary.current_value || 1) * 100).toFixed(1)}%</strong> of the portfolio.</p>
                  
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-faint, #3a4a3a)', letterSpacing: '0.1em', marginBottom: 6 }}>7-DAY PERFORMANCE</div>
                    <ResponsiveContainer width="100%" height={56}>
                      <LineChart data={sparkData}>
                        <Line type="monotone" dataKey="value" stroke="var(--accent-green, #4ade80)" strokeWidth={1.5} dot={false} />
                        <RechartsTooltip contentStyle={{ background: 'var(--bg-card, #111811)', border: '1px solid var(--border, #1f2b1f)', fontSize: 10, borderRadius: 4 }} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Value']} labelStyle={{ color: 'var(--text-secondary, #6b806b)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {sparkData.length > 1 && (() => {
                    const changes = sparkData.slice(1).map((d, i) => ((d.value - sparkData[i].value) / sparkData[i].value) * 100);
                    const best  = Math.max(...changes);
                    const worst = Math.min(...changes);
                    const avg   = changes.reduce((a, b) => a + b, 0) / changes.length;
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
                        {[
                          { label: 'BEST DAY',  value: best,  },
                          { label: 'WORST DAY', value: worst, },
                          { label: 'AVG DAILY', value: avg,   },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ background: 'var(--bg-base, #0b0f0b)', borderRadius: 4, padding: '6px 8px', border: '1px solid var(--border-subtle, #192319)' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-faint, #3a4a3a)', letterSpacing: '0.08em' }}>{label}</div>
                            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: value >= 0 ? 'var(--accent-green, #4ade80)' : 'var(--accent-red, #f87171)', marginTop: 2 }}>
                              {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p style={{ margin: 0 }}>Add your first holding to activate intelligence.</p>
              )}
            </div>
          </div>

          {/* Donut Card */}
          {holdings.length > 0 ? (
            <>
              <Suspense fallback={<div style={{ color: C.muted, fontSize: 13 }}>Loading charts...</div>}>
                <DonutCard allocationData={allocationData} portfolioValue={summary.current_value} />
                <InsightsCard topPositions={topPositions} holdings={holdings} />
              </Suspense>
            </>
          ) : (
            <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
              <EmptyState title="No holdings to chart" message="Import a portfolio to unlock allocation visuals." />
            </div>
          )}

        </div>

        {/* Right column */}
        <div className="right-column" style={{ display: "flex", flexDirection: "column", gap: 16, width: 320, minWidth: 320, flexShrink: 0 }}>

          {/* Position Weights */}
          {holdings.length > 0 && (
            <Suspense fallback={<div />}>
              <PositionWeightsCard topPositions={topPositions} />
            </Suspense>
          )}

          {/* Activity Feed */}
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: "18px 20px" }}>
            <div className="card-header" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>Activity Feed</div>
            <div style={{ display: "grid", gap: 8 }}>
              {activity.length ? activity.map((tx, i) => (
                <div key={tx.id || i} style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid " + C.borderSub, background: C.cardHov }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: tx.action === "BUY" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", color: tx.action === "BUY" ? C.green : C.red, border: "1px solid " + (tx.action === "BUY" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)") }}>{tx.action}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{tx.ticker}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{tx.quantity} @ {fmt(tx.price)}</div>
                      </div>
                    </div>
                    {tx.action === "BUY" ? <TrendingUp size={13} color={C.green} /> : <TrendingDown size={13} color={C.red} />}
                  </div>
                </div>
              )) : (
                <div style={{ color: C.faint, fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span>No transactions yet.</span>
                  <a href="/app/upload" style={{ color: C.blue, textDecoration: "none", fontSize: 12 }}>Import your holdings -&gt;</a>
                </div>
              )}
            </div>
          </div>

          {/* Watchlist */}
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: "18px 20px" }}>
            <div className="card-header" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>Watchlist</div>
            <div style={{ display: "grid", gap: 8 }}>
              {watchlist.length ? watchlist.map(item => (
                <div key={item.id || item.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6, border: "1px solid " + C.borderSub }}>
                  <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{item.ticker}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                    {item.current_price && <span style={{ fontVariantNumeric: "tabular-nums", color: C.text }}>{fmt(item.current_price)}</span>}
                    {item.change_pct != null && <span style={{ color: item.change_pct >= 0 ? C.green : C.red }}>{pct(item.change_pct)}</span>}
                    {!item.current_price && <span style={{ color: C.muted }}>{item.target_price ? fmt(item.target_price) : "No target"}</span>}
                  </div>
                </div>
              )) : (
                <a href="/app/watchlist" style={{ color: C.blue, textDecoration: "none", fontSize: 13 }}>Add symbols from the Watchlist page -&gt;</a>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}