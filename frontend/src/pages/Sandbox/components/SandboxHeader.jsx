import React from 'react';
import { useSandboxStore } from '../../../store/sandboxStore';
import { Wallet, Info, ArrowCounterClockwise } from '@phosphor-icons/react';

export default function SandboxHeader() {
  const { wallet, isLoading } = useSandboxStore();
  const { resetSandbox } = useSandboxStore(state => state.actions);

  return (
    <div className="sandbox-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
      <div>
        <h1 style={{ fontFamily: 'Cinzel', fontSize: '24px', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ARCA Sandbox
          <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'rgba(200, 179, 142, 0.1)', color: 'var(--color-gold)', borderRadius: '4px', fontFamily: 'Inter', fontWeight: 500 }}>BETA</span>
        </h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'Inter' }}>
          Paper trading environment. Real market data, zero real risk.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wallet size={14} /> Available Margin
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '24px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid var(--color-border)', paddingLeft: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={14} /> Total P&L
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '18px', fontWeight: 600, color: wallet.total_pnl >= 0 ? 'var(--color-gain)' : 'var(--color-loss)' }}>
            {wallet.total_pnl >= 0 ? '+' : '-'}₹{Math.abs(wallet.total_pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            <span style={{ fontSize: '14px', marginLeft: '8px', fontWeight: 500 }}>
              ({wallet.total_pnl >= 0 ? '+' : ''}{wallet.total_pnl_percent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <button 
          onClick={resetSandbox} 
          disabled={isLoading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'transparent', border: '1px solid var(--color-border)', 
            padding: '8px 16px', borderRadius: '8px', color: 'var(--color-text-primary)',
            cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', marginLeft: '12px',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <ArrowCounterClockwise size={16} /> Reset
        </button>
      </div>
    </div>
  );
}
