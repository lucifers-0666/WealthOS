import React, { useState, useEffect } from 'react';
import { useSandboxStore } from '../../../../store/sandboxStore';
import { getSandboxPrice } from '../../../../services/sandbox';
import { 
  ArrowUpRight, ArrowDownRight, MagnifyingGlass, 
  Tag, ListDashes, CheckCircle, WarningCircle, CircleNotch 
} from '@phosphor-icons/react';

const POPULAR_TICKERS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN"];

export default function EquityDesk() {
  const { holdings, isLoading } = useSandboxStore();
  const { loadHoldings, loadOrders, placeEquityOrder, closePosition } = useSandboxStore(state => state.actions);
  
  const [ticker, setTicker] = useState('RELIANCE');
  const [qty, setQty] = useState(10);
  const [action, setAction] = useState('BUY');
  
  // Live Price State
  const [quote, setQuote] = useState(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  
  // Transaction Feedback
  const [txSuccess, setTxSuccess] = useState(null);
  const [txError, setTxError] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    loadHoldings();
    fetchLiveQuote(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLiveQuote = async (symbol) => {
    if (!symbol) return;
    setFetchingQuote(true);
    setQuoteError(null);
    try {
      const data = await getSandboxPrice(symbol);
      if (data && data.price) {
        setQuote(data);
      } else {
        setQuoteError("Failed to resolve current market price.");
        setQuote(null);
      }
    } catch (e) {
      setQuoteError(e.message || "Failed to fetch live quote.");
      setQuote(null);
    } finally {
      setFetchingQuote(false);
    }
  };

  const handleQuickSelect = (sym) => {
    setTicker(sym);
    fetchLiveQuote(sym);
  };

  const handleOrder = async () => {
    if (!ticker) return;
    setTxError(null);
    setTxSuccess(null);
    setTxLoading(true);
    try {
      const res = await placeEquityOrder(ticker, action, qty);
      setTxSuccess(res.message || `Market order successfully executed for ${qty} shares of ${ticker}.`);
      setQty(10);
      fetchLiveQuote(ticker); // refresh price and positions
      setTimeout(() => setTxSuccess(null), 5000);
    } catch (e) {
      setTxError(e.message || "Simulated order placement failed.");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
      {/* LEFT COLUMN: HOLDINGS TABLE & LIVE TICKER SELECTION */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* TICKER INSPECTOR */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[9px] font-bold tracking-wider text-[var(--color-gold)] uppercase">Market Inspector</span>
                <h3 className="font-cinzel text-[11px] font-bold tracking-[0.12em] text-[var(--color-text)] uppercase mt-0.5">Live Stock Quotes</h3>
              </div>
              
              {/* Popular Tickers Chips */}
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TICKERS.map(sym => (
                  <button 
                    key={sym}
                    onClick={() => handleQuickSelect(sym)}
                    className={`px-2.5 py-1 rounded-[3px] font-mono text-[10px] font-semibold transition-all border ${ticker === sym ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/50 text-[var(--color-gold)]' : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Search Box */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Enter ticker (e.g. INFOSYS as INFY, WIPRO)"
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] pl-8 pr-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
                />
                <MagnifyingGlass size={14} className="absolute left-2.5 top-3 text-[var(--color-text-faint)]" />
              </div>
              <button 
                onClick={() => fetchLiveQuote(ticker)}
                disabled={fetchingQuote}
                className="bg-[var(--color-gold)] hover:brightness-110 text-black px-4 py-2 rounded-[3px] text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5"
              >
                {fetchingQuote ? <CircleNotch size={14} className="animate-spin" /> : 'Get Quote'}
              </button>
            </div>

            {/* Quote details */}
            {fetchingQuote ? (
              <div className="py-4 flex justify-center"><CircleNotch size={20} className="animate-spin text-[var(--color-gold)]" /></div>
            ) : quoteError ? (
              <div className="bg-[rgba(182,106,106,0.04)] border border-[var(--color-loss)]/20 p-3 rounded-[3px] text-xs text-[var(--color-loss)] font-mono">
                {quoteError}
              </div>
            ) : quote ? (
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-[4px] flex items-center justify-between">
                <div>
                  <div className="font-cinzel text-sm font-bold text-[var(--color-text)]">{quote.symbol}</div>
                  <div className="text-[10px] text-[var(--color-text-faint)] font-mono mt-0.5">{quote.ticker}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-[var(--color-text)]">
                    ₹{quote.price.toFixed(2)}
                  </div>
                  <div className={`font-mono text-[10px] mt-0.5 flex items-center gap-1 justify-end ${quote.change >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                    {quote.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    <span>{quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.pct_change >= 0 ? '+' : ''}{quote.pct_change.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ACTIVE PORTFOLIO HOLDINGS */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--color-border)]/50 mb-4">
            <ListDashes size={15} className="text-[var(--color-gold)]" />
            <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">Active Paper Holdings</h3>
          </div>

          {holdings.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-faint)] tracking-wide">
              NO OPEN PAPER POSITION. DEPLOY MARGIN TO START PRACTICE.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-inter">
                <thead>
                  <tr className="border-b border-[var(--color-border)]/50 pb-2 text-[var(--color-text-faint)] font-bold uppercase tracking-wider">
                    <th className="py-2.5 pl-2">Ticker</th>
                    <th className="py-2.5">Qty</th>
                    <th className="py-2.5">Avg Buy Price</th>
                    <th className="py-2.5">LTP</th>
                    <th className="py-2.5 text-right">Simulated P&L</th>
                    <th className="py-2.5 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => {
                    const diff = h.current_price - h.avg_buy_price;
                    const changePct = h.avg_buy_price > 0 ? (diff / h.avg_buy_price) * 100 : 0;
                    return (
                      <tr key={h.id} className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg)]/20 transition-all">
                        <td className="py-3 pl-2 font-cinzel font-bold text-[var(--color-text)]">
                          {h.ticker}
                        </td>
                        <td className="py-3 font-mono font-semibold text-[var(--color-text-muted)]">
                          {parseFloat(h.quantity).toFixed(0)}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{parseFloat(h.avg_buy_price).toFixed(2)}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{parseFloat(h.current_price || h.avg_buy_price).toFixed(2)}
                        </td>
                        <td className={`py-3 text-right font-mono font-bold ${h.unrealized_pnl >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                          {h.unrealized_pnl >= 0 ? '+' : ''}₹{h.unrealized_pnl.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to square off ${h.ticker}?`)) {
                                try {
                                  await closePosition(h.id, 'equity');
                                } catch (err) {
                                  alert(err.message || "Failed to square off position");
                                }
                              }
                            }}
                            className="bg-[rgba(182,106,106,0.15)] hover:bg-[var(--color-loss)] hover:text-white border border-[var(--color-loss)]/30 text-[var(--color-loss)] px-2.5 py-1 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: TRANSACTION DESK */}
      <div className="flex flex-col gap-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 h-full relative">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--color-border)]/50 mb-5">
            <Tag size={15} className="text-[var(--color-gold)]" />
            <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">Stock Order Panel</h3>
          </div>

          {/* Feedback states */}
          {txSuccess && (
            <div className="bg-[rgba(34,197,94,0.05)] border border-[var(--color-gain)]/30 p-3 rounded-[3px] flex gap-2 text-[var(--color-gain)] text-xs mb-4 leading-normal">
              <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{txSuccess}</span>
            </div>
          )}
          {txError && (
            <div className="bg-[rgba(182,106,106,0.05)] border border-[var(--color-loss)]/30 p-3 rounded-[3px] flex gap-2 text-[var(--color-loss)] text-xs mb-4 leading-normal">
              <WarningCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{txError}</span>
            </div>
          )}

          {/* BUY/SELL Toggle */}
          <div className="flex gap-2 mb-5">
            <button 
              onClick={() => setAction('BUY')} 
              className={`flex-1 py-2 rounded-[3px] font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer border ${action === 'BUY' ? 'bg-[var(--color-gain)] border-[var(--color-gain)] text-black font-extrabold' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
            >
              BUY / LONG
            </button>
            <button 
              onClick={() => setAction('SELL')} 
              className={`flex-1 py-2 rounded-[3px] font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer border ${action === 'SELL' ? 'bg-[var(--color-loss)] border-[var(--color-loss)] text-white font-extrabold' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
            >
              SELL / SHORT
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1.5">Inspected Ticker</label>
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono font-bold text-[var(--color-text)]">
                {ticker || 'NONE'}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1.5">Order Quantity</label>
              <input 
                type="number" 
                min="1"
                placeholder="Number of shares" 
                value={qty} 
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
              />
            </div>

            {quote && (
              <div className="border-t border-b border-[var(--color-border)]/50 py-3.5 my-1 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-faint)]">Estimated LTP:</span>
                  <span className="text-[var(--color-text)] font-semibold">₹{quote.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-faint)]">Simulated Order Value:</span>
                  <span className="text-[var(--color-text)] font-bold">₹{(quote.price * qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <button 
              onClick={handleOrder} 
              disabled={txLoading || !ticker || !quote}
              className={`w-full py-3 rounded-[3px] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-2 ${action === 'BUY' ? 'bg-[var(--color-gain)] text-black' : 'bg-[var(--color-loss)] text-white'} hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {txLoading ? <CircleNotch size={14} className="animate-spin" /> : `EXECUTE SIMULATED ${action}`}
            </button>
            <span className="text-[8px] text-[var(--color-text-faint)] text-center block leading-relaxed mt-1">
              * Paper trading executes immediately at market LTP without clearing slippage.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
