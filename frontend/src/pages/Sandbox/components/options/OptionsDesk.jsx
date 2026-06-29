import React, { useState, useEffect } from 'react';
import { useSandboxStore } from '../../../../store/sandboxStore';

export default function OptionsDesk() {
  const { optionPositions, isLoading } = useSandboxStore();
  const { loadOptionChain, placeOptionOrder, loadOptionPositions } = useSandboxStore(state => state.actions);
  
  const [underlying, setUnderlying] = useState('NIFTY');
  const [expiry, setExpiry] = useState('2026-07-30'); // Dummy future date for testing
  const [chain, setChain] = useState([]);
  
  const [selectedStrike, setSelectedStrike] = useState(null);
  const [optionType, setOptionType] = useState('CE');
  const [action, setAction] = useState('BUY');
  const [lots, setLots] = useState(1);

  useEffect(() => {
    loadOptionPositions();
    fetchChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChain = async () => {
    const data = await loadOptionChain(underlying, expiry);
    setChain(data);
  };

  const handleOrder = async () => {
    if (!selectedStrike) return alert('Select a strike from the chain');
    try {
      await placeOptionOrder({
        underlying,
        action,
        option_type: optionType,
        strike_price: selectedStrike,
        expiry_date: expiry,
        lots
      });
      alert('Order Placed Successfully!');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <select value={underlying} onChange={e => setUnderlying(e.target.value)} style={{ padding: '8px', background: 'var(--color-background)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            <option value="FINNIFTY">FINNIFTY</option>
          </select>
          <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} style={{ padding: '8px', background: 'var(--color-background)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
          <button onClick={fetchChain} style={{ padding: '8px 16px', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Load Chain</button>
        </div>

        <h3 style={{ fontFamily: 'Cinzel', color: 'var(--color-text-primary)' }}>Option Chain</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter', textAlign: 'center' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--color-card)' }}>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                <th colSpan="3" style={{ borderRight: '1px solid var(--color-border)' }}>CALLS</th>
                <th>STRIKE</th>
                <th colSpan="3" style={{ borderLeft: '1px solid var(--color-border)' }}>PUTS</th>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                <th>Delta</th><th>OI</th><th style={{ borderRight: '1px solid var(--color-border)' }}>LTP</th>
                <th></th>
                <th style={{ borderLeft: '1px solid var(--color-border)' }}>LTP</th><th>OI</th><th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {chain.map(row => (
                <tr key={row.strike} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{row.ce.delta}</td>
                  <td>{row.ce.oi}</td>
                  <td style={{ borderRight: '1px solid var(--color-border)', color: 'var(--color-gain)', cursor: 'pointer' }} onClick={() => { setSelectedStrike(row.strike); setOptionType('CE'); }}>{row.ce.premium}</td>
                  
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 'bold', padding: '8px 0' }}>{row.strike}</td>
                  
                  <td style={{ borderLeft: '1px solid var(--color-border)', color: 'var(--color-loss)', cursor: 'pointer' }} onClick={() => { setSelectedStrike(row.strike); setOptionType('PE'); }}>{row.pe.premium}</td>
                  <td>{row.pe.oi}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{row.pe.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', height: 'fit-content' }}>
        <h3 style={{ fontFamily: 'Cinzel', color: 'var(--color-text-primary)', marginTop: 0 }}>Options Order</h3>
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Selected: <span style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>{selectedStrike ? `${underlying} ${selectedStrike} ${optionType}` : 'None'}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setAction('BUY')} style={{ flex: 1, padding: '8px', background: action === 'BUY' ? 'var(--color-gain)' : 'transparent', color: action === 'BUY' ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-gain)', borderRadius: '4px', cursor: 'pointer' }}>BUY</button>
          <button onClick={() => setAction('SELL')} style={{ flex: 1, padding: '8px', background: action === 'SELL' ? 'var(--color-loss)' : 'transparent', color: action === 'SELL' ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-loss)', borderRadius: '4px', cursor: 'pointer' }}>SELL</button>
        </div>
        
        <input 
          type="number" 
          placeholder="Lots" 
          value={lots} 
          onChange={e => setLots(Number(e.target.value))}
          style={{ width: '100%', padding: '8px', marginBottom: '16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '4px' }}
        />
        <button 
          onClick={handleOrder} 
          disabled={isLoading || !selectedStrike}
          style={{ width: '100%', padding: '12px', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (!selectedStrike || isLoading) ? 0.5 : 1 }}
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
