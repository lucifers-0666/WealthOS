import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      <div className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-[rgba(200,179,142,0.1)] border border-[var(--color-gold)] rounded-full flex items-center justify-center mb-4">
            <span className="font-cinzel text-xl font-bold text-[var(--color-gold)]">A</span>
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-[var(--color-text)] tracking-wide mb-2">ARCA</h1>
          <p className="font-inter text-[12px] text-[var(--color-text-faint)]">Initialize your wealth instance</p>
        </div>

        {/* STEPS */}
        <div className="w-full flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-gain)] flex items-center justify-center flex-shrink-0">
              <Check size={14} className="text-[var(--color-bg)]" />
            </div>
            <div className="font-inter text-[13px] text-[var(--color-text-muted)]">Create Account</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-[var(--color-gold)] flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] text-[var(--color-gold)]">2</span>
            </div>
            <div className="font-inter text-[13px] text-[var(--color-text)] font-bold">Connect Broker</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] text-[var(--color-text-faint)]">3</span>
            </div>
            <div className="font-inter text-[13px] text-[var(--color-text-faint)]">Sync Data</div>
          </div>
        </div>

        {/* INPUTS */}
        <div className="w-full flex flex-col gap-4 mb-8">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[10px] uppercase tracking-wide text-[var(--color-text-faint)]">Broker Integration</label>
            <select className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.3)] w-full">
              <option>Select Broker...</option>
              <option>Zerodha Kite</option>
              <option>Upstox</option>
              <option>Groww</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[10px] uppercase tracking-wide text-[var(--color-text-faint)]">API Key / Access Token</label>
            <input 
              type="password"
              placeholder="Enter secure token"
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.3)] w-full"
            />
          </div>
        </div>

        {/* CTA BUTTON */}
        <button 
          onClick={() => navigate('/app')}
          className="w-full bg-[var(--color-gold)] text-[var(--color-bg)] rounded-[3px] px-6 py-3 font-inter text-[12px] font-bold tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_rgba(200,179,142,0.15)] mb-4"
        >
          INITIALIZE SYSTEM
        </button>

        <button 
          onClick={() => navigate('/app')}
          className="font-inter text-[11px] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
        >
          Skip onboarding and enter dashboard
        </button>

      </div>
    </div>
  );
}
