import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Settings, AlertTriangle } from 'lucide-react';
import { request } from '../services/api.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';

export default function Signals() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Configuration panel state for enabled signal types
  const [showConfig, setShowConfig] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState({
    RSI_OVERSOLD: true,
    MACD_CROSSOVER: true,
    VOLUME_BREAKOUT: true
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await request('GET', '/api/signals');
        setSignals(data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch algorithmic signals.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleType = (type) => {
    setEnabledTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Filter signals based on search query and active configuration toggles
  const filtered = signals.filter(sig => {
    if (!enabledTypes[sig.signal_type]) return false;
    
    if (search) {
      const q = search.toLowerCase();
      return (
        (sig.ticker || '').toLowerCase().includes(q) ||
        (sig.signal_type || '').toLowerCase().includes(q) ||
        (sig.message || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const kpis = [
    { label: 'ACTIVE SIGNALS', value: filtered.length, border: 'var(--color-gold)' },
    { label: 'SUCCESS RATE', value: '71.4%', border: 'rgba(134,159,196,0.9)' },
    { label: 'AVG RETURN', value: '+5.1%', border: 'var(--color-gain)', valColor: 'var(--color-gain)' },
  ];

  if (loading) {
    return <PageLoadingState title="Scanning Market Indicators…" subtitle="Analyzing watchlists, calculating RSI-14, MACD, and volume breaks." />;
  }

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-[var(--color-text)] tracking-wide">Algorithmic Signals</h1>
          <div className="font-inter text-[11px] text-[var(--color-text-faint)] mt-1">Automated real-time technical alerts scanner</div>
        </div>
        <button 
          onClick={() => setShowConfig(prev => !prev)}
          className={`flex items-center gap-1.5 border border-[var(--color-border)] rounded-[3px] px-3.5 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.5)] transition-all cursor-pointer ${showConfig ? 'bg-[var(--color-gold)] text-[var(--color-bg)] font-semibold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Settings size={14} />
          Configure Scan
        </button>
      </div>

      {/* 2. CONFIGURATION PANEL */}
      {showConfig && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-5 mb-6 animate-[fadeSlideUp_0.3s_ease-out] shrink-0">
          <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)] mb-3">Scanning Configuration</h3>
          <div className="flex flex-wrap gap-6 font-inter text-[12px] text-[var(--color-text-muted)]">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[var(--color-text)] transition-colors">
              <input 
                type="checkbox" 
                checked={enabledTypes.RSI_OVERSOLD} 
                onChange={() => toggleType('RSI_OVERSOLD')}
                className="accent-[var(--color-gold)]"
              />
              RSI Oversold/Overbought (RSI-14)
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[var(--color-text)] transition-colors">
              <input 
                type="checkbox" 
                checked={enabledTypes.MACD_CROSSOVER} 
                onChange={() => toggleType('MACD_CROSSOVER')}
                className="accent-[var(--color-gold)]"
              />
              MACD Momentum Crossover
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[var(--color-text)] transition-colors">
              <input 
                type="checkbox" 
                checked={enabledTypes.VOLUME_BREAKOUT} 
                onChange={() => toggleType('VOLUME_BREAKOUT')}
                className="accent-[var(--color-gold)]"
              />
              Volume Breakouts (2x 20-day Average)
            </label>
          </div>
        </div>
      )}

      {/* 3. SIGNAL CARDS ROW */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        {kpis.map((k, i) => (
          <div key={k.label} className="bg-[var(--color-card)] border border-[var(--color-border)] border-l-[2px] rounded-[3px] p-4 animate-[fadeSlideUp_0.4s_ease-out_both]" style={{ borderLeftColor: k.border, animationDelay: `${i*100}ms` }}>
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] mb-2">{k.label}</div>
            <div className="font-mono text-[24px] font-bold" style={{ color: k.valColor || 'var(--color-text)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* 4. FILTER BAR */}
      <div className="flex gap-3 mb-6 shrink-0">
        <input 
          type="text" 
          placeholder="Filter signals by stock or indicator..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.3)] w-[240px]"
        />
      </div>

      {/* 5. ERROR STATE */}
      {error && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-2 border border-[var(--color-loss)]/20 bg-[var(--color-loss)]/5 rounded-[3px] p-6">
          <AlertTriangle size={32} className="text-[var(--color-loss)]" />
          <h3 className="font-cinzel text-sm font-bold text-[var(--color-text)]">Indicator scan failed</h3>
          <p className="font-inter text-[12px] text-[var(--color-text-muted)]">{error}</p>
        </div>
      )}

      {/* 6. SIGNALS FEED */}
      {!error && (
        <div className="flex-1 overflow-y-auto pr-2 pb-6 min-h-0">
          {filtered.length === 0 ? (
            <EmptyState title="No active triggers" message="Adjust configuration toggles or add more tickers to your watchlist to scan." />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((sig, i) => {
                const dateStr = sig.created_at ? new Date(sig.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now';
                return (
                  <div key={sig.id || i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-5 flex flex-col gap-4 animate-[fadeSlideUp_0.4s_ease-out_both] group hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200" style={{ animationDelay: `${i*40}ms` }}>
                    <div className="flex justify-between items-start">
                      <span className="font-inter text-[9px] uppercase tracking-[0.1em] text-[var(--color-gold)] border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 px-2 py-0.5 rounded-[2px] font-bold">
                        {sig.signal_type.replace('_', ' ')}
                      </span>
                      <span className="font-inter text-[10px] text-[var(--color-text-faint)]">{dateStr}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-cinzel text-[18px] font-bold text-[var(--color-text)]">{sig.ticker}</span>
                        <span className="font-mono text-[11px] text-[var(--color-text-faint)]">Spot: ₹{sig.price}</span>
                      </div>
                      <div className={`font-inter text-[13px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-[3px] border ${sig.direction === 'BUY' ? 'bg-[var(--color-gain)]/10 border-[var(--color-gain)]/20 text-[var(--color-gain)]' : 'bg-[var(--color-loss)]/10 border-[var(--color-loss)]/20 text-[var(--color-loss)]'}`}>
                        {sig.direction === 'BUY' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {sig.direction}
                      </div>
                    </div>

                    <p className="font-inter text-[11.5px] text-[var(--color-text-muted)] leading-relaxed">
                      {sig.message}
                    </p>
                    
                    <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3.5 mt-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-inter text-[10px] text-[var(--color-text-faint)] uppercase">Strength:</span>
                        <span className={`font-inter text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] ${sig.strength === 'Strong' ? 'bg-[var(--color-gain)]/15 text-[var(--color-gain)]' : sig.strength === 'Moderate' ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]' : 'bg-[var(--color-text-faint)] text-[var(--color-text-muted)]'}`}>
                          {sig.strength}
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate(`/sandbox?symbol=${sig.ticker}`)}
                        className="font-inter text-[10px] uppercase font-bold text-[rgba(134,159,196,0.95)] hover:text-[var(--color-gold)] transition-colors cursor-pointer"
                      >
                        View Chart →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
