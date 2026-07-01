import React from 'react';
import { useSandboxStore } from '../../../store/sandboxStore';
import { Wallet, Info, ArrowCounterClockwise, WarningCircle, ShieldCheck } from '@phosphor-icons/react';

export default function SandboxHeader() {
  const { wallet, isLoading } = useSandboxStore();
  const { resetSandbox } = useSandboxStore(state => state.actions);

  return (
    <div className="flex flex-col gap-4">
      {/* DEMO NOTICE BANNER */}
      <div className="bg-[rgba(200,179,142,0.06)] border border-[var(--color-gold)]/30 rounded-[6px] p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-[rgba(200,179,142,0.1)] text-[var(--color-gold)] mt-0.5 sm:mt-0">
            <WarningCircle size={20} weight="fill" />
          </div>
          <div>
            <div className="font-cinzel text-xs font-bold tracking-wider text-[var(--color-gold)] uppercase">
              Simulated Learning Environment
            </div>
            <p className="font-inter text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed max-w-2xl">
              You are currently trading in the <strong>ARCA Paper Trading Sandbox</strong>. All balances represent simulated play money. No actual funds, brokerage commissions, or regulatory transaction fees are charged. Market rates are fetched live from yfinance.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[var(--color-gain)]/10 border border-[var(--color-gain)]/30 text-[var(--color-gain)] font-mono text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
          <ShieldCheck size={14} weight="bold" /> Zero Risk Mode
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--color-card)] p-6 rounded-[8px] border border-[var(--color-border)] gap-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-[var(--color-text)] tracking-wide m-0 flex items-center gap-2">
            ARCA Sandbox Desk
            <span className="text-[10px] px-2 py-0.5 bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20 rounded-[3px] font-inter font-bold tracking-wider">PRACTICE</span>
          </h1>
          <p className="font-inter text-xs text-[var(--color-text-faint)] mt-1.5">
            Test intraday, options, and futures strategies using live Indian stock prices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:gap-8 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex flex-col items-end">
            <div className="text-[11px] text-[var(--color-text-faint)] font-inter font-medium flex items-center gap-1.5 mb-1.5">
              <Wallet size={13} className="text-[var(--color-text-muted)]" /> Available Margin
            </div>
            <div className="font-mono text-xl font-bold text-[var(--color-text)]">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="flex flex-col items-end border-l border-[var(--color-border)] pl-6 md:pl-8">
            <div className="text-[11px] text-[var(--color-text-faint)] font-inter font-medium flex items-center gap-1.5 mb-1.5">
              <Info size={13} className="text-[var(--color-text-muted)]" /> Simulated Realized P&L
            </div>
            <div className={`font-mono text-xl font-bold ${(wallet?.realized_pnl ?? 0) >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
              {(wallet?.realized_pnl ?? 0) >= 0 ? '+' : ''}₹{(wallet?.realized_pnl ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <button 
            onClick={resetSandbox} 
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-transparent border border-[var(--color-border)] hover:border-[var(--color-loss)]/60 hover:text-[var(--color-loss)] px-4.5 py-2.5 rounded-[4px] font-inter text-[12px] text-[var(--color-text)] font-semibold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowCounterClockwise size={15} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
