import React, { useEffect } from 'react';
import { useSandboxStore } from '../../../store/sandboxStore';
import { Trophy, ArrowClockwise, CircleNotch, Medal } from '@phosphor-icons/react';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useSandboxStore();
  const { loadLeaderboard } = useSandboxStore(state => state.actions);

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal size={18} weight="fill" className="text-[var(--color-gold)]" />;
    if (rank === 2) return <Medal size={18} weight="fill" className="text-gray-400" />;
    if (rank === 3) return <Medal size={18} weight="fill" className="text-[#CD7F32]" />;
    return <span className="font-mono font-bold text-xs text-[var(--color-text-faint)] w-[18px] text-center">{rank}</span>;
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 font-inter text-[var(--color-text)]">
      <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]/50 mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--color-gold)]" />
          <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider">
            Global Sandbox Leaderboard
          </h3>
        </div>

        <button
          onClick={loadLeaderboard}
          disabled={isLoading}
          className="bg-transparent hover:bg-[var(--color-border)]/20 border border-[var(--color-border)] px-3 py-1.5 rounded-[3px] text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? <CircleNotch size={12} className="animate-spin" /> : <ArrowClockwise size={12} />}
          <span>Refresh</span>
        </button>
      </div>

      {isLoading && leaderboard.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <CircleNotch size={28} className="animate-spin text-[var(--color-gold)]" />
          <span className="text-[11px] text-[var(--color-text-faint)] tracking-wider">RETRIEVING LEADERBOARD DATA...</span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-16 text-center text-xs text-[var(--color-text-faint)] tracking-wide">
          NO LEADERBOARD RANKS REGISTERED YET. PLACE YOUR FIRST SIMULATED TRADE TO ENTER!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]/50 pb-2 text-[var(--color-text-faint)] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 pl-2 w-14">Rank</th>
                <th className="py-3">Trader Name</th>
                <th className="py-3 text-right">Demo Money</th>
                <th className="py-3 text-right">Portfolio Value</th>
                <th className="py-3 text-right">Abs. Return</th>
                <th className="py-3 text-right">Return %</th>
                <th className="py-3 text-right pr-2">Trades Count</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user) => (
                <tr 
                  key={user.rank} 
                  className={`border-b border-[var(--color-border)]/20 hover:bg-[var(--color-bg)]/20 transition-all font-inter text-xs ${
                    user.rank <= 3 ? 'bg-[var(--color-gold)]/[0.01] font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 pl-2 flex items-center justify-start h-11">
                    {getRankBadge(user.rank)}
                  </td>
                  <td className="py-3.5 text-[var(--color-text)] font-cinzel font-bold">
                    {user.name}
                  </td>
                  <td className="py-3.5 text-right font-mono text-[var(--color-text-muted)]">
                    ₹{user.initial_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-right font-mono text-[var(--color-text)]">
                    ₹{user.portfolio_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3.5 text-right font-mono font-semibold ${user.total_pnl >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                    {user.total_pnl >= 0 ? '+' : ''}₹{user.total_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3.5 text-right font-mono font-bold ${user.return_percent >= 0 ? 'text-[var(--color-gain)]' : 'text-[var(--color-loss)]'}`}>
                    {user.return_percent >= 0 ? '+' : ''}{user.return_percent.toFixed(2)}%
                  </td>
                  <td className="py-3.5 text-right font-mono pr-2 text-[var(--color-text-faint)]">
                    {user.trades_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
