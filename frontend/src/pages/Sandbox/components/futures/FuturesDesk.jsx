import React, { useState, useEffect } from 'react';
import { useSandboxStore } from '../../../../store/sandboxStore';
import { 
  ArrowUpRight, ArrowDownRight, Tag, ListDashes, 
  CheckCircle, WarningCircle, CircleNotch, BookOpen, CurrencyInr 
} from '@phosphor-icons/react';

export default function FuturesDesk() {
  const { futuresPositions, futuresContracts, isLoading } = useSandboxStore();
  const { loadFuturesContracts, loadFuturesPositions, placeFutureOrder, closePosition } = useSandboxStore(state => state.actions);

  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [action, setAction] = useState('BUY');
  const [lots, setLots] = useState(1);
  const [expiry, setExpiry] = useState('2026-07-30');

  // Feedback states
  const [txSuccess, setTxSuccess] = useState(null);
  const [txError, setTxError] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    loadFuturesContracts();
    loadFuturesPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeContract = futuresContracts.find(c => c.underlying === selectedUnderlying);

  const handleOrder = async () => {
    if (!activeContract) return;
    setTxError(null);
    setTxSuccess(null);
    setTxLoading(true);
    try {
      const res = await placeFutureOrder({
        underlying: selectedUnderlying,
        action,
        lots,
        expiry_date: expiry
      });
      setTxSuccess(res.message || `Futures order successfully executed.`);
      setLots(1);
      setTimeout(() => setTxSuccess(null), 5000);
    } catch (e) {
      setTxError(e.message || "Futures transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  const totalBlockedMargin = futuresPositions.reduce((acc, pos) => acc + pos.margin_required, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
      
      {/* LEFT: CONTRACTS BOARD & OPEN FUTURES POSITIONS */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* AVAILABLE CONTRACTS */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]/50 mb-4">
            <div>
              <span className="text-[9px] font-bold tracking-wider text-[var(--color-gold)] uppercase">Derivative Desk</span>
              <h3 className="font-cinzel text-[11px] font-bold tracking-[0.12em] text-[var(--color-text)] uppercase mt-0.5">Futures Contracts</h3>
            </div>
            
            {/* Total Blocked Margin Display */}
            {totalBlockedMargin > 0 && (
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-3 py-1.5 font-mono text-xs flex items-center gap-2">
                <span className="text-[var(--color-text-faint)]">Total Blocked Margin:</span>
                <span className="text-[var(--color-gold)] font-bold">₹{totalBlockedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-inter">
              <thead>
                <tr className="border-b border-[var(--color-border)]/50 pb-2 text-[var(--color-text-faint)] font-bold uppercase tracking-wider">
                  <th className="py-2.5 pl-2">Contract</th>
                  <th className="py-2.5">Lot Size</th>
                  <th className="py-2.5">Estimated Future Price</th>
                  <th className="py-2.5">Approx Margin Required (20%)</th>
                  <th className="py-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {futuresContracts.map(c => (
                  <tr 
                    key={c.underlying} 
                    className={`border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg)]/20 transition-all cursor-pointer ${selectedUnderlying === c.underlying ? 'bg-[rgba(200,179,142,0.04)]' : ''}`}
                    onClick={() => { setSelectedUnderlying(c.underlying); setTxError(null); setTxSuccess(null); }}
                  >
                    <td className="py-3 pl-2 font-cinzel font-bold text-[var(--color-text)]">
                      {c.underlying} FUT
                    </td>
                    <td className="py-3 font-mono text-[var(--color-text-muted)]">
                      {c.lot_size} shares/lot
                    </td>
                    <td className="py-3 font-mono text-[var(--color-text-muted)]">
                      ₹{c.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 font-mono text-[var(--color-text-muted)]">
                      ₹{c.margin_required.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedUnderlying(c.underlying); }}
                        className={`px-3 py-1 rounded-[3px] font-inter text-[10px] font-bold uppercase transition-all ${selectedUnderlying === c.underlying ? 'bg-[var(--color-gold)] text-black' : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVE FUTURES POSITIONS */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--color-border)]/50 mb-4">
            <ListDashes size={15} className="text-[var(--color-gold)]" />
            <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">Active Open Futures Positions</h3>
          </div>

          {futuresPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-faint)] tracking-wide">
              NO OPEN FUTURES POSITIONS. SELECT A CONTRACT TO INITIATE A TRADE.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-inter">
                <thead>
                  <tr className="border-b border-[var(--color-border)]/50 pb-2 text-[var(--color-text-faint)] font-bold uppercase tracking-wider">
                    <th className="py-2.5 pl-2">Contract</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Lots</th>
                    <th className="py-2.5">Avg Entry Price</th>
                    <th className="py-2.5">LTP Price</th>
                    <th className="py-2.5">Blocked Margin</th>
                    <th className="py-2.5 text-right">Simulated P&L</th>
                    <th className="py-2.5 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {futuresPositions.map(pos => {
                    const changePct = pos.avg_price > 0 ? (pos.unrealized_pnl / (pos.avg_price * pos.quantity)) * 100 : 0;
                    return (
                      <tr key={pos.id} className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg)]/20 transition-all font-inter text-xs">
                        <td className="py-3 pl-2 font-cinzel font-bold text-[var(--color-text)]">
                          {pos.underlying} FUT
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold tracking-wide uppercase ${pos.position_type === 'LONG' ? 'bg-[var(--color-gain)]/10 text-[var(--color-gain)] border border-[var(--color-gain)]/20' : 'bg-[var(--color-loss)]/10 text-[var(--color-loss)] border border-[var(--color-loss)]/20'}`}>
                            {pos.position_type}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-semibold text-[var(--color-text-muted)]">
                          {pos.lots}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{pos.avg_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{pos.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{pos.margin_required.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 text-right font-mono font-bold ${pos.unrealized_pnl >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                          {pos.unrealized_pnl >= 0 ? '+' : ''}₹{pos.unrealized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to square off your ${pos.underlying} Futures position?`)) {
                                try {
                                  await closePosition(pos.id, 'future');
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

      {/* RIGHT: FUTURES TRANSACTION PANEL & EXPLANATION BANNER */}
      <div className="flex flex-col gap-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 h-full relative">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--color-border)]/50 mb-5">
            <Tag size={15} className="text-[var(--color-gold)]" />
            <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">Futures Order Panel</h3>
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
              BUY / GO LONG
            </button>
            <button 
              onClick={() => setAction('SELL')} 
              className={`flex-1 py-2 rounded-[3px] font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer border ${action === 'SELL' ? 'bg-[var(--color-loss)] border-[var(--color-loss)] text-white font-extrabold' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
            >
              SELL / GO SHORT
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1.5">Selected Contract</label>
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono font-bold text-[var(--color-text)]">
                {selectedUnderlying ? `${selectedUnderlying} Futures Contract` : 'NONE'}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1.5">Lots to Trade</label>
              <input 
                type="number" 
                min="1"
                max="50"
                placeholder="Number of lots" 
                value={lots} 
                onChange={e => setLots(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
              />
              {activeContract && (
                <span className="text-[9px] text-[var(--color-text-faint)] block mt-1.5">
                  Total exposure: {lots * activeContract.lot_size} shares (Lot size: {activeContract.lot_size}x)
                </span>
              )}
            </div>

            {activeContract && (
              <div className="border-t border-b border-[var(--color-border)]/50 py-3.5 my-1 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-faint)]">Contract Size:</span>
                  <span className="text-[var(--color-text)] font-semibold">₹{(activeContract.current_price * activeContract.lot_size * lots).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-faint)]">Blocked Margin Required (20%):</span>
                  <span className="text-[var(--color-gold)] font-bold">₹{(activeContract.margin_required * lots).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <button 
              onClick={handleOrder} 
              disabled={txLoading || !activeContract}
              className={`w-full py-3 rounded-[3px] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-2 ${action === 'BUY' ? 'bg-[var(--color-gain)] text-black' : 'bg-[var(--color-loss)] text-white'} hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {txLoading ? <CircleNotch size={14} className="animate-spin" /> : `EXECUTE SIMULATED ${action}`}
            </button>
          </div>

          {/* EDUCATIONAL TIP */}
          <div className="bg-[rgba(200,179,142,0.03)] border border-[var(--color-border)] p-4 rounded-[4px] mt-6 flex gap-3 items-start">
            <BookOpen size={16} className="text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-[var(--color-text-faint)] leading-relaxed">
              <strong>Futures Leverage Tip</strong>: A 20% margin means you get 5x leverage. A 2% move in the underlying NIFTY index results in a 10% move on your blocked margin capital! Practice caution with large lot sizes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
