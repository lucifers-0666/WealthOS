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
      <div className="w-[2px] h-3 bg-[var(--color-gold)]"></div>
      <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
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
          <h1 className="font-cinzel text-xl font-bold text-[var(--color-text)] tracking-wide">Transactions</h1>
          <div className="font-inter text-[11px] text-[var(--color-text-faint)] mt-1">Full trade history</div>
        </div>
        <div className="flex gap-3">
          <button className="border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[var(--color-text)] transition-colors">
            Export
          </button>
          <button className="border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] hover:border-[rgba(200,179,142,0.3)] hover:text-[var(--color-text)] transition-colors">
            + Add Transaction
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STRIP */}
      <div className="flex items-center gap-8 mb-6 border-y border-[var(--color-border)] py-4 shrink-0 animate-[fadeSlideUp_0.4s_ease-out_100ms_both]">
        <div className="flex flex-col gap-1 pr-8 border-r border-[var(--color-border)]">
          <span className="font-inter text-[9px] text-[var(--color-text-faint)] uppercase">TOTAL TRADES</span>
          <span className="font-mono text-[18px] text-[var(--color-text)] font-bold">{totalTrades}</span>
        </div>
        <div className="flex flex-col gap-1 pr-8 border-r border-[var(--color-border)]">
          <span className="font-inter text-[9px] text-[var(--color-text-faint)] uppercase">BUY ORDERS</span>
          <span className="font-mono text-[18px] text-[var(--color-text)] font-bold">{buyOrders}</span>
        </div>
        <div className="flex flex-col gap-1 pr-8 border-r border-[var(--color-border)]">
          <span className="font-inter text-[9px] text-[var(--color-text-faint)] uppercase">SELL ORDERS</span>
          <span className="font-mono text-[18px] text-[var(--color-text)] font-bold">{sellOrders}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-inter text-[9px] text-[var(--color-text-faint)] uppercase">TOTAL INVESTED</span>
          <span className="font-mono text-[18px] text-[var(--color-text)] font-bold">{fmt(totalInvested)}</span>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div className="flex gap-3 mb-6 shrink-0 animate-[fadeSlideUp_0.4s_ease-out_150ms_both]">
        <button className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)]">All Dates</button>
        <input 
          type="text" 
          placeholder="Search stock..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[rgba(45,60,55,0.9)] w-[200px]"
        />
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <button className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)]">Sort: Newest</button>
      </div>

      {/* 4. TRANSACTIONS TABLE */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] flex flex-col min-h-0 flex-1 animate-[fadeSlideUp_0.4s_ease-out_200ms_both]">
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <SectionHeader title="TRANSACTION HISTORY" />
          
          {!filteredTxns.length ? (
            <div className="flex-1 flex justify-center items-center">
              <span className="font-inter text-[var(--color-text-faint)] text-sm">No transactions found.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto w-full pr-2 mt-2">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 pb-2 border-b border-[var(--color-border)] font-inter text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] sticky top-0 bg-[var(--color-card)] z-10">
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
                  
                  // Compute real realised P&L based on preceding purchases
                  let pnlRealised = null;
                  if (action === 'SELL') {
                    const sellDate = new Date(dateStr);
                    const precedingBuys = txns.filter(t => 
                      t.ticker === txn.ticker && 
                      (t.action || 'buy').toUpperCase() === 'BUY' && 
                      new Date(t.transaction_date || t.date || 0) <= sellDate
                    );
                    const totalBuyQty = precedingBuys.reduce((acc, t) => acc + Number(t.quantity || 0), 0);
                    const totalBuyVal = precedingBuys.reduce((acc, t) => acc + (Number(t.quantity || 0) * Number(t.price || 0)), 0);
                    const avgBuyPrice = totalBuyQty > 0 ? (totalBuyVal / totalBuyQty) : 0;
                    pnlRealised = (price - avgBuyPrice) * qty;
                  }
                  const isGain = pnlRealised >= 0;

                  return (
                    <div key={txn.id || i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-3 border-b border-[rgba(45,60,55,0.55)] items-center group hover:bg-[rgba(255,255,255,0.018)] transition-colors" style={{ animation: `fadeSlideUp 0.3s ease-out ${200 + i*20}ms backwards` }}>
                      <div className="font-inter text-[10px] text-[var(--color-text-faint)]">
                        {dateStr ? new Date(dateStr).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-1 font-inter text-[9px] font-bold px-2 py-0.5 rounded-[2px] border ${action === 'BUY' ? 'bg-[rgba(111,174,141,0.12)] border-[rgba(111,174,141,0.28)] text-[var(--color-gain)]' : 'bg-[rgba(182,106,106,0.12)] border-[rgba(182,106,106,0.28)] text-[var(--color-loss)]'}`}>
                          {action === 'BUY' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                          {action}
                        </div>
                      </div>
                      <div className="font-cinzel text-[13px] text-[var(--color-text)]">{txn.ticker}</div>
                      <div className="font-mono text-[12px] text-[var(--color-text)] text-right">{qty}</div>
                      <div className="font-mono text-[12px] text-[var(--color-text)] text-right">{fmt(price)}</div>
                      <div className="font-mono text-[12px] text-[var(--color-text)] text-right">{fmt(total)}</div>
                      <div className={`font-mono text-[13px] font-bold text-right ${action === 'SELL' ? (isGain ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]') : 'text-[var(--color-text-faint)]'}`}>
                        {action === 'SELL' ? (isGain ? '+' : '') + fmt(pnlRealised) : '—'}
                      </div>
                      <div className="font-inter text-[10px] font-bold text-[var(--color-gain)] text-right">EXECUTED</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. PAGINATION */}
        <div className="bg-[var(--color-card)] border-t border-[var(--color-border)] px-4 py-3 flex justify-between items-center shrink-0">
          <div className="font-inter text-[11px] text-[var(--color-text-faint)]">Showing 1–{Math.min(20, filteredTxns.length)} of {filteredTxns.length} transactions</div>
          <div className="flex gap-2 font-inter text-[11px]">
            <button className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">Prev</button>
            <button className="bg-[var(--color-gold)] text-[var(--color-bg)] rounded-[2px] px-2 py-0.5 font-bold">1</button>
            <button className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] px-2 py-0.5">2</button>
            <button className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] px-2 py-0.5">3</button>
            <button className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] px-2 py-0.5">...</button>
            <button className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
