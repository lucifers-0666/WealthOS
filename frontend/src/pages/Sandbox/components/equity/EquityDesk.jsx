import React, { useEffect } from 'react';
import { useSandboxStore } from '../../../../store/sandboxStore';

export default function EquityDesk() {
  const { holdings, orders, isLoading } = useSandboxStore();
  const { loadHoldings, loadOrders, placeEquityOrder } = useSandboxStore(state => state.actions);
  const [ticker, setTicker] = React.useState('');
  const [qty, setQty] = React.useState(1);
  const [action, setAction] = React.useState('BUY');

  useEffect(() => {
    loadHoldings();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrder = async () => {
    try {
      await placeEquityOrder(ticker, action, qty);
      setTicker('');
      setQty(1);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'Cinzel', color: 'var(--color-text-primary)' }}>Holdings</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              <th style={{ padding: '8px' }}>Ticker</th>
              <th>Qty</th>
              <th>Avg Price</th>
              <th>LTP</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                <td style={{ padding: '8px', fontFamily: 'Cinzel' }}>{h.ticker}</td>
                <td style={{ fontFamily: 'JetBrains Mono' }}>{h.quantity}</td>
                <td style={{ fontFamily: 'JetBrains Mono' }}>₹{h.avg_buy_price}</td>
                <td style={{ fontFamily: 'JetBrains Mono' }}>₹{h.current_price}</td>
                <td style={{ fontFamily: 'JetBrains Mono', color: h.unrealized_pnl >= 0 ? 'var(--color-gain)' : 'var(--color-loss)' }}>
                  {h.unrealized_pnl >= 0 ? '+' : '-'}₹{Math.abs(h.unrealized_pnl).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
        <h3 style={{ fontFamily: 'Cinzel', color: 'var(--color-text-primary)', marginTop: 0 }}>Order Panel</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setAction('BUY')} style={{ flex: 1, padding: '8px', background: action === 'BUY' ? 'var(--color-gain)' : 'transparent', color: action === 'BUY' ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-gain)', borderRadius: '4px', cursor: 'pointer' }}>BUY</button>
          <button onClick={() => setAction('SELL')} style={{ flex: 1, padding: '8px', background: action === 'SELL' ? 'var(--color-loss)' : 'transparent', color: action === 'SELL' ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-loss)', borderRadius: '4px', cursor: 'pointer' }}>SELL</button>
        </div>
        
        <input 
          placeholder="Ticker (e.g. RELIANCE)" 
          value={ticker} 
          onChange={e => setTicker(e.target.value.toUpperCase())}
          style={{ width: '100%', padding: '8px', marginBottom: '12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '4px' }}
        />
        <input 
          type="number" 
          placeholder="Quantity" 
          value={qty} 
          onChange={e => setQty(Number(e.target.value))}
          style={{ width: '100%', padding: '8px', marginBottom: '16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '4px' }}
        />
        <button 
          onClick={handleOrder} 
          disabled={isLoading || !ticker}
          style={{ width: '100%', padding: '12px', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isLoading ? 'Processing...' : 'Place Market Order'}
        </button>
      </div>
    </div>
  );
}
