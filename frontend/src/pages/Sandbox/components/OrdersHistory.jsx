import React, { useEffect } from 'react';
import { useSandboxStore } from '../../../store/sandboxStore';

export default function OrdersHistory() {
  const { orders, isLoading } = useSandboxStore();
  const { loadOrders } = useSandboxStore(state => state.actions);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ fontFamily: 'Cinzel', color: 'var(--color-text-primary)' }}>Order History</h3>
      {isLoading && orders.length === 0 ? (
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ color: 'var(--color-text-secondary)' }}>No orders found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <th style={{ padding: '8px' }}>Date</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Action</th>
              <th style={{ padding: '8px' }}>Ticker / Contract</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Qty/Lots</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Total Value</th>
              <th style={{ padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <td style={{ padding: '8px' }}>{new Date(order.executed_at).toLocaleString()}</td>
                <td style={{ padding: '8px' }}>{order.order_type}</td>
                <td style={{ padding: '8px', color: order.action === 'BUY' ? 'var(--color-gain)' : order.action === 'SELL' ? 'var(--color-loss)' : 'var(--color-text-primary)' }}>{order.action}</td>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>
                  {order.order_type === 'OPTION' ? `${order.ticker} ${order.strike_price} ${order.option_type}` : order.ticker}
                </td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{order.order_type === 'OPTION' ? `${order.quantity / (order.lot_size || 1)} lots` : order.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>₹{Number(order.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>₹{Number(order.total_value).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', background: order.status === 'EXECUTED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100,100,100,0.2)', color: order.status === 'EXECUTED' ? '#22c55e' : '#fff' }}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
