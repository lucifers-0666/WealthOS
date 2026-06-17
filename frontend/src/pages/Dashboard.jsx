import React, { useMemo, Suspense, useEffect, useState } from "react";
import { usePortfolio } from "../lib/usePortfolio.js";
import { useMarketData } from "../lib/MarketDataContext.jsx";
import { PageLoadingState, PageErrorState, EmptyState } from "../components/PageStates.jsx";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { request } from "../services/api.js";
import { DonutCard, InsightsCard, PositionWeightsCard } from "../components/DashboardCharts.jsx";
import { ArrowsClockwise, Warning, X, ArrowUp, ArrowDown, Star, Clock } from "@phosphor-icons/react";

function fmt(n) {
  if (n == null || isNaN(n)) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function pct(n) {
  if (n == null || isNaN(n)) return "-";
  return (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%";
}

function SectionHeader({ title, icon: Icon, onIconClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 14 }}>
        <div style={{ width: 2, height: '100%', background: 'var(--accent-gold)', marginRight: 8 }} />
        <span className="section-header">{title}</span>
      </div>
      {Icon && (
        <button onClick={onIconClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <Icon size={14} color="var(--text-muted)" />
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, leftBorderColor, sparklineColor }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 3,
      padding: '18px 20px',
      minHeight: 100,
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: leftBorderColor }} />
      <div className="kpi-label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="kpi-value" style={{ marginBottom: 4, color: sparklineColor || 'var(--text-primary)' }}>{value}</div>
      <div className="kpi-sublabel">{sub}</div>
      {sparklineColor && (
        <div style={{ position: 'absolute', right: 20, bottom: 18, width: 48, height: 28, opacity: 0.8 }}>
          <svg width="48" height="28" viewBox="0 0 48 28" preserveAspectRatio="none">
            <path d="M0 20 Q 12 28, 24 15 T 48 5" fill="none" stroke={sparklineColor} strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  );
}

function TickerItem({ name, value, change }) {
  const isGain = change >= 0;
  const color = isGain ? 'var(--status-gain)' : 'var(--status-loss)';
  const valStr = typeof value === "number" ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 20px", borderRight: "1px solid var(--border-subtle)", height: "100%" }}>
      <span className="ticker-index-name">{name}</span>
      <span className="ticker-value">{valStr}</span>
      <span className="ticker-change" style={{ color }}>{isGain ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { portfolio, transactions, loading, error } = usePortfolio();
  const { holdings: liveHoldings, watchlist: liveWatchlist } = useMarketData();

  const [sparkData, setSparkData] = useState([]);
  const [tickerItems, setTickerItems] = useState([
    { name: "NIFTY 50", value: 22419.95, change: 0.42 },
    { name: "SENSEX", value: 73806.15, change: 0.45 },
    { name: "USD/INR", value: 83.24, change: -0.12 },
    { name: "GOLD", value: 71200, change: 1.20 },
    { name: "MIDCAP 150", value: 11847.30, change: 0.54 },
    { name: "IT INDEX", value: 36214.80, change: -0.18 },
  ]);

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    request("GET", "/api/portfolio/history", null, { days: 7 })
      .then(data => { if (Array.isArray(data)) setSparkData(data.map(d => ({ value: d.value }))); })
      .catch(() => {});
  }, []);

  const liveHaveVal = liveHoldings.some(h => Number(h?.current_value || 0) > 0 || Number(h?.ltp || 0) > 0);
  const holdings = liveHaveVal ? liveHoldings : (portfolio?.holdings || []);
  const watchlist = liveWatchlist.some(i => Number(i?.current_price || 0) > 0) ? liveWatchlist : (portfolio?.watchlist || []);

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

  const allocationData = useMemo(() => holdings.map(h => ({ name: h.company_name || h.name || h.ticker || "Unknown", ticker: h.ticker || h.symbol, value: h.current_value || 0 })), [holdings]);
  const topPositions = useMemo(() => {
    const total = summary.current_value || 1;
    return holdings.slice().sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).map(h => ({ ...h, weight: ((h.current_value || 0) / total) * 100 })).slice(0, 8);
  }, [holdings, summary.current_value]);

  const topHolding = topPositions[0];
  const isConcentrated = topHolding?.weight > 35;

  if (loading && !liveHoldings.length) return <PageLoadingState title="Loading terminal..." subtitle="Resolving live data." />;
  if (error && !liveHoldings.length) return <PageErrorState title="Command center unavailable" message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: 'var(--bg-base)' }}>
      
      {/* Ticker Bar */}
      <div style={{
        height: 34,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Left Anchor */}
        <div style={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRight: '1px solid var(--border-default)', height: '100%', flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-gain)' }} />
          <span className="badge-label" style={{ color: 'var(--status-gain)' }}>LIVE</span>
        </div>

        {/* Scrolling Ticker (Static in Figma/Code for now) */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', height: '100%', alignItems: 'center' }}>
          {tickerItems.map((item, i) => <TickerItem key={i} {...item} />)}
        </div>

        {/* Right Anchor */}
        <div style={{ width: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-default)', height: '100%', flexShrink: 0 }}>
          <span className="nav-section-label">MARKETS OPEN 09:15 – 15:30</span>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Concentration Banner */}
        {isConcentrated && !dismissed && (
          <div style={{
            height: 34, background: 'rgba(210,167,109,0.08)',
            borderLeft: '2px solid var(--status-warning)', borderRadius: 2,
            display: 'flex', alignItems: 'center', padding: '0 12px 0 10px',
            marginBottom: -4
          }}>
            <Warning size={14} color="var(--status-warning)" weight="fill" style={{ marginRight: 8 }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)' }}>Concentration Notice:</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', margin: '0 4px' }}>{topHolding.ticker}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)' }}>represents</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--status-warning)', margin: '0 4px' }}>{topHolding.weight.toFixed(1)}%</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)' }}>of your portfolio.</span>
            
            <button onClick={() => setDismissed(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X size={14} color="var(--text-muted)" />
            </button>
          </div>
        )}

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="PORTFOLIO VALUE" value={fmt(summary.current_value)} sub="Lakh" leftBorderColor="var(--accent-gold)" sparklineColor="var(--text-primary)" />
          <StatCard label="TOTAL INVESTED" value={fmt(summary.total_invested)} sub="Lakh" leftBorderColor="var(--border-strong)" sparklineColor="var(--text-secondary)" />
          <StatCard label="TOTAL P&L" value={fmt(summary.total_pnl)} sub={`Lakh (${pct(summary.total_pnl_pct)})`} leftBorderColor={(summary.total_pnl || 0) >= 0 ? 'var(--status-gain)' : 'var(--status-loss)'} sparklineColor={(summary.total_pnl || 0) >= 0 ? 'var(--status-gain)' : 'var(--status-loss)'} />
          <StatCard label="TODAY'S CHANGE" value={pct(summary.day_change_pct)} sub={`${fmt(summary.day_change)} today`} leftBorderColor="var(--accent-blue)" sparklineColor="var(--accent-blue)" />
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 316px', gap: 16, alignItems: 'start' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            
            {/* AI Brief */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 3, padding: 20 }}>
              <SectionHeader title="AI BRIEF" icon={ArrowsClockwise} />
              
              <div className="ai-body-text">
                Your portfolio showed resilient growth this week, with tech holdings leading gains at +3.2%. Consider rebalancing — your concentration in financials has drifted above your 35% target threshold. Market sentiment remains cautiously optimistic heading into earnings season.
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
              
              <div className="insight-label" style={{ marginBottom: 8 }}>7-DAY PERFORMANCE</div>
              <div style={{ height: 56, position: 'relative' }}>
                {/* Horizontal guides */}
                <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: 1, background: 'var(--border-subtle)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border-subtle)' }} />
                <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: 1, background: 'var(--border-subtle)' }} />
                
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData.length ? sparkData : [{value:1},{value:2},{value:3}]}>
                    <Line type="monotone" dataKey="value" stroke="var(--accent-gold)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 10px' }}>
                  <div className="insight-label">BEST DAY</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--status-gain)' }}>+₹8.2K</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-muted)' }}>June 12</div>
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 10px' }}>
                  <div className="insight-label">WORST DAY</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--status-loss)' }}>-₹5.1K</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-muted)' }}>June 10</div>
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 10px' }}>
                  <div className="insight-label">AVG DAILY</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>+₹1.8K</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-muted)' }}>7 days</div>
                </div>
              </div>
            </div>

            <DonutCard allocationData={allocationData} portfolioValue={summary.current_value} />
            <InsightsCard topPositions={topPositions} holdings={holdings} />
            
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PositionWeightsCard topPositions={topPositions} />
            
            {/* Activity Feed Hardcoded Mockup from Spec */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 3, padding: 20 }}>
              <SectionHeader title="ACTIVITY FEED" icon={Clock} />
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  { type: 'BUY', tick: 'INFY', meta: '50 shares @ ₹1,425', time: 'June 15, 2026 · 10:32 AM' },
                  { type: 'SELL', tick: 'ITC', meta: '100 shares @ ₹412', time: 'June 14, 2026 · 2:15 PM' },
                  { type: 'BUY', tick: 'HDFC', meta: '25 shares @ ₹1,650', time: 'June 12, 2026 · 11:45 AM' },
                  { type: 'BUY', tick: 'TCS', meta: '15 shares @ ₹3,820', time: 'June 10, 2026 · 9:20 AM' },
                ].map((act, i) => (
                  <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{
                        background: act.type === 'BUY' ? 'var(--fill-gain)' : 'var(--fill-loss)',
                        border: `1px solid ${act.type === 'BUY' ? 'var(--border-gain)' : 'var(--border-loss)'}`,
                        borderRadius: 2, padding: '2px 6px', height: 'fit-content',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        {act.type === 'BUY' ? <ArrowUp size={10} color="var(--status-gain)" /> : <ArrowDown size={10} color="var(--status-loss)" />}
                        <span className="badge-label" style={{ color: act.type === 'BUY' ? 'var(--status-gain)' : 'var(--status-loss)' }}>{act.type}</span>
                      </div>
                      <div>
                        <div className="activity-ticker">{act.tick}</div>
                        <div className="activity-meta" style={{ marginTop: 2 }}>{act.meta}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-muted)' }}>{act.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Watchlist Mockup from Spec */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 3, padding: 20 }}>
              <SectionHeader title="WATCHLIST" />
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { t: 'BAJFINANCE', n: 'Bajaj Finance', p: '₹7,245.50', c: '+2.34%' },
                  { t: 'ASIANPAINT', n: 'Asian Paints', p: '₹2,892.20', c: '-0.87%' },
                  { t: 'HDFCLIFE', n: 'HDFC Life', p: '₹645.80', c: '+1.12%' },
                  { t: 'BHARTIARTL', n: 'Bharti Airtel', p: '₹1,156.30', c: '+0.65%' },
                ].map((w, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Star size={14} color="var(--accent-gold)" />
                      <div>
                        <div className="watchlist-ticker">{w.t}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>{w.n}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>{w.p}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: w.c.startsWith('+') ? 'var(--status-gain)' : 'var(--status-loss)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                        {w.c.startsWith('+') ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                        {w.c}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}