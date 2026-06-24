import React, { useState } from 'react';
import { X, Bell, Loader2 } from 'lucide-react';
import { theme } from '../lib/theme.js';

export default function PriceAlertModal({ ticker, currentPrice, onSave, onClose, loading = false }) {
  const [price, setPrice]       = useState('');
  const [direction, setDir]     = useState('above');
  const [note, setNote]         = useState('');
  const [error, setError]       = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!price || isNaN(+price) || +price <= 0) {
      setError('Enter a valid target price');
      return;
    }
    onSave({ ticker, target_price: parseFloat(price), direction, note });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1E3530] border border-[#2D3C37] rounded-[3px] w-full max-w-[360px] p-6 animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)] shadow-none">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#C8B38E]" />
            <h3 className="font-cinzel text-[14px] font-bold text-[#ECE0CC] mb-0 leading-none">Set alert — {ticker}</h3>
          </div>
          <button onClick={onClose} className="text-[#7B7C70] hover:text-[#ECE0CC] transition-colors p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {currentPrice && (
          <p className="m-0 mb-4 font-inter text-[13px] text-[#ACA492]">
            Current price: <strong className="text-[#ECE0CC] font-mono">
              &#8377;{Number(currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </strong>
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-0">Alert when price is</label>
            <div className="flex gap-2">
              {['above', 'below'].map((d) => (
                <button
                  key={d} type="button"
                  onClick={() => setDir(d)}
                  className={`flex-1 p-2 rounded-[3px] cursor-pointer font-inter text-[12px] font-semibold transition-all border ${
                    direction === d 
                      ? 'border-[#C8B38E] bg-[rgba(200,179,142,0.1)] text-[#C8B38E]' 
                      : 'border-[#2D3C37] bg-transparent text-[#7B7C70] hover:border-[#ACA492]'
                  }`}
                >{d.charAt(0).toUpperCase() + d.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-0">Target price (&#8377;) *</label>
            <input
              type="number" min="0" step="any"
              className={`bg-[#0A201F] border ${error ? 'border-[#B66A6A]' : 'border-[#2D3C37]'} rounded-[3px] px-3 py-2 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.35)] w-full`}
              value={price}
              onChange={(e) => { setPrice(e.target.value); setError(''); }}
              placeholder="e.g. 3000"
            />
            {error && <span className="text-[12px] text-[#B66A6A] font-inter">{error}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70] mb-0">Note (optional)</label>
            <input 
              className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-2 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.35)] w-full"
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Breakout level, resistance..." 
            />
          </div>
          <div className="flex gap-2.5 justify-end mt-2">
            <button type="button" onClick={onClose}
              className="border border-[#2D3C37] text-[#ACA492] font-inter text-[12px] rounded-[3px] px-4 py-2 hover:border-[rgba(200,179,142,0.3)] hover:text-[#ECE0CC] transition-colors cursor-pointer"
            >Cancel</button>
            <button type="submit" disabled={loading}
              className={`bg-[#C8B38E] text-[#0A201F] font-inter text-[12px] font-semibold rounded-[3px] px-4 py-2 hover:bg-[#b5a07e] transition-colors cursor-pointer flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
              {loading ? 'Setting...' : 'Set alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
