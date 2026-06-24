import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function fmt(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

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

// Dummy data for All Stocks table
const DUMMY_STOCKS = [
  { stock: 'HDFC BANK', symbol: 'HDFCBANK', sector: 'Financials', price: 1532.45, change: 1.2, vol: '12.4M', high: 1757.50, low: 1363.55 },
  { stock: 'RELIANCE', symbol: 'RELIANCE', sector: 'Energy', price: 2984.10, change: -0.4, vol: '8.1M', high: 3024.90, low: 2220.30 },
  { stock: 'INFOSYS', symbol: 'INFY', sector: 'Technology', price: 1428.90, change: 2.1, vol: '6.2M', high: 1733.00, low: 1358.35 },
  { stock: 'TCS', symbol: 'TCS', sector: 'Technology', price: 3982.15, change: 0.8, vol: '2.4M', high: 4254.75, low: 3070.25 },
  { stock: 'ICICI BANK', symbol: 'ICICIBANK', sector: 'Financials', price: 1124.60, change: -1.1, vol: '15.8M', high: 1163.25, low: 898.85 },
];

export default function MarketWatch() {
  const [indices, setIndices] = useState([
    { name: "NIFTY 50", symbol: "^NSEI", value: 22419.95, change: 0.42, color: '#C8B38E' },
    { name: "SENSEX", symbol: "^BSESN", value: 73806.15, change: 0.45, color: '#869FC4' },
    { name: "MIDCAP 150", symbol: "NIFTY_MID_150.NS", value: 11847.30, change: 0.54, color: '#6FAE8D' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moversTab, setMoversTab] = useState('GAINERS');

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const symbolsStr = indices.map(i => i.symbol).join(',');
        const res = await fetch(`${API}/prices?tickers=${symbolsStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIndices(prev => prev.map(idx => {
            const quote = data[idx.symbol];
            if (quote) {
              return {
                ...idx,
                value: quote.price_inr || quote.price || idx.value,
                change: quote.pct_change || idx.change
              };
            }
            return idx;
          }));
        }
      } catch (err) {}
    };
    fetchIndices();
  }, []);

  const filteredStocks = DUMMY_STOCKS.filter(s => s.stock.toLowerCase().includes(searchQuery.toLowerCase()) || s.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  const heatMapSectors = [
    { name: 'FIN', val: 1.2 }, { name: 'IT', val: -0.8 }, { name: 'FMCG', val: 0.4 },
    { name: 'AUTO', val: 2.1 }, { name: 'PHARMA', val: -1.5 }, { name: 'METAL', val: 3.4 },
    { name: 'ENERGY', val: 0.1 }, { name: 'INFRA', val: -0.2 }, { name: 'REALTY', val: 1.8 }
  ];

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC]">Market Watch</h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[rgba(111,174,141,0.12)] border border-[rgba(111,174,141,0.28)]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#6FAE8D] animate-[pulse-dot_2s_infinite]"></div>
            <span className="font-inter text-[9px] uppercase font-bold text-[#6FAE8D]">LIVE</span>
          </div>
        </div>
        <div className="flex gap-2">
          {indices.map(idx => {
            const isUp = idx.change >= 0;
            return (
              <div key={idx.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-[3px] border bg-[#0A201F] ${isUp ? 'border-[rgba(111,174,141,0.28)]' : 'border-[rgba(182,106,106,0.28)]'}`}>
                <span className="font-cinzel text-[10px] text-[#ACA492]">{idx.name}</span>
                <span className="font-mono text-[11px] text-[#ECE0CC]">{fmt(idx.value)}</span>
                <span className={`font-mono text-[10px] ${isUp ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>{isUp ? '+' : ''}{fmt(idx.change)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. INDEX CARDS ROW */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {indices.map((idx, i) => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.name} className="bg-[#172923] border border-[#2D3C37] border-l-[2px] rounded-[3px] p-4 flex justify-between items-center animate-[fadeSlideUp_0.4s_ease-out_both]" style={{ borderLeftColor: idx.color, animationDelay: `${i*100}ms` }}>
              <div className="flex flex-col gap-1">
                <div className="font-cinzel text-[12px] font-bold text-[#ACA492] uppercase tracking-wide">{idx.name}</div>
                <div className="font-mono text-[22px] font-bold text-[#ECE0CC]">{fmt(idx.value)}</div>
                <div className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] w-max border ${isUp ? 'bg-[rgba(111,174,141,0.12)] border-[rgba(111,174,141,0.28)] text-[#6FAE8D]' : 'bg-[rgba(182,106,106,0.12)] border-[rgba(182,106,106,0.28)] text-[#B66A6A]'}`}>
                  {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {isUp ? '+' : ''}{fmt(idx.change)}%
                </div>
              </div>
              <div className="w-[80px] h-[32px]">
                <svg width="80" height="32" viewBox="0 0 80 32">
                  <path d="M0,24 Q10,20 20,26 T40,16 T60,22 T80,8" fill="none" stroke={isUp ? '#6FAE8D' : '#B66A6A'} strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_316px] gap-4 min-h-0 flex-1">
        {/* 3. MARKET TABLE */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 flex flex-col min-h-0 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
          <div className="flex justify-between items-center mb-4">
            <SectionHeader title="ALL STOCKS" />
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(45,60,55,0.9)] w-[180px]"
              />
              <select className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none">
                <option>All Sectors</option>
              </select>
              <button className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC]">NSE/BSE</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full pr-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 pb-2 border-b border-[#2D3C37] font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] sticky top-0 bg-[#172923] z-10">
              <div>STOCK</div>
              <div>SECTOR</div>
              <div className="text-right">PRICE</div>
              <div className="text-right">CHANGE</div>
              <div className="text-right">CHANGE%</div>
              <div className="text-right">VOLUME</div>
              <div className="text-right">52W HIGH</div>
              <div className="text-right">52W LOW</div>
            </div>

            <div className="flex flex-col">
              {filteredStocks.map((s, i) => {
                const isUp = s.change >= 0;
                const changeVal = (s.price * s.change) / 100;
                return (
                  <div key={s.symbol} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-3 border-b border-[rgba(45,60,55,0.55)] items-center group hover:bg-[rgba(255,255,255,0.018)] transition-colors" style={{ animation: `fadeSlideUp 0.3s ease-out ${300 + i*20}ms backwards` }}>
                    <div className="flex flex-col">
                      <span className="font-cinzel text-[13px] text-[#ECE0CC]">{s.stock}</span>
                      <span className="font-inter text-[9px] text-[#7B7C70] uppercase">{s.symbol} · NSE</span>
                    </div>
                    <div className="font-inter text-[11px] text-[#ACA492]">{s.sector}</div>
                    <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{fmt(s.price)}</div>
                    <div className={`font-mono text-[12px] font-bold text-right ${isUp ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>
                      {isUp ? '+' : ''}{fmt(changeVal)}
                    </div>
                    <div className="text-right flex justify-end">
                      <div className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-[3px] border ${isUp ? 'bg-[rgba(111,174,141,0.12)] border-[rgba(111,174,141,0.28)] text-[#6FAE8D]' : 'bg-[rgba(182,106,106,0.12)] border-[rgba(182,106,106,0.28)] text-[#B66A6A]'}`}>
                        {isUp ? '+' : ''}{fmt(s.change)}%
                      </div>
                    </div>
                    <div className="font-mono text-[12px] text-[#ACA492] text-right">{s.vol}</div>
                    <div className={`font-mono text-[12px] text-right ${s.price > s.high * 0.95 ? 'text-[#6FAE8D]' : 'text-[#ACA492]'}`}>{fmt(s.high)}</div>
                    <div className={`font-mono text-[12px] text-right ${s.price < s.low * 1.05 ? 'text-[#B66A6A]' : 'text-[#ACA492]'}`}>{fmt(s.low)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. RIGHT PANEL */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_360ms_both]">
            <SectionHeader title="HEAT MAP" />
            <div className="grid grid-cols-3 gap-1 mt-4">
              {heatMapSectors.map((m, i) => {
                let bg = 'rgba(45,60,55,0.4)';
                let color = '#ACA492';
                if (m.val > 2) { bg = 'rgba(111,174,141,0.35)'; color = '#6FAE8D'; }
                else if (m.val > 0) { bg = 'rgba(111,174,141,0.15)'; color = '#6FAE8D'; }
                else if (m.val < -2) { bg = 'rgba(182,106,106,0.30)'; color = '#B66A6A'; }
                else if (m.val < 0) { bg = 'rgba(182,106,106,0.15)'; color = '#B66A6A'; }
                return (
                  <div key={m.name} className="h-[48px] rounded-[2px] border border-[#2D3C37] flex flex-col justify-center items-center transition-colors duration-400" style={{ backgroundColor: bg }}>
                    <span className="font-inter text-[9px] text-[#7B7C70] uppercase">{m.name}</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color }}>{m.val > 0 ? '+' : ''}{fmt(m.val, 1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_420ms_both] flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader title="TOP MOVERS" />
            </div>
            <div className="flex gap-4 mb-4 border-b border-[#2D3C37]">
              {['GAINERS', 'LOSERS'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setMoversTab(tab)}
                  className={`font-inter text-[10px] font-semibold uppercase pb-2 transition-colors -mb-[1px] ${
                    moversTab === tab ? 'text-[#ECE0CC] border-b-2 border-[#C8B38E]' : 'text-[#7B7C70] hover:text-[#ACA492]'
                  }`}
                >
                  TOP {tab}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col overflow-y-auto">
              {(moversTab === 'GAINERS' ? DUMMY_STOCKS.sort((a,b)=>b.change-a.change) : DUMMY_STOCKS.sort((a,b)=>a.change-b.change)).map(s => (
                <div key={s.symbol} className="flex justify-between items-center py-2.5 border-b border-[rgba(45,60,55,0.55)] last:border-0">
                  <span className="font-cinzel text-[13px] text-[#ECE0CC]">{s.stock}</span>
                  <div className={`font-mono text-[12px] font-bold ${s.change > 0 ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>
                    {s.change > 0 ? '+' : ''}{fmt(s.change)}%
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
