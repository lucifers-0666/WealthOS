import React, { useState, useEffect } from 'react';
import { useSandboxStore } from '../../../store/sandboxStore';
import { 
  Flask, Play, Gear, ChartLineUp, CheckCircle, 
  TrendUp, WarningCircle, CircleNotch, Table, ListDashes 
} from '@phosphor-icons/react';

const ASSETS = [
  { id: "NIFTY", label: "Nifty 50 Index" },
  { id: "BANKNIFTY", label: "Bank Nifty Index" },
  { id: "RELIANCE", label: "Reliance Industries" },
  { id: "TCS", label: "Tata Consultancy Services" },
  { id: "INFY", label: "Infosys Limited" }
];

export default function StrategyLab() {
  const { strategies, backtestResults, isLoading } = useSandboxStore();
  const { loadStrategies, runBacktest } = useSandboxStore(state => state.actions);

  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [symbol, setSymbol] = useState("NIFTY");
  const [params, setParams] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadStrategies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default parameters when strategy changes
  useEffect(() => {
    if (strategies.length > 0) {
      const first = strategies[0];
      setSelectedStrategy(first);
      setParams(first.parameters);
    }
  }, [strategies]);

  const handleStrategyChange = (strategy) => {
    setSelectedStrategy(strategy);
    setParams(strategy.parameters);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleParamChange = (key, val) => {
    setParams(prev => ({
      ...prev,
      [key]: parseFloat(val) || val
    }));
  };

  const handleRunBacktest = async () => {
    if (!selectedStrategy) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await runBacktest(selectedStrategy.name, symbol, params);
      setSuccessMsg(`Backtest completed for ${selectedStrategy.name} on ${symbol}!`);
    } catch (e) {
      setErrorMsg(e.message || "Failed to execute backtest simulation.");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-inter text-[var(--color-text)]">
      {/* LEFT & CENTER PANEL: CONFIGURATION & METRICS */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        {/* SELECT STRATEGY CARD */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 flex flex-col gap-4">
          <div>
            <span className="text-[9px] font-bold tracking-wider text-[var(--color-gold)] uppercase flex items-center gap-1">
              <Flask size={10} /> Strategy Selection
            </span>
            <h3 className="font-cinzel text-[11px] font-bold tracking-[0.12em] uppercase mt-0.5">Choose Strategy</h3>
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {strategies.map((strat) => (
              <button
                key={strat.name}
                onClick={() => handleStrategyChange(strat)}
                className={`w-full text-left p-3 rounded-[3px] border transition-all text-xs flex flex-col gap-1 ${
                  selectedStrategy?.name === strat.name
                    ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/50 text-[var(--color-gold)]'
                    : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] text-[var(--color-text-muted)]'
                }`}
              >
                <span className="font-semibold font-cinzel tracking-wide">{strat.name}</span>
                <span className="text-[10px] text-[var(--color-text-faint)] leading-normal line-clamp-2">
                  {strat.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PARAMETERS CONFIGURATION */}
        {selectedStrategy && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 flex flex-col gap-4">
            <div>
              <span className="text-[9px] font-bold tracking-wider text-[var(--color-gold)] uppercase flex items-center gap-1">
                <Gear size={10} /> Parameters & Asset
              </span>
              <h3 className="font-cinzel text-[11px] font-bold tracking-[0.12em] uppercase mt-0.5">Customize Run</h3>
            </div>

            {/* Asset Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider">Trading Asset</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60"
              >
                {ASSETS.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Params */}
            <div className="flex flex-col gap-3 border-t border-[var(--color-border)]/50 pt-3">
              <label className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider">Strategy Tuning</label>
              {Object.keys(params).map((key) => (
                <div key={key} className="flex justify-between items-center gap-4 text-xs font-mono">
                  <span className="text-[var(--color-text-muted)] text-[11px]">{key.replace('_', ' ').toUpperCase()}</span>
                  <input
                    type="number"
                    step={params[key] % 1 === 0 ? "1" : "0.1"}
                    value={params[key]}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-2 py-1 w-20 text-center text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={isLoading}
              className="mt-2 w-full bg-[var(--color-gold)] hover:brightness-110 disabled:opacity-50 text-black py-2.5 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={14} className="animate-spin" />
                  <span>Simulating Backtest...</span>
                </>
              ) : (
                <>
                  <Play size={14} weight="fill" />
                  <span>Execute Backtest</span>
                </>
              )}
            </button>

            {successMsg && (
              <div className="bg-[rgba(90,172,130,0.06)] border border-[var(--color-gain)]/30 rounded-[3px] p-3 text-xs text-[var(--color-gain)] flex items-start gap-1.5">
                <CheckCircle size={14} className="mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-[rgba(182,106,106,0.06)] border border-[var(--color-loss)]/30 rounded-[3px] p-3 text-xs text-[var(--color-loss)] flex items-start gap-1.5">
                <WarningCircle size={14} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: BACKTEST PERFORMANCE RESULTS */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 flex-1 flex flex-col gap-5">
          <div>
            <span className="text-[9px] font-bold tracking-wider text-[var(--color-gold)] uppercase flex items-center gap-1">
              <ChartLineUp size={10} /> Performance Center
            </span>
            <h3 className="font-cinzel text-[11px] font-bold tracking-[0.12em] uppercase mt-0.5">Simulation Outcomes</h3>
          </div>

          {!backtestResults ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-xs text-[var(--color-text-faint)] max-w-sm mx-auto">
              <Flask size={32} className="text-[var(--color-border)] mb-3 animate-pulse" />
              <span>No simulation results in scope. Configure strategy parameters on the left and click <strong>Execute Backtest</strong> to simulate.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* METRICS HUD */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-[4px] text-center">
                  <div className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider mb-1">Total Return</div>
                  <div className={`font-mono text-lg font-bold ${backtestResults.total_return >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                    {backtestResults.total_return >= 0 ? '+' : ''}{backtestResults.total_return.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-[4px] text-center">
                  <div className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider mb-1">Win Rate</div>
                  <div className="font-mono text-lg font-bold text-[var(--color-text)]">
                    {backtestResults.win_rate.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-[4px] text-center">
                  <div className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider mb-1">Max Drawdown</div>
                  <div className="font-mono text-lg font-bold text-[var(--color-loss)]">
                    {backtestResults.max_drawdown.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* TRADES LOG */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--color-border)]/50">
                  <Table size={14} className="text-[var(--color-gold)]" />
                  <span className="font-cinzel text-[10px] font-bold uppercase tracking-wide">Historical Backtest Ledger</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-1">
                  {backtestResults.trades.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--color-text-faint)] font-mono">
                      NO TRADES TRIGGERED IN SELECTED WINDOW.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="text-[var(--color-text-faint)] font-bold uppercase text-[9px] border-b border-[var(--color-border)]/40 pb-2">
                          <th className="py-2 pl-2">Date</th>
                          <th className="py-2">Signal</th>
                          <th className="py-2 text-right">Price</th>
                          <th className="py-2 text-right">Realized Gain/Loss</th>
                          <th className="py-2 text-right pr-2">Simulated Equity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backtestResults.trades.map((t, idx) => (
                          <tr key={idx} className="border-b border-[var(--color-border)]/20 hover:bg-[var(--color-bg)]/20 transition-all text-[11px]">
                            <td className="py-2.5 pl-2 text-[var(--color-text-faint)]">{t.date}</td>
                            <td className={`py-2.5 font-bold ${t.type === 'BUY' ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                              {t.type}
                            </td>
                            <td className="py-2.5 text-right">₹{t.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className={`py-2.5 text-right font-bold ${t.pnl > 0 ? 'text-[var(--color-gain)]' : t.pnl < 0 ? 'text-[var(--color-loss)]' : 'text-[var(--color-text-faint)]'}`}>
                              {t.type === 'SELL' ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-2.5 text-right pr-2 text-[var(--color-text-muted)]">₹{t.capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
