import React, { useMemo, Suspense, useEffect, useState } from "react";
import { usePortfolio } from "../lib/usePortfolio.js";
import { useMarketData } from "../lib/MarketDataContext.jsx";
import { getISTMarketStatus } from "../lib/marketTime.js";
import { PageLoadingState, PageErrorState, EmptyState } from "../components/PageStates.jsx";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { request } from "../services/api.js";
import { DonutCard, InsightsCard, PositionWeightsCard } from "../components/DashboardCharts.jsx";
import { PortfolioIntelligence } from "../components/PortfolioIntelligence.jsx";
import { ArrowsClockwise, Warning, X, ArrowUp, ArrowDown, Star, Clock } from "@phosphor-icons/react";

function fmt(n) {
  if (n == null || isNaN(n)) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function pct(n) {
  if (n == null || isNaN(n)) return "-";
  return (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%";
}

function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 2, height: 10, background: 'var(--accent-gold)', borderRadius: 1 }} />
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function StatCard({ label, value, sub, toneClass, sparklineClass }) {
  return (
    <div className={`kpi-card ${toneClass}`} style={{ minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 700, margin: '2px 0 4px', color: 'var(--text-primary)' }} className={toneClass ? toneClass.replace('kpi-card--', 'kpi-value--') : ''}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)' }}>{sub}</div>
      {sparklineClass && (
        <div style={{ position: 'absolute', right: 20, bottom: 18, width: 48, height: 28, opacity: 0.8 }}>
          <svg width="48" height="28" viewBox="0 0 48 28" preserveAspectRatio="none">
            <path className={sparklineClass} d="M0 20 Q 12 28, 24 15 T 48 5" fill="none" strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { portfolio, transactions, loading, error } = usePortfolio();
  const { holdings: liveHoldings, watchlist: liveWatchlist } = useMarketData();
  const [marketStatus, setMarketStatus] = useState(getISTMarketStatus);

  useEffect(() => {
    const id = setInterval(() => setMarketStatus(getISTMarketStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isMarketOpen = marketStatus.status === 'open' || marketStatus.status === 'preopen';

  const [sparkData, setSparkData] = useState([]);
  
  // Dynamic Index marquee state
  const [indices, setIndices] = useState(null);

  const SKELETON_INDICES = [
    { label: "NIFTY 50", price: 22419.95, change_pct: 0.42 },
    { label: "SENSEX", price: 73806.15, change_pct: 0.45 },
    { label: "BANK NIFTY", price: 48116.50, change_pct: -0.23 },
    { label: "MIDCAP 150", price: 18240.20, change_pct: 0.54 },
    { label: "INDIA VIX", price: 12.87, change_pct: 1.98 },
    { label: "USD/INR", price: 83.47, change_pct: -0.06 },
  ];

  useEffect(() => {
    async function fetchIndices() {
      try {
        const data = await request('GET', '/api/market/indices');
        if (Array.isArray(data) && data.length > 0) {
          setIndices(data);
        }
      } catch (err) {
        console.error("Indices marquee reload failed", err);
      }
    }
    
    fetchIndices();
    const intervalId = setInterval(fetchIndices, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const tickerItems = indices || SKELETON_INDICES;
  const isSkeleton = !indices;

  const [dismissed, setDismissed] = useState(false);
  const [activityFilter, setActivityFilter] = useState('ALL');

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Concentration Banner */}
      {isConcentrated && !dismissed && (
        <div className="concentration-banner">
          <Warning weight="fill" className="concentration-banner__icon" />
          <div className="concentration-banner__text">
            Concentration Notice: <strong>{topHolding.ticker}</strong> represents <em style={{ color: 'var(--status-warning)', fontWeight: 600 }}>{topHolding.weight.toFixed(1)}%</em> of your portfolio.
          </div>
          <button onClick={() => setDismissed(true)} className="concentration-banner__dismiss" style={{ background: 'none', border: 'none' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Row — 4 equal cards, 12px gap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard 
          label="PORTFOLIO VALUE" 
          value={fmt(summary.current_value)} 
          sub="Lakh" 
          toneClass="kpi-card--portfolio" 
          sparklineClass="sparkline-neutral" 
        />
        <StatCard 
          label="TOTAL INVESTED" 
          value={fmt(summary.total_invested)} 
          sub="Lakh" 
          toneClass="kpi-card--invested" 
          sparklineClass="sparkline-neutral" 
        />
        <StatCard 
          label="TOTAL P&L" 
          value={fmt(summary.total_pnl)} 
          sub={`Lakh (${pct(summary.total_pnl_pct)})`} 
          toneClass={(summary.total_pnl || 0) >= 0 ? 'kpi-card--pnl positive' : 'kpi-card--pnl negative'} 
          sparklineClass={(summary.total_pnl || 0) >= 0 ? 'sparkline-positive' : 'sparkline-negative'} 
        />
        <StatCard 
          label="TODAY'S CHANGE" 
          value={pct(summary.day_change_pct)} 
          sub={`${fmt(summary.day_change)} today`} 
          toneClass="kpi-card--change" 
          sparklineClass={(summary.day_change_pct || 0) >= 0 ? 'sparkline-positive' : 'sparkline-negative'} 
        />
      </div>

      {/* Main Grid: left column + right column (316px fixed) · gap 16px */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 316px', gap: 16, alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          
          {/* AI Brief Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 3, padding: 20 }}>
            <SectionHeader 
              title="AI BRIEF" 
              right={
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
                  <ArrowsClockwise size={14} className="text-[var(--color-text-faint)]" style={{ color: 'var(--text-muted)' }} />
                </button>
              } 
            />
            
            <div className="ai-body-text" style={{ fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.72 }}>
              Your portfolio showed resilient growth this week, with tech holdings leading gains at +3.2%. Consider rebalancing — your concentration in financials has drifted above your 35% target threshold. Market sentiment remains cautiously optimistic heading into earnings season.
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
            
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>7-DAY PERFORMANCE</div>
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

            {/* Mini stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 10px' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>BEST DAY</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: 'var(--status-gain)' }}>+₹8.2K</div>
                <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>June 12</div>
              </div>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 10px' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>WORST DAY</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: 'var(--status-loss)' }}>-₹5.1K</div>
                <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>June 10</div>
              </div>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 2, padding: '8px 10px' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>AVG DAILY</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>+₹1.8K</div>
                <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>7 days</div>
              </div>
            </div>
          </div>

          <DonutCard allocationData={allocationData} portfolioValue={summary.current_value} />
          <InsightsCard holdings={holdings} />
          
        </div>

        {/* Right Column (316px fixed width) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PositionWeightsCard topPositions={topPositions} />
          
          {/* Activity Feed Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 3, padding: 20 }}>
            <SectionHeader 
              title="ACTIVITY FEED" 
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              } 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { type: 'BUY',  tick: 'INFY', meta: '50 shares @ ₹1,425',  time: 'June 15, 2026 · 10:32 AM' },
                { type: 'SELL', tick: 'ITC',  meta: '100 shares @ ₹412',    time: 'June 14, 2026 · 2:15 PM' },
                { type: 'BUY',  tick: 'HDFC', meta: '25 shares @ ₹1,650',   time: 'June 12, 2026 · 11:45 AM' },
                { type: 'BUY',  tick: 'TCS',  meta: '15 shares @ ₹3,820',   time: 'June 10, 2026 · 9:20 AM' },
              ].map((act, i) => (
                <div key={i} style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  {/* Left: pill + ticker + meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* BUY or SELL badge/label */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 7px',
                        background: act.type === 'BUY' ? 'var(--fill-gain)' : 'var(--fill-loss)',
                        border: act.type === 'BUY' ? '1px solid var(--border-gain)' : '1px solid var(--border-loss)',
                        borderRadius: 2,
                        fontFamily: 'Inter',
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: act.type === 'BUY' ? 'var(--status-gain)' : 'var(--status-loss)'
                      }}>
                        {act.type === 'BUY' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        {act.type}
                      </span>
                      <span style={{ fontFamily: 'Cinzel', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{act.tick}</span>
                    </div>
                    <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'var(--text-muted)' }}>{act.meta}</span>
                  </div>
                  {/* Right: timestamp */}
                  <span style={{ fontFamily: 'Inter', fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'right', marginTop: 4 }}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 3, padding: 20 }}>
            <SectionHeader title="WATCHLIST" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { t: 'BAJFINANCE',  n: 'Bajaj Finance',  p: '₹7,245.50', c: '+2.34%' },
                { t: 'ASIANPAINT', n: 'Asian Paints',    p: '₹2,892.20', c: '-0.87%' },
                { t: 'HDFCLIFE',   n: 'HDFC Life',       p: '₹645.80',   c: '+1.12%' },
                { t: 'BHARTIARTL', n: 'Bharti Airtel',   p: '₹1,156.30', c: '+0.65%' },
              ].map((w, i, arr) => {
                const isGain = w.c.startsWith('+');
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 32,
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    {/* Left: Star Outline + Symbol + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <Star size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                        <span style={{ fontFamily: 'Cinzel', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{w.t}</span>
                        <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.n}</span>
                      </div>
                    </div>
                    {/* Right: Price + Change */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-primary)' }}>{w.p}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: isGain ? 'var(--status-gain)' : 'var(--status-loss)' }}>
                        {isGain ? '↑' : '↓'} {w.c}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ positive, width = 48, height = 16 }) {
  const d = positive
    ? `M0,${height} L${width*0.3},${height*0.5} L${width*0.6},${height*0.7} L${width},0`
    : `M0,0 L${width*0.3},${height*0.5} L${width*0.6},${height*0.3} L${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', flexShrink: 0, marginLeft: 12 }}>
      <path d={d} fill="none" stroke={positive ? 'var(--status-gain)' : 'var(--status-loss)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}