import React, { useState } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';
import { ArrowUp, ArrowDown } from 'lucide-react';

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
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

export default function Transactions() {
  const { transactions, loading, error } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  if (loading) return <PageLoadingState title="Loading transactions…" subtitle="Retrieving ledger data." />;
  if (error) return <PageErrorState title="Transactions unavailable" message={error} />;

  const txns = transactions || [];
  
  const totalTrades = txns.length;
  const buyOrders = txns.filter(t => (t.action || 'buy').toLowerCase() === 'buy').length;
  const sellOrders = txns.filter(t => (t.action || 'sell').toLowerCase() === 'sell').length;
  const totalInvested = txns.filter(t => (t.action || 'buy').toLowerCase() === 'buy').reduce((s, t) => s + (Number(t.price || 0) * Number(t.quantity || 0)), 0);

  let filteredTxns = [...txns].sort((a, b) => {
    const da = new Date(a.transaction_date || a.date || 0);
    const db = new Date(b.transaction_date || b.date || 0);
    return db - da;
  });

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTxns = filteredTxns.filter(t => (t.ticker||'').toLowerCase().includes(q));
  }
  if (typeFilter !== 'ALL') {
    filteredTxns = filteredTxns.filter(t => (t.action || 'buy').toUpperCase() === typeFilter);
  }

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide">Transactions</h1>
          <div className="font-inter text-[11px] text-[#7B7C70] mt-1">Full trade history</div>
        </div>
        <div className="flex gap-3">
          <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[#ECE0CC] transition-colors">
            Export
          </button>
          <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[#ECE0CC] transition-colors">
            + Add Transaction
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STRIP */}
      <div className="flex items-center gap-8 mb-6 border-y border-[#2D3C37] py-4 shrink-0 animate-[fadeSlideUp_0.4s_ease-out_100ms_both]">
        <div className="flex flex-col gap-1 pr-8 border-r border-[#2D3C37]">
          <span className="font-inter text-[9px] text-[#7B7C70] uppercase">TOTAL TRADES</span>
          <span className="font-mono text-[18px] text-[#ECE0CC] font-bold">{totalTrades}</span>
        </div>
        <div className="flex flex-col gap-1 pr-8 border-r border-[#2D3C37]">
          <span className="font-inter text-[9px] text-[#7B7C70] uppercase">BUY ORDERS</span>
          <span className="font-mono text-[18px] text-[#ECE0CC] font-bold">{buyOrders}</span>
        </div>
        <div className="flex flex-col gap-1 pr-8 border-r border-[#2D3C37]">
          <span className="font-inter text-[9px] text-[#7B7C70] uppercase">SELL ORDERS</span>
          <span className="font-mono text-[18px] text-[#ECE0CC] font-bold">{sellOrders}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-inter text-[9px] text-[#7B7C70] uppercase">TOTAL INVESTED</span>
          <span className="font-mono text-[18px] text-[#ECE0CC] font-bold">{fmt(totalInvested)}</span>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div className="flex gap-3 mb-6 shrink-0 animate-[fadeSlideUp_0.4s_ease-out_150ms_both]">
        <button className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC]">All Dates</button>
        <input 
          type="text" 
          placeholder="Search stock..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(45,60,55,0.9)] w-[200px]"
        />
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <button className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC]">Sort: Newest</button>
      </div>

      {/* 4. TRANSACTIONS TABLE */}
      <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] flex flex-col min-h-0 flex-1 animate-[fadeSlideUp_0.4s_ease-out_200ms_both]">
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <SectionHeader title="TRANSACTION HISTORY" />
          
          {!filteredTxns.length ? (
            <div className="flex-1 flex justify-center items-center">
              <span className="font-inter text-[#7B7C70] text-sm">No transactions found.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto w-full pr-2 mt-2">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 pb-2 border-b border-[#2D3C37] font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] sticky top-0 bg-[#172923] z-10">
                <div>DATE</div>
                <div>TYPE</div>
                <div>STOCK</div>
                <div className="text-right">QTY</div>
                <div className="text-right">PRICE</div>
                <div className="text-right">TOTAL</div>
                <div className="text-right">P&L REALISED</div>
                <div className="text-right">STATUS</div>
              </div>

              <div className="flex flex-col">
                {filteredTxns.map((txn, i) => {
                  const dateStr = txn.transaction_date || txn.date || '';
                  const action = (txn.action || 'buy').toUpperCase();
                  const qty = Number(txn.quantity || 0);
                  const price = Number(txn.price || 0);
                  const total = qty * price;
                  // Mock Realised PnL for demo if SELL
                  const pnlRealised = action === 'SELL' ? (Math.random() * 2000 - 500) : null;
                  const isGain = pnlRealised >= 0;

                  return (
                    <div key={txn.id || i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-3 border-b border-[rgba(45,60,55,0.55)] items-center group hover:bg-[rgba(255,255,255,0.018)] transition-colors" style={{ animation: `fadeSlideUp 0.3s ease-out ${200 + i*20}ms backwards` }}>
                      <div className="font-inter text-[10px] text-[#7B7C70]">
                        {dateStr ? new Date(dateStr).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-1 font-inter text-[9px] font-bold px-2 py-0.5 rounded-[2px] border ${action === 'BUY' ? 'bg-[rgba(111,174,141,0.12)] border-[rgba(111,174,141,0.28)] text-[#6FAE8D]' : 'bg-[rgba(182,106,106,0.12)] border-[rgba(182,106,106,0.28)] text-[#B66A6A]'}`}>
                          {action === 'BUY' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                          {action}
                        </div>
                      </div>
                      <div className="font-cinzel text-[13px] text-[#ECE0CC]">{txn.ticker}</div>
                      <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{qty}</div>
                      <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{fmt(price)}</div>
                      <div className="font-mono text-[12px] text-[#ECE0CC] text-right">{fmt(total)}</div>
                      <div className={`font-mono text-[13px] font-bold text-right ${action === 'SELL' ? (isGain ? 'text-[#6FAE8D]' : 'text-[#B66A6A]') : 'text-[#7B7C70]'}`}>
                        {action === 'SELL' ? (isGain ? '+' : '') + fmt(pnlRealised) : '—'}
                      </div>
                      <div className="font-inter text-[10px] font-bold text-[#6FAE8D] text-right">EXECUTED</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. PAGINATION */}
        <div className="bg-[#172923] border-t border-[#2D3C37] px-4 py-3 flex justify-between items-center shrink-0">
          <div className="font-inter text-[11px] text-[#7B7C70]">Showing 1–{Math.min(20, filteredTxns.length)} of {filteredTxns.length} transactions</div>
          <div className="flex gap-2 font-inter text-[11px]">
            <button className="text-[#7B7C70] hover:text-[#ECE0CC]">Prev</button>
            <button className="bg-[#C8B38E] text-[#0A201F] rounded-[2px] px-2 py-0.5 font-bold">1</button>
            <button className="text-[#7B7C70] hover:text-[#ECE0CC] px-2 py-0.5">2</button>
            <button className="text-[#7B7C70] hover:text-[#ECE0CC] px-2 py-0.5">3</button>
            <button className="text-[#7B7C70] hover:text-[#ECE0CC] px-2 py-0.5">...</button>
            <button className="text-[#7B7C70] hover:text-[#ECE0CC]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
