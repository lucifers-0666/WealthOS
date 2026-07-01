import React, { useEffect, useState } from 'react';
import { useSandboxStore } from '../../../store/sandboxStore';
import { ListDashes, Clock, CircleNotch } from '@phosphor-icons/react';

export default function OrdersHistory() {
  const { orders, isLoading } = useSandboxStore();
  const { loadOrders } = useSandboxStore(state => state.actions);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'EQUITY') return o.order_type === 'EQUITY';
    if (filter === 'OPTION') return o.order_type === 'OPTION';
    if (filter === 'FUTURE') return o.order_type === 'FUTURE';
    if (filter === 'RESET') return o.order_type === 'RESET';
    return true;
  });

  const filterOptions = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'EQUITY', label: 'Equities' },
    { id: 'OPTION', label: 'Options' },
    { id: 'FUTURE', label: 'Futures' },
    { id: 'RESET', label: 'Resets' }
  ];

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[6px] p-5 font-inter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--color-border)]/50 mb-5">
        <div className="flex items-center gap-2">
          <ListDashes size={16} className="text-[var(--color-gold)]" />
          <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)]">
            Sandbox Transaction Ledger
          </h3>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map(opt => (
            <button 
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-2.5 py-1 rounded-[3px] font-inter text-[10px] font-semibold transition-all border ${filter === opt.id ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/50 text-[var(--color-gold)] shadow-[0_0_8px_rgba(200,179,142,0.05)]' : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && filteredOrders.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <CircleNotch size={24} className="animate-spin text-[var(--color-gold)]" />
          <span className="text-[11px] text-[var(--color-text-faint)] tracking-wider">RETRIEVING LEDGER DATA...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-faint)] tracking-wide">
          NO TRANSACTION RECORDS FOUND IN THIS FILTER.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]/50 pb-2 text-[var(--color-text-faint)] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 pl-2">Time</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Action</th>
                <th className="py-2.5">Asset Contract</th>
                <th className="py-2.5 text-right">Quantity</th>
                <th className="py-2.5 text-right">Price</th>
                <th className="py-2.5 text-right pr-2">Simulated P&L / Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const dateStr = new Date(order.executed_at).toLocaleString('en-IN', {
                  month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                return (
                  <tr key={order.id} className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg)]/20 transition-all font-mono text-[11px]">
                    <td className="py-3 pl-2 text-[var(--color-text-faint)] flex items-center gap-1.5">
                      <Clock size={11} className="text-[var(--color-text-faint)]" />
                      {dateStr}
                    </td>
                    <td className="py-3 font-inter text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider">
                      {order.order_type}
                    </td>
                    <td className={`py-3 font-inter text-[10px] font-bold ${order.action === 'BUY' ? 'text-[var(--color-gain)]' : order.action === 'SELL' ? 'text-[var(--color-loss)]' : 'text-[var(--color-gold)]'}`}>
                      {order.action}
                    </td>
                    <td className="py-3 font-inter font-semibold text-[var(--color-text)]">
                      {order.order_type === 'OPTION' ? (
                        <span>{order.ticker} {order.strike_price} {order.option_type}</span>
                      ) : order.order_type === 'FUTURE' ? (
                        <span>{order.ticker} FUT</span>
                      ) : (
                        <span>{order.ticker}</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-[var(--color-text-muted)]">
                      {order.order_type === 'OPTION' ? (
                        <span>{order.quantity / (order.lot_size || 50)} lot{order.quantity / (order.lot_size || 50) > 1 ? 's' : ''}</span>
                      ) : order.order_type === 'FUTURE' ? (
                        <span>{order.quantity / (order.contract_size || 50)} lot{order.quantity / (order.contract_size || 50) > 1 ? 's' : ''}</span>
                      ) : (
                        <span>{parseFloat(order.quantity).toFixed(0)}</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-[var(--color-text-muted)]">
                      ₹{parseFloat(order.price).toFixed(2)}
                    </td>
                    <td className="py-3 text-right pr-2 text-[var(--color-text)] font-semibold">
                      ₹{parseFloat(order.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
