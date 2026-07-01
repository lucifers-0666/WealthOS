import React from 'react';
import { 
  BookOpen, ChartBar, Compass, Scales, 
  ShieldWarning, TrendUp, Info 
} from '@phosphor-icons/react';

export default function SandboxRulesHub() {
  const sections = [
    {
      title: "Order Types Explained",
      icon: Compass,
      points: [
        {
          label: "Market Order",
          desc: "Executes instantly at the current Last Traded Price (LTP). Best for high liquidity and immediate entry/exit."
        },
        {
          label: "Limit Order",
          desc: "Allows specifying a maximum buy or minimum sell price. The order executes only if the market price hits or betters your target."
        }
      ]
    },
    {
      title: "Options Desk (F&O) Basics",
      icon: TrendUp,
      points: [
        {
          label: "Call Option (CE)",
          desc: "Right to buy. Purchase when bullish. CE value increases as the underlying index or stock price climbs."
        },
        {
          label: "Put Option (PE)",
          desc: "Right to sell. Purchase when bearish. PE value increases as the underlying asset price drops."
        },
        {
          label: "Lot Multiplier",
          desc: "Options are traded in standard bundles. For example, buying 1 NIFTY lot represents 50 shares. Cost = Premium * Lots * 50."
        }
      ]
    },
    {
      title: "Futures & Margin Leverage",
      icon: ChartBar,
      points: [
        {
          label: "Short Selling",
          desc: "Futures allow you to place a SELL order first (Shorting) without owning the asset, profiting if prices decline, and BUYing later to cover."
        },
        {
          label: "Initial Margin",
          desc: "Instead of paying full contract value, you only block ~20% of the total value (margin) to hold index and stock futures positions."
        }
      ]
    },
    {
      title: "Trading Rules & Risk Control",
      icon: Scales,
      points: [
        {
          label: "Square-Off Times",
          desc: "In real Indian markets, intraday equity/F&O positions are auto-closed by brokers at 3:15 PM - 3:20 PM to prevent overnight risk."
        },
        {
          label: "Simulated Risk Warning",
          desc: "Paper trading helps build execution muscle, but does not capture the psychological stress or liquidity slippage of real capital."
        }
      ]
    }
  ];

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[8px] p-6 flex flex-col gap-6 font-inter h-full">
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]/60">
        <BookOpen className="text-[var(--color-gold)]" size={18} />
        <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.15em] text-[var(--color-text)]">
          Trader's Academy & Rules
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="flex flex-col gap-3 p-4.5 bg-[var(--color-bg)] border border-[var(--color-border)]/50 rounded-[4px] hover:border-[var(--color-gold)]/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-[var(--color-gold)]">
                <Icon size={16} />
                <h3 className="font-cinzel text-[11px] font-bold tracking-wider uppercase">{section.title}</h3>
              </div>
              
              <div className="flex flex-col gap-3.5 mt-2">
                {section.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]"></span>
                      {pt.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-faint)] leading-relaxed pl-2.5">
                      {pt.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 bg-[rgba(182,106,106,0.04)] border border-[var(--color-loss)]/20 p-4 rounded-[4px] flex gap-3 items-start">
        <ShieldWarning size={20} className="text-[var(--color-loss)] mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong>Risk Notice</strong>: Standard leverage in derivatives trading can wipe out initial margin capital rapidly. Practice risk management, set stop-losses, and verify contract lot values before stepping into live markets.
        </div>
      </div>
    </div>
  );
}
