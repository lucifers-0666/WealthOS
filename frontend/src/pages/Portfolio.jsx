import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { PageLoadingState, PageErrorState } from '../components/PageStates.jsx';
import EditHoldingModal from '../components/EditHoldingModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import { DotsThree, ArrowUp, ArrowDown } from '@phosphor-icons/react';

// ---- Helpers --------------------------------------------------------
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function pct(n) {
  if (n == null || isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}
function compact(n) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${n < 0 ? '-' : ''}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${n < 0 ? '-' : ''}₹${(abs / 1e5).toFixed(2)}L`;
  return fmt(n);
}

// ---- Main Page --------------------------------------------------------
export default function Portfolio() {
  const { portfolio, loading, error, refresh, updateHolding, deleteHolding } = usePortfolio();
  const { holdings: liveHoldings, wsStatus, isLive, forceRefresh } = useMarketData();

  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterClass, setFilterClass]   = useState('All');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const liveHoldingsHaveValue = liveHoldings.some((h) => Number(h?.current_value || h?.current_value_inr || 0) > 0 || Number(h?.ltp || 0) > 0);
  const rawHoldings = liveHoldingsHaveValue ? liveHoldings : (portfolio?.holdings || []);

  const assetClasses = useMemo(() => {
    const s = new Set(rawHoldings.map((h) => h.asset_class || 'Equity'));
    const arr = ['All', ...Array.from(s)];
    if (!arr.includes('ETF')) arr.push('ETF');
    return arr;
  }, [rawHoldings]);

  const holdings = useMemo(() => {
    let h = filterClass === 'All' ? rawHoldings : rawHoldings.filter((x) => (x.asset_class || 'Equity') === filterClass);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      h = h.filter(x => (x.ticker||'').toLowerCase().includes(q) || (x.company_name||'').toLowerCase().includes(q));
    }
    return [...h].sort((a, b) => (b.current_value || 0) - (a.current_value || 0));
  }, [rawHoldings, filterClass, searchQuery]);

  const summary = portfolio?.summary || {};
  const totalValue = summary.totalCurrent || 0;

  // Sectors
  const bySector = {};
  holdings.forEach(h => {
    const sec = h.sector || 'Others';
    bySector[sec] = (bySector[sec] || 0) + (h.current_value || 0);
  });
  const sectors = Object.entries(bySector)
    .map(([name, val]) => ({ name, val, pct: (val/(totalValue||1))*100 }))
    .sort((a,b) => b.val - a.val);

  // Donut slices
  const donutSlices = sectors;
  const DONUT_COLORS = ['#C8B38E', '#869FC4', '#6FAE8D', '#B66A6A', '#D2A76D', '#ACA492', '#7B7C70'];

  const handleSave = useCallback(async (data) => {
    setSaving(true);
    try {
      await updateHolding({ id: editTarget?.id, ...data });
      setEditTarget(null);
      refresh();
      forceRefresh();
    } catch (e) {
      console.error('Save holding failed', e);
    } finally {
      setSaving(false);
    }
  }, [editTarget, updateHolding, refresh, forceRefresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteHolding(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
      forceRefresh();
    } catch (e) {
      console.error('Delete holding failed', e);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleteHolding, refresh, forceRefresh]);

  if (loading && !liveHoldings.length) return <PageLoadingState title="Loading portfolio…" />;
  if (error && !liveHoldings.length) return <PageErrorState title="Portfolio unavailable" message={error} />;

  const kpis = [
    { label: 'TOTAL VALUE', value: compact(summary.totalCurrent), border: '#C8B38E' },
    { label: 'INVESTED', value: compact(summary.totalInvested), border: 'rgba(134,159,196,0.9)' },
    { label: 'P&L', value: compact(summary.totalPnl), color: (summary.totalPnl || 0) >= 0 ? '#6FAE8D' : '#B66A6A', border: (summary.totalPnl || 0) >= 0 ? '#6FAE8D' : '#B66A6A' },
    { label: 'XIRR', value: '14.2%', border: 'rgba(134,159,196,0.9)' },
  ];

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC]">Portfolio</h1>
        <div className="flex gap-3">
          <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[#ECE0CC] transition-colors">
            Export CSV
          </button>
          <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[#ECE0CC] transition-colors" onClick={() => setEditTarget({})}>
            + Add Holding
          </button>
        </div>
      </div>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {kpis.map((k, i) => (
          <div key={k.label} className="bg-[#172923] border border-[#2D3C37] border-l-[2px] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_both]" style={{ borderLeftColor: k.border, animationDelay: `${i*60}ms` }}>
            <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-2">{k.label}</div>
            <div className={`font-mono text-[26px] font-bold animate-[countUp_1s_ease-out]`} style={{ color: k.color || '#ECE0CC' }}>
              {k.value}
            </div>
            <div className="h-[28px] w-[48px] mt-2 border-b border-dashed border-[#2D3C37]"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[auto_316px] gap-4">
        {/* 3. HOLDINGS TABLE CARD */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-[2px] h-3 bg-[#C8B38E]"></div>
              <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ACA492]">HOLDINGS</h3>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(45,60,55,0.9)] w-[200px]"
              />
              <select 
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1 font-inter text-[12px] text-[#ECE0CC] outline-none"
              >
                {assetClasses.map(ac => <option key={ac} value={ac}>{ac}</option>)}
              </select>
            </div>
          </div>

          <div className="w-full">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 pb-2 border-b border-[#2D3C37] font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70]">
              <div>STOCK</div>
              <div>SECTOR</div>
              <div className="text-right">QTY</div>
              <div className="text-right">AVG COST</div>
              <div className="text-right">LTP</div>
              <div className="text-right">P&L</div>
              <div className="text-right">P&L%</div>
              <div>WEIGHT</div>
              <div className="text-center">ACTION</div>
            </div>

            <div className="flex flex-col">
              {holdings.map((h, i) => {
                const invested = h.invested_amount || 0;
                const pnl = (h.current_value || 0) - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                const weight = totalValue > 0 ? ((h.current_value || 0) / totalValue) * 100 : 0;
                const isPositive = pnl >= 0;

                return (
                  <div key={h.id || h.ticker} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 py-3 border-b border-[rgba(45,60,55,0.55)] items-center group hover:bg-[rgba(255,255,255,0.018)] transition-colors duration-180" style={{ animation: `fadeSlideUp 0.4s ease-out ${300 + i*30}ms backwards` }}>
                    <div className="flex flex-col">
                      <span className="font-cinzel text-[13px] text-[#ECE0CC] truncate">{h.company_name || h.ticker}</span>
                      <span className="font-inter text-[9px] text-[#7B7C70] uppercase">{h.exchange || 'NSE'}</span>
                    </div>
                    <div className="font-inter text-[11px] text-[#ACA492] truncate">{h.sector || 'Equity'}</div>
                    <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{h.quantity}</div>
                    <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{fmt(h.avg_buy_price)}</div>
                    <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{fmt(h.current_price || h.ltp)}</div>
                    <div className={`font-mono text-[13px] font-bold text-right ${isPositive ? 'text-[#6FAE8D]' : 'text-[#B66A6A]'}`}>
                      {fmt(pnl)}
                    </div>
                    <div className="text-right flex justify-end">
                      <div className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-[3px] border ${isPositive ? 'bg-[rgba(111,174,141,0.12)] border-[rgba(111,174,141,0.28)] text-[#6FAE8D]' : 'bg-[rgba(182,106,106,0.12)] border-[rgba(182,106,106,0.28)] text-[#B66A6A]'}`}>
                        {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-[64px] h-[4px] bg-[rgba(45,60,55,0.5)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C8B38E]" style={{ width: `${weight}%`, animation: 'slideRight 0.8s ease-out backwards' }}></div>
                      </div>
                      <span className="font-mono text-[10px] text-[#ACA492]">{weight.toFixed(1)}%</span>
                    </div>
                    <div className="relative flex justify-center">
                      <button className="text-[#7B7C70] hover:text-[#ECE0CC]" onClick={() => setActiveDropdown(activeDropdown === h.id ? null : h.id)}>
                        <DotsThree size={16} weight="bold" />
                      </button>
                      {activeDropdown === h.id && (
                        <div className="absolute right-0 top-6 w-32 bg-[#1E3530] border border-[#2D3C37] rounded-[3px] shadow-lg z-10 py-1 animate-[fadeSlideUp_150ms_ease-out]">
                          <button className="w-full text-left px-3 py-1.5 font-inter text-[11px] text-[#ECE0CC] hover:bg-[rgba(255,255,255,0.05)]" onClick={() => { setActiveDropdown(null); setEditTarget(h); }}>View / Edit</button>
                          <button className="w-full text-left px-3 py-1.5 font-inter text-[11px] text-[#B66A6A] hover:bg-[rgba(255,255,255,0.05)]" onClick={() => { setActiveDropdown(null); setDeleteTarget(h); }}>Remove</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. ALLOCATION DONUT + 5. SECTOR WEIGHTS */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_360ms_both]">
            <div className="flex justify-center items-center py-6 relative">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {(() => {
                  let offset = 0;
                  const r = 60, cx = 80, cy = 80, stroke = 12;
                  const circ = 2 * Math.PI * r;
                  return donutSlices.map((s, i) => {
                    const dash = (s.pct / 100) * circ;
                    const arc = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ/4 - offset} className="transition-all duration-1000 ease-out" />;
                    offset += dash;
                    return arc;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-[16px] font-bold text-[#ECE0CC]">{compact(totalValue)}</span>
                <span className="font-inter text-[9px] text-[#7B7C70] uppercase">PORTFOLIO</span>
              </div>
            </div>
          </div>

          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_420ms_both]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[2px] h-3 bg-[#C8B38E]"></div>
              <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ACA492]">SECTOR WEIGHTS</h3>
            </div>
            <div className="flex flex-col gap-[14px]">
              {sectors.map((sec, i) => (
                <div key={sec.name} className="flex flex-col group transition-colors duration-180 hover:bg-[rgba(255,255,255,0.025)] p-1 -mx-1 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-inter text-[12px] text-[#ECE0CC]">{sec.name}</span>
                    <span className="font-mono text-[12px] text-[#C8B38E]">{sec.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-[6px] rounded-[2px] bg-[rgba(45,60,55,0.5)] w-full overflow-hidden">
                    <div className="h-full bg-[#C8B38E] rounded-[2px]" style={{ width: `${sec.pct}%`, animation: `slideRight 0.8s ease-out ${i*80}ms backwards` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editTarget !== null && (
        <EditHoldingModal
          holding={editTarget?.id ? editTarget : null}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          loading={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete ${deleteTarget.ticker}?`}
          message={`This will permanently remove ${deleteTarget.ticker} from your portfolio. This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
