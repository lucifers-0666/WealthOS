import React, { useState, useEffect } from 'react';
import { useSandboxStore } from '../../../../store/sandboxStore';
import { getSandboxPrice } from '../../../../services/sandbox';
import { 
  ArrowUpRight, ArrowDownRight, Tag, ListDashes, 
  CheckCircle, WarningCircle, CircleNotch, BookOpen, Info 
} from '@phosphor-icons/react';

const INDEX_TICKERS = {
  "NIFTY": "^NSEI",
  "BANKNIFTY": "^NSEBANK",
  "FINNIFTY": "NIFTY_FIN_SERVICE.NS"
};

export default function OptionsDesk() {
  const { optionPositions, isLoading } = useSandboxStore();
  const { loadOptionChain, placeOptionOrder, loadOptionPositions, closePosition } = useSandboxStore(state => state.actions);
  
  const [underlying, setUnderlying] = useState('NIFTY');
  const [expiry, setExpiry] = useState('2026-07-30'); // Simulated standard monthly expiry
  const [chain, setChain] = useState([]);
  const [spotPrice, setSpotPrice] = useState(null);
  
  // Selection
  const [selectedStrike, setSelectedStrike] = useState(null);
  const [optionType, setOptionType] = useState('CE');
  const [action, setAction] = useState('BUY');
  const [lots, setLots] = useState(1);

  // Feedback states
  const [txSuccess, setTxSuccess] = useState(null);
  const [txError, setTxError] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    loadOptionPositions();
    fetchChainAndSpot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underlying]);

  const fetchChainAndSpot = async () => {
    // 1. Fetch chain
    const chainData = await loadOptionChain(underlying, expiry);
    setChain(chainData);

    // 2. Fetch Index Spot price
    try {
      const ticker = INDEX_TICKERS[underlying];
      const data = await getSandboxPrice(ticker);
      if (data && data.price) {
        setSpotPrice(data.price);
      }
    } catch (e) {
      console.warn("Failed to fetch spot index price", e);
    }
  };

  const handleSelectOption = (strike, type) => {
    setSelectedStrike(strike);
    setOptionType(type);
    setTxError(null);
    setTxSuccess(null);
  };

  const handleOrder = async () => {
    if (!selectedStrike) return;
    setTxError(null);
    setTxSuccess(null);
    setTxLoading(true);
    try {
      const res = await placeOptionOrder({
        underlying,
        action,
        option_type: optionType,
        strike_price: selectedStrike,
        expiry_date: expiry,
        lots
      });
      setTxSuccess(res.message || `Option order successfully executed.`);
      setSelectedStrike(null);
      setLots(1);
      fetchChainAndSpot(); // refresh position
      setTimeout(() => setTxSuccess(null), 5000);
    } catch (e) {
      setTxError(e.message || "Option transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  const lotMultiplier = underlying === 'BANKNIFTY' ? 15 : 50;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
      
      {/* LEFT: OPTION CHAIN BOARD & ACTIVE OPEN POSITIONS */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* OPTION CHAIN CONFIG & GRID */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--color-border)]/50 mb-4">
            <div>
              <span className="text-[9px] font-bold tracking-wider text-[var(--color-gold)] uppercase">Derivative Desk</span>
              <h3 className="font-cinzel text-[11px] font-bold tracking-[0.12em] text-[var(--color-text)] uppercase mt-0.5">Option Chain Terminal</h3>
            </div>
            
            {/* Spot Price Display */}
            {spotPrice && (
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-3 py-1.5 font-mono text-xs flex items-center gap-2">
                <span className="text-[var(--color-text-faint)]">{underlying} Index Spot:</span>
                <span className="text-[var(--color-text)] font-bold">₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1">Underlying Index</label>
              <select 
                value={underlying} 
                onChange={e => setUnderlying(e.target.value)} 
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 cursor-pointer w-full"
              >
                <option value="NIFTY">NIFTY 50 (Lot Size: 50)</option>
                <option value="BANKNIFTY">BANK NIFTY (Lot Size: 15)</option>
                <option value="FINNIFTY">NIFTY FINANCIAL (Lot Size: 50)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1">Contract Expiry</label>
              <input 
                type="date" 
                value={expiry} 
                onChange={e => setExpiry(e.target.value)} 
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
              />
            </div>
            <button 
              onClick={fetchChainAndSpot} 
              className="bg-[var(--color-gold)] hover:brightness-110 text-black px-5 py-2 rounded-[3px] text-xs font-semibold self-end transition-all flex items-center gap-1.5"
            >
              Reload Chain
            </button>
          </div>

          {/* GRID HEADERS */}
          <div className="max-h-[360px] overflow-y-auto border border-[var(--color-border)] rounded">
            <table className="w-full border-collapse text-xs font-inter text-center">
              <thead className="sticky top-0 bg-[var(--color-card)] z-10 shadow-[0_1px_0_var(--color-border)]">
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-faint)] font-bold uppercase text-[10px]">
                  <th colSpan="3" className="py-2 border-r border-[var(--color-border)] bg-[rgba(34,197,94,0.02)]">CALL OPTIONS (CE)</th>
                  <th className="py-2 bg-[var(--color-bg)]">STRIKE</th>
                  <th colSpan="3" className="py-2 border-l border-[var(--color-border)] bg-[rgba(239,68,68,0.02)]">PUT OPTIONS (PE)</th>
                </tr>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-faint)] font-semibold text-[9px] tracking-wider uppercase">
                  <th className="py-1.5 bg-[rgba(34,197,94,0.02)]">Delta</th>
                  <th className="py-1.5 bg-[rgba(34,197,94,0.02)]">OI</th>
                  <th className="py-1.5 border-r border-[var(--color-border)] bg-[rgba(34,197,94,0.04)] text-[var(--color-gain)]">Call LTP</th>
                  <th className="py-1.5 bg-[var(--color-bg)] text-[var(--color-gold)]">Strike</th>
                  <th className="py-1.5 border-l border-[var(--color-border)] bg-[rgba(239,68,68,0.04)] text-[var(--color-loss)]">Put LTP</th>
                  <th className="py-1.5 bg-[rgba(239,68,68,0.02)]">OI</th>
                  <th className="py-1.5 bg-[rgba(239,68,68,0.02)]">Delta</th>
                </tr>
              </thead>
              <tbody>
                {chain.map(row => {
                  const isATM = spotPrice && Math.abs(row.strike - spotPrice) <= 50;
                  return (
                    <tr 
                      key={row.strike} 
                      className={`border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg)]/20 transition-all font-mono text-[11px] ${isATM ? 'bg-[var(--color-gold)]/5' : ''}`}
                    >
                      <td className="py-2 text-[var(--color-text-faint)]">{row.ce.delta.toFixed(2)}</td>
                      <td className="py-2 text-[var(--color-text-muted)]">{(row.ce.oi / 1000).toFixed(0)}k</td>
                      <td 
                        onClick={() => handleSelectOption(row.strike, 'CE')}
                        className={`py-2 border-r border-[var(--color-border)] text-[var(--color-gain)] font-bold cursor-pointer hover:bg-[var(--color-gain)]/10 transition-all ${selectedStrike === row.strike && optionType === 'CE' ? 'bg-[var(--color-gain)]/20 border border-[var(--color-gain)]' : ''}`}
                      >
                        ₹{row.ce.premium.toFixed(2)}
                      </td>
                      
                      <td className="py-2 bg-[var(--color-bg)]/40 font-inter font-bold text-[var(--color-text)]">
                        {row.strike}
                      </td>
                      
                      <td 
                        onClick={() => handleSelectOption(row.strike, 'PE')}
                        className={`py-2 border-l border-[var(--color-border)] text-[var(--color-loss)] font-bold cursor-pointer hover:bg-[var(--color-loss)]/10 transition-all ${selectedStrike === row.strike && optionType === 'PE' ? 'bg-[var(--color-loss)]/20 border border-[var(--color-loss)]' : ''}`}
                      >
                        ₹{row.pe.premium.toFixed(2)}
                      </td>
                      <td className="py-2 text-[var(--color-text-muted)]">{(row.pe.oi / 1000).toFixed(0)}k</td>
                      <td className="py-2 text-[var(--color-text-faint)]">{row.pe.delta.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVE OPTIONS CONTRACTS */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--color-border)]/50 mb-4">
            <ListDashes size={15} className="text-[var(--color-gold)]" />
            <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">Active Open Option Positions</h3>
          </div>

          {optionPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-faint)] tracking-wide">
              NO OPEN DERIVATIVE POSITIONS. SELECT AN LTP IN CHAIN TO TRADE.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-inter">
                <thead>
                  <tr className="border-b border-[var(--color-border)]/50 pb-2 text-[var(--color-text-faint)] font-bold uppercase tracking-wider">
                    <th className="py-2.5 pl-2">Contract</th>
                    <th className="py-2.5">Lots</th>
                    <th className="py-2.5">Avg Premium</th>
                    <th className="py-2.5">LTP Premium</th>
                    <th className="py-2.5 text-right">Simulated P&L</th>
                    <th className="py-2.5 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {optionPositions.map(pos => {
                    const lSize = pos.lot_size;
                    const diff = pos.current_premium - pos.avg_premium;
                    const changePct = pos.avg_premium > 0 ? (diff / pos.avg_premium) * 100 : 0;
                    return (
                      <tr key={pos.id} className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg)]/20 transition-all">
                        <td className="py-3 pl-2 font-cinzel font-bold text-[var(--color-text)]">
                          {pos.underlying} {pos.strike_price} {pos.option_type} ({pos.expiry_date})
                        </td>
                        <td className="py-3 font-mono font-semibold text-[var(--color-text-muted)]">
                          {pos.lots_held}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{parseFloat(pos.avg_premium).toFixed(2)}
                        </td>
                        <td className="py-3 font-mono text-[var(--color-text-muted)]">
                          ₹{parseFloat(pos.current_premium || pos.avg_premium).toFixed(2)}
                        </td>
                        <td className={`py-3 text-right font-mono font-bold ${pos.unrealized_pnl >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                          {pos.unrealized_pnl >= 0 ? '+' : ''}₹{pos.unrealized_pnl.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to square off ${pos.underlying} ${pos.strike_price} ${pos.option_type}?`)) {
                                try {
                                  await closePosition(pos.id, 'option');
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

      {/* RIGHT: OPTIONS TRANSACTION PANEL & GREEKS BRIEFING */}
      <div className="flex flex-col gap-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 h-full relative">
          <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--color-border)]/50 mb-5">
            <Tag size={15} className="text-[var(--color-gold)]" />
            <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">Options Order Panel</h3>
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
              SELL / CLOSE
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1.5">Inspected Option Contract</label>
              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono font-bold text-[var(--color-text)]">
                {selectedStrike ? `${underlying} ${selectedStrike} ${optionType}` : 'NONE (Select in chain)'}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1.5">Order Quantity (Lots)</label>
              <input 
                type="number" 
                min="1"
                max="50"
                placeholder="Number of lots" 
                value={lots} 
                onChange={e => setLots(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
              />
              <span className="text-[9px] text-[var(--color-text-faint)] block mt-1.5">
                Total shares: {lots * lotMultiplier} (Multiplier: {lotMultiplier}x per lot)
              </span>
            </div>

            {selectedStrike && chain.length > 0 && (
              <div className="border-t border-b border-[var(--color-border)]/50 py-3.5 my-1 flex flex-col gap-2 font-mono text-[11px]">
                {(() => {
                  const row = chain.find(r => r.strike === selectedStrike);
                  const opt = row ? (optionType === 'CE' ? row.ce : row.pe) : null;
                  if (!opt) return null;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-faint)]">Premium LTP:</span>
                        <span className="text-[var(--color-text)] font-semibold">₹{opt.premium.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-faint)]">Est. Trade Margin:</span>
                        <span className="text-[var(--color-text)] font-bold">₹{(opt.premium * lots * lotMultiplier).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <button 
              onClick={handleOrder} 
              disabled={txLoading || !selectedStrike}
              className={`w-full py-3 rounded-[3px] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-2 ${action === 'BUY' ? 'bg-[var(--color-gain)] text-black' : 'bg-[var(--color-loss)] text-white'} hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {txLoading ? <CircleNotch size={14} className="animate-spin" /> : `EXECUTE SIMULATED ${action}`}
            </button>
          </div>

          {/* EDUCATIONAL TIP */}
          <div className="bg-[rgba(200,179,142,0.03)] border border-[var(--color-border)] p-4 rounded-[4px] mt-6 flex gap-3 items-start">
            <BookOpen size={16} className="text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-[var(--color-text-faint)] leading-relaxed">
              <strong>Options Greeks Tip</strong>: <em>Delta</em> measures the sensitivity of the option price to spot index changes. Deep in-the-money options have a Delta closer to 1.0 (Call) or -1.0 (Put), moving point-for-point with the index.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
