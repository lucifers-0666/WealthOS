import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const DUMMY_SIGNALS = [
  { id: 1, type: 'MACD CROSSOVER', time: '2 hrs ago', stock: 'HDFCBANK', action: 'BUY', confidence: 85 },
  { id: 2, type: 'RSI OVERSOLD', time: '4 hrs ago', stock: 'INFY', action: 'BUY', confidence: 72 },
  { id: 3, type: 'VOLUME BREAKOUT', time: '1 day ago', stock: 'RELIANCE', action: 'BUY', confidence: 91 },
  { id: 4, type: 'MOVING AVERAGE CROSSED', time: '1 day ago', stock: 'TCS', action: 'SELL', confidence: 64 },
  { id: 5, type: 'EARNINGS SURPRISE', time: '2 days ago', stock: 'ICICIBANK', action: 'BUY', confidence: 88 },
  { id: 6, type: 'BEARISH ENGULFING', time: '3 days ago', stock: 'ITC', action: 'SELL', confidence: 76 },
];

export default function Signals() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  let filtered = DUMMY_SIGNALS;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => s.stock.toLowerCase().includes(q) || s.type.toLowerCase().includes(q));
  }

  const kpis = [
    { label: 'ACTIVE SIGNALS', value: '14', border: 'var(--color-gold)' },
    { label: 'SUCCESS RATE', value: '68.5%', border: 'rgba(134,159,196,0.9)' },
    { label: 'AVG RETURN', value: '+4.2%', border: 'var(--color-gain)', valColor: 'var(--color-gain)' },
  ];

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-[var(--color-text)] tracking-wide">Algorithmic Signals</h1>
          <div className="font-inter text-[11px] text-[var(--color-text-faint)] mt-1">Automated technical & quantitative alerts</div>
        </div>
        <button className="border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[var(--color-text)] transition-colors">
          Configure
        </button>
      </div>

      {/* 2. SIGNAL CARDS ROW */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        {kpis.map((k, i) => (
          <div key={k.label} className="bg-[var(--color-card)] border border-[var(--color-border)] border-l-[2px] rounded-[3px] p-4 animate-[fadeSlideUp_0.4s_ease-out_both]" style={{ borderLeftColor: k.border, animationDelay: `${i*100}ms` }}>
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] mb-2">{k.label}</div>
            <div className="font-mono text-[24px] font-bold" style={{ color: k.valColor || 'var(--color-text)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* 3. FILTER BAR */}
      <div className="flex gap-3 mb-6 shrink-0 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none"
        >
          <option>All Types</option>
          <option>Technical</option>
          <option>Fundamental</option>
        </select>
        <select className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none">
          <option>Status: Active</option>
          <option>Status: Resolved</option>
        </select>
        <input 
          type="text" 
          placeholder="Search signals..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[rgba(45,60,55,0.9)] w-[200px]"
        />
      </div>

      {/* 4. SIGNALS FEED */}
      <div className="flex-1 overflow-y-auto pr-2 pb-6 min-h-0">
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((sig, i) => (
            <div key={sig.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-5 flex flex-col gap-4 animate-[fadeSlideUp_0.4s_ease-out_both] group hover:bg-[rgba(255,255,255,0.02)] transition-colors" style={{ animationDelay: `${300 + i*50}ms` }}>
              <div className="flex justify-between items-start">
                <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[var(--color-gold)] border border-[var(--color-gold)] bg-[rgba(200,179,142,0.1)] px-2 py-0.5 rounded-[2px]">{sig.type}</div>
                <div className="font-inter text-[10px] text-[var(--color-text-faint)]">{sig.time}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="font-cinzel text-[18px] font-bold text-[var(--color-text)]">{sig.stock}</div>
                <div className={`font-inter text-[14px] font-bold flex items-center gap-1 ${sig.action === 'BUY' ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                  {sig.action === 'BUY' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {sig.action}
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-[rgba(45,60,55,0.55)] pt-3 mt-1">
                <div className="flex flex-col gap-1.5 flex-1 pr-6">
                  <div className="font-inter text-[10px] text-[var(--color-text-muted)]">Confidence: {sig.confidence}%</div>
                  <div className="h-[4px] bg-[rgba(45,60,55,0.5)] rounded-full overflow-hidden w-full">
                    <div className={`h-full rounded-full ${sig.confidence > 80 ? 'bg-[var(--color-gain)]' : sig.confidence > 60 ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-loss)]'}`} style={{ width: `${sig.confidence}%` }}></div>
                  </div>
                </div>
                <button className="font-inter text-[10px] uppercase tracking-wide text-[var(--color-blue)] hover:text-[var(--color-text)] transition-colors">
                  View Chart →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
