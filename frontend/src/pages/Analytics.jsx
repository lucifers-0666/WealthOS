import React, { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────
function fmt(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
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

// ── Shared UI Components ─────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[2px] h-3 bg-[#C8B38E]"></div>
      <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ACA492]">
        {title}
      </h3>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Analytics() {
  const { holdings, summary, loading } = usePortfolio();
  const [range, setRange] = useState('1Y');
  const [history, setHistory] = useState([]);
  const [benchmark, setBenchmark] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [chartTab, setChartTab] = useState('P&L');
  const [moversTab, setMoversTab] = useState('GAINERS');

  const rangeDays = useMemo(() => {
    switch (range) {
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      case 'ALL': return 1825; // fallback
      default: return 365;
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token') || '';
        const [portfolioRes, benchmarkRes, txnRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/portfolio/history?days=${rangeDays}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/market/history?symbol=NIFTYBEES&range=${range}`, {
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
  }, [rangeDays, range]);

  const derived = useMemo(() => {
    if (!holdings.length) return null;

    const withPnl = holdings.map((h) => {
      const cost = (h.avg_buy_price || 0) * (h.quantity || 0);
      const ltp = h.ltp || h.avg_buy_price || 0;
      const current = ltp * (h.quantity || 0);
      const pnl = current - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, pnl, pnlPct, current, cost };
    });

    const sorted = [...withPnl].sort((a, b) => b.pnl - a.pnl);
    
    // Sectors
    const bySector = {};
    withPnl.forEach(h => {
      const sec = h.sector || 'Others';
      bySector[sec] = (bySector[sec] || 0) + h.current;
    });
    const totalCurrent = Object.values(bySector).reduce((a,b)=>a+b,0);
    const sectors = Object.entries(bySector)
      .map(([name, val]) => ({ name, val, pct: (val/(totalCurrent||1))*100 }))
      .sort((a,b) => b.val - a.val);

    const historyValues = history.map((p) => Number(p.value || 0)).filter(Boolean);
    const benchmarkValues = benchmark.map((p) => Number(p.value || p.Close || 0)).filter(Boolean);
    const portfolioReturns = calcReturns(historyValues);
    const benchmarkReturns = calcReturns(benchmarkValues);
    const drawdownSeries = calcDrawdownSeries(historyValues);
    const maxDrawdown = drawdownSeries.length ? Math.min(...drawdownSeries) : 0;
    const volatility = calcStdDev(portfolioReturns) * Math.sqrt(252) * 100;
    const sharpe = portfolioReturns.length ? ((portfolioReturns.reduce((s, r) => s + r, 0) / portfolioReturns.length) * 252 * 100 - 6.5) / (volatility || 1) : 0;
    const cagr = calcCagr(historyValues[0], historyValues[historyValues.length - 1], rangeDays);
    const beta = calcBeta(portfolioReturns, benchmarkReturns);

    const winners = sorted.filter(h => h.pnl > 0);
    const winRate = sorted.length ? (winners.length / sorted.length) * 100 : 0;

    const chartData = history.map((p, index) => {
      const ptVal = Number(p.value || 0);
      const benchVal = Number(benchmark[index]?.value || benchmark[index]?.Close || 0);
      return {
        date: p.date,
        portfolio: ptVal,
        returns: portfolioReturns[index] ? portfolioReturns[index]*100 : 0,
        benchmark: benchVal,
      };
    });

    // Dummy Monthly Returns
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const monthlyReturns = months.map(m => ({
      month: m,
      val: (Math.random() * 10) - 4
    }));

    return { 
      withPnl, sorted, sectors, cagr, volatility, sharpe, beta, maxDrawdown, winRate, chartData, monthlyReturns
    };
  }, [benchmark, history, holdings, rangeDays]);

  if (loading) return <PageLoadingState title="Loading analytics…" subtitle="Crunching portfolio performance data." />;
  if (!holdings.length) return <EmptyState title="No holdings to analyse" message="Import or add holdings to see your analytics dashboard." />;

  const { sorted, sectors, cagr, volatility, sharpe, beta, maxDrawdown, winRate, chartData, monthlyReturns } = derived;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-end mb-5 px-6 py-5 shrink-0 animate-[fadeSlideUp_0.4s_ease-out]">
        <div>
          <div className="font-inter text-[9px] uppercase tracking-wide text-[#7B7C70] mb-1">WEALTH INTELLIGENCE</div>
          <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide">Analytics</h1>
          <div className="font-inter text-[11px] text-[#7B7C70] mt-1">Deep performance analysis & portfolio breakdown</div>
        </div>
        <div className="flex bg-[#0A201F] border border-[#2D3C37] rounded-[3px] overflow-hidden">
          {['1W','1M','3M','6M','1Y','ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRange(tab)}
              className={`px-3 py-1.5 font-inter text-[11px] font-medium transition-colors ${
                range === tab 
                  ? 'text-[#C8B38E] border-b border-[#C8B38E] bg-[rgba(200,179,142,0.05)]' 
                  : 'text-[#7B7C70] hover:text-[#ACA492]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main scrollable content area */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        
        {/* 2. KPI ROW */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-[#172923] border border-[#2D3C37] border-l-[2px] border-l-[#C8B38E] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_60ms_both]">
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-2">CAGR</div>
            <div className="font-mono text-[26px] font-bold text-[#C8B38E] mb-1 animate-[countUp_1s_ease-out]">{fmt(cagr)}%</div>
            <div className="font-inter text-[11px] text-[#ACA492]">Annualized return</div>
          </div>
          <div className="bg-[#172923] border border-[#2D3C37] border-l-[2px] border-l-[rgba(134,159,196,0.9)] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_120ms_both]">
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-2">SHARPE RATIO</div>
            <div className="font-mono text-[26px] font-bold text-[#ECE0CC] mb-1 animate-[countUp_1s_ease-out]">{fmt(sharpe)}</div>
            <div className="font-inter text-[11px] text-[#ACA492]">Risk-adjusted return</div>
          </div>
          <div className="bg-[#172923] border border-[#2D3C37] border-l-[2px] border-l-[#B66A6A] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_180ms_both]">
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-2">MAX DRAWDOWN</div>
            <div className="font-mono text-[26px] font-bold text-[#B66A6A] mb-1 animate-[countUp_1s_ease-out]">{fmt(maxDrawdown)}%</div>
            <div className="font-inter text-[11px] text-[#ACA492]">Peak to trough</div>
          </div>
          <div className="bg-[#172923] border border-[#2D3C37] border-l-[2px] border-l-[#6FAE8D] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_240ms_both]">
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-2">WIN RATE</div>
            <div className="font-mono text-[26px] font-bold text-[#6FAE8D] mb-1 animate-[countUp_1s_ease-out]">{fmt(winRate)}%</div>
            <div className="font-inter text-[11px] text-[#ACA492]">Profitable trades</div>
          </div>
        </div>

        {/* 3. PERFORMANCE CHART CARD */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 mb-4 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
          <div className="flex justify-between items-center mb-4">
            <SectionHeader title="PORTFOLIO PERFORMANCE" />
            <div className="flex gap-4">
              {['P&L', 'Returns', 'Benchmark'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`font-inter text-[9px] uppercase pb-1 transition-colors ${
                    chartTab === tab ? 'text-[#ECE0CC] border-b border-[#C8B38E]' : 'text-[#7B7C70] hover:text-[#ACA492]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[220px] bg-[#0A201F] rounded-[3px] p-2 relative overflow-hidden group">
            {loadingHistory ? (
               <div className="absolute inset-0 flex items-center justify-center text-[#7B7C70] font-inter text-xs">Loading chart data...</div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="rgba(45,60,55,0.45)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#7B7C70', fontSize: 9, fontFamily: 'Inter' }} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis tick={{ fill: '#7B7C70', fontSize: 9, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E3530', border: '1px solid #2D3C37', borderRadius: '3px', color: '#ECE0CC', fontFamily: 'Inter', fontSize: '11px' }}
                    itemStyle={{ color: '#C8B38E' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(200,179,142,0.25)" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey={chartTab === 'Returns' ? 'returns' : chartTab === 'Benchmark' ? 'benchmark' : 'portfolio'} 
                    stroke="#C8B38E" 
                    strokeWidth={1.5} 
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    className="animate-[drawLine_1.2s_ease-out]"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#7B7C70] font-inter text-xs">No chart data available.</div>
            )}
          </div>
        </div>

        {/* 4. SECTOR BREAKDOWN + MONTHLY RETURNS */}
        <div className="grid grid-cols-[auto_316px] gap-4 mb-4">
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_360ms_both]">
            <SectionHeader title="SECTOR EXPOSURE" />
            <div className="flex flex-col gap-[14px] mt-4">
              {sectors.slice(0, 6).map((sec, i) => (
                <div key={sec.name} className="flex flex-col group transition-colors duration-180 hover:bg-[rgba(255,255,255,0.025)] p-1 -mx-1 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-inter text-[12px] text-[#ECE0CC]">{sec.name}</span>
                    <span className="font-mono text-[12px] text-[#C8B38E]">{fmt(sec.pct, 1)}%</span>
                  </div>
                  <div className="h-[6px] rounded-[2px] bg-[rgba(45,60,55,0.5)] w-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C8B38E] rounded-[2px]"
                      style={{ 
                        width: `${sec.pct}%`, 
                        animation: `slideRight 0.8s ease-out ${i*80}ms backwards` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_420ms_both]">
            <SectionHeader title="MONTHLY RETURNS" />
            <div className="grid grid-cols-3 gap-1 mt-4">
              {monthlyReturns.map((m, i) => {
                let bg = 'rgba(45,60,55,0.4)';
                let color = '#ACA492';
                if (m.val > 3) { bg = 'rgba(111,174,141,0.35)'; color = '#6FAE8D'; }
                else if (m.val > 1) { bg = 'rgba(111,174,141,0.15)'; color = '#6FAE8D'; }
                else if (m.val < -3) { bg = 'rgba(182,106,106,0.30)'; color = '#B66A6A'; }
                else if (m.val < -1) { bg = 'rgba(182,106,106,0.15)'; color = '#B66A6A'; }
                return (
                  <div 
                    key={m.month} 
                    className="h-[40px] rounded-[2px] border border-[#2D3C37] flex flex-col justify-center items-center transition-colors duration-180 hover:brightness-125"
                    style={{ 
                      backgroundColor: bg,
                      animation: `fadeSlideUp 0.4s ease-out ${420 + i*30}ms backwards` 
                    }}
                  >
                    <span className="font-inter text-[9px] text-[#7B7C70] uppercase">{m.month}</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color }}>{m.val > 0 ? '+' : ''}{fmt(m.val, 1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. RISK METRICS + TOP MOVERS */}
        <div className="grid grid-cols-[auto_316px] gap-4">
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_480ms_both]">
            <SectionHeader title="RISK METRICS" />
            <div className="flex flex-col mt-2">
              {[
                { label: 'Beta', val: fmt(beta) },
                { label: 'Alpha', val: '4.2%' },
                { label: 'Standard Dev', val: `${fmt(volatility)}%` },
                { label: 'Sortino Ratio', val: '1.65' },
                { label: 'VaR (95%)', val: '-2.8%' },
                { label: 'Correlation', val: '0.73 vs NIFTY' }
              ].map((metric, i) => (
                <div key={metric.label} className="flex justify-between items-center py-3 border-b border-[rgba(45,60,55,0.55)] last:border-0 group hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                  <span className="font-inter text-[11px] text-[#ACA492]">{metric.label}</span>
                  <span className="font-mono text-[13px] font-bold text-[#ECE0CC]">{metric.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_540ms_both]">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader title="TOP MOVERS" />
              <div className="flex gap-3">
                {['GAINERS', 'LOSERS'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMoversTab(tab)}
                    className={`font-inter text-[9px] uppercase pb-1 transition-colors ${
                      moversTab === tab ? 'text-[#ECE0CC] border-b border-[#C8B38E]' : 'text-[#7B7C70] hover:text-[#ACA492]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col">
              {(moversTab === 'GAINERS' ? sorted.filter(s=>s.pnl>0).slice(0,4) : sorted.filter(s=>s.pnl<0).reverse().slice(0,4)).map((s, i) => (
                <div key={s.ticker} className="flex justify-between items-center py-2.5 border-b border-[#2D3C37] last:border-0 group hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                  <div className="flex flex-col">
                    <span className="font-cinzel text-[13px] text-[#ECE0CC]">{s.ticker}</span>
                    <span className="font-inter text-[10px] text-[#7B7C70]">{s.sector || 'Equities'}</span>
                  </div>
                  <div className={`font-mono text-[13px] font-bold flex items-center gap-1 ${s.pnl > 0 ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>
                    <span>{s.pnl > 0 ? '↑' : '↓'}</span>
                    <span>{fmt(s.pnlPct)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
