import React, { useState, useMemo, useCallback } from 'react';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { usePortfolio } from '../lib/usePortfolio.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';
import { Trash, ArrowUpRight, ArrowDownRight, Bell, BellOff } from 'lucide-react';
import PriceAlertModal from '../components/PriceAlertModal.jsx';

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

function pct(n) {
  if (n == null || isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
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

export default function Watchlist() {
  const { watchlist: liveWatchlist, wsStatus, isLive, forceRefresh } = useMarketData();
  const { portfolio, loading, refresh, addToWatchlist, removeFromWatchlist } = usePortfolio();

  const [search, setSearch] = useState('');
  const [addTicker, setAddTicker] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [alertTarget, setAlertTarget] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const rawWatchlist = useMemo(() => {
    const liveWatchlistHaveValue = liveWatchlist.some((item) => Number(item?.current_price || item?.ltp || 0) > 0);
    if (liveWatchlistHaveValue) return liveWatchlist;
    return portfolio?.watchlist || [];
  }, [liveWatchlist, portfolio?.watchlist]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rawWatchlist;
    const q = search.toLowerCase();
    return rawWatchlist.filter((item) =>
      (item.ticker || '').toLowerCase().includes(q) ||
      (item.sector || '').toLowerCase().includes(q)
    );
  }, [rawWatchlist, search]);

  const handleAdd = useCallback(async () => {
    if (!addTicker.trim()) return;
    setAddLoading(true);
    try {
      await addToWatchlist(addTicker.trim().toUpperCase());
      setAddTicker('');
      refresh();
      forceRefresh();
    } catch (e) {
      console.error('Add watchlist failed', e);
    } finally {
      setAddLoading(false);
    }
  }, [addTicker, addToWatchlist, refresh, forceRefresh]);

  const handleRemove = useCallback(async (tickerOrId) => {
    try { await removeFromWatchlist(tickerOrId); refresh(); forceRefresh(); }
    catch (e) { console.error('Remove watchlist failed', e); }
  }, [removeFromWatchlist, refresh, forceRefresh]);

  if (loading && !liveWatchlist.length) return <PageLoadingState title="Loading watchlist…" />;

  // Mock index cards for demo purposes
  const topCards = [
    { label: 'NIFTY 50', val: 22419.95, pct: 0.42, border: '#C8B38E' },
    { label: 'SENSEX', val: 73806.15, pct: 0.45, border: 'rgba(134,159,196,0.9)' },
    { label: 'TOP WATCHED: HDFCBANK', val: 1532.45, pct: 1.2, border: '#6FAE8D' },
  ];

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide">Watchlist</h1>
            {isLive && (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[rgba(111,174,141,0.12)] border border-[rgba(111,174,141,0.28)]">
                 <div className="w-[6px] h-[6px] rounded-full bg-[#6FAE8D] animate-[pulse-dot_2s_infinite]"></div>
                 <span className="font-inter text-[9px] uppercase font-bold text-[#6FAE8D]">LIVE</span>
               </div>
            )}
          </div>
          <div className="font-inter text-[11px] text-[#7B7C70] mt-1">Tracked assets</div>
        </div>
        <div className="flex gap-2">
          <input
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add ticker (e.g. INFY)"
            className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.3)] w-[160px]"
          />
          <button 
            onClick={handleAdd}
            disabled={addLoading || !addTicker.trim()}
            className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[#ECE0CC] transition-colors disabled:opacity-50"
          >
            + Add Symbol
          </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        {topCards.map((c, i) => (
          <div key={c.label} className="bg-[#172923] border border-[#2D3C37] border-l-[2px] rounded-[3px] p-4 flex flex-col gap-1 animate-[fadeSlideUp_0.4s_ease-out_both]" style={{ borderLeftColor: c.border, animationDelay: `${i*100}ms` }}>
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-1">{c.label}</div>
            <div className="font-mono text-[20px] font-bold text-[#ECE0CC]">{fmt(c.val)}</div>
            <div className={`font-mono text-[11px] font-bold ${c.pct >= 0 ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>
              {c.pct >= 0 ? '+' : ''}{c.pct}%
            </div>
          </div>
        ))}
      </div>

      {/* 3. WATCHLIST TABLE */}
      <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] flex flex-col min-h-0 flex-1 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <SectionHeader title="TRACKED SYMBOLS" />
            <input 
              type="text" 
              placeholder="Search watchlist..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(45,60,55,0.9)] w-[200px]"
            />
          </div>

          {!filtered.length ? (
            <EmptyState title="Watchlist is empty" message="Add tickers above to start monitoring live prices." />
          ) : (
            <div className="flex-1 overflow-y-auto w-full pr-2">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 pb-2 border-b border-[#2D3C37] font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] sticky top-0 bg-[#172923] z-10">
                <div>SYMBOL</div>
                <div>SECTOR</div>
                <div className="text-right">LTP</div>
                <div className="text-right">DAY CHANGE</div>
                <div className="text-right">DAY CHANGE%</div>
                <div className="text-right">VOL</div>
                <div className="text-center">52W RANGE</div>
                <div className="text-center">ACTION</div>
              </div>

              <div className="flex flex-col">
                {filtered.map((item, i) => {
                  const isUp = (item.change_pct || item.day_change_pct || 0) >= 0;
                  const chPct = item.change_pct || item.day_change_pct || 0;
                  const chAbs = item.change_abs || item.day_change || 0;
                  const high = item.high_52w || (item.current_price * 1.15);
                  const low = item.low_52w || (item.current_price * 0.85);
                  const ltp = item.current_price || item.ltp || 0;
                  const rangePct = Math.min(100, Math.max(0, ((ltp - low) / (high - low)) * 100)) || 50;
                  const hasAlert = alerts.some((a) => a.ticker === item.ticker);

                  return (
                    <div key={item.ticker || i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 py-3 border-b border-[rgba(45,60,55,0.55)] items-center group hover:bg-[rgba(255,255,255,0.018)] transition-colors" style={{ animation: `fadeSlideUp 0.3s ease-out ${300 + i*30}ms backwards` }}>
                      <div className="flex flex-col">
                        <span className="font-cinzel text-[13px] text-[#ECE0CC] truncate">{item.ticker}</span>
                        <span className="font-inter text-[9px] text-[#7B7C70] uppercase">{item.exchange || 'NSE'}</span>
                      </div>
                      <div className="font-inter text-[11px] text-[#ACA492]">{item.sector || 'Equities'}</div>
                      <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{fmt(ltp)}</div>
                      <div className={`font-mono text-[12px] font-bold text-right ${isUp ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>
                        {isUp ? '+' : ''}{fmt(chAbs)}
                      </div>
                      <div className="text-right flex justify-end">
                        <div className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-[3px] border ${isUp ? 'bg-[rgba(111,174,141,0.12)] border-[rgba(111,174,141,0.28)] text-[#6FAE8D]' : 'bg-[rgba(182,106,106,0.12)] border-[rgba(182,106,106,0.28)] text-[#B66A6A]'}`}>
                          {pct(chPct)}
                        </div>
                      </div>
                      <div className="font-mono text-[11px] text-[#ACA492] text-right">{item.volume ? `${(item.volume/1e6).toFixed(1)}M` : '—'}</div>
                      
                      {/* 52W Range Bar */}
                      <div className="flex flex-col px-4 gap-1">
                        <div className="flex justify-between font-mono text-[9px] text-[#7B7C70]">
                          <span>L</span><span>H</span>
                        </div>
                        <div className="h-[4px] bg-[rgba(45,60,55,0.5)] rounded-full overflow-hidden w-full relative">
                           <div className="absolute top-0 bottom-0 left-0 bg-[#869FC4] rounded-full" style={{ width: `${rangePct}%` }}></div>
                           <div className="absolute top-0 bottom-0 bg-[#ECE0CC] w-[2px] rounded-full" style={{ left: `${rangePct}%`, transform: 'translateX(-50%)' }}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setAlertTarget(item)}
                          className={hasAlert ? "text-[#C8B38E]" : "text-[#7B7C70] hover:text-[#ACA492]"}
                        >
                          {hasAlert ? <Bell size={14} /> : <BellOff size={14} />}
                        </button>
                        <button 
                          onClick={() => handleRemove(item.ticker)}
                          className="text-[#7B7C70] hover:text-[#B66A6A]"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {alertTarget && (
        <PriceAlertModal
          ticker={alertTarget.ticker}
          currentPrice={alertTarget.current_price}
          onSave={(data) => {
            setAlerts(prev => [...prev, data]);
            setAlertTarget(null);
          }}
          onClose={() => setAlertTarget(null)}
        />
      )}
    </div>
  );
}
