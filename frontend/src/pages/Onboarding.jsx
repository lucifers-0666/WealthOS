import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A201F] flex items-center justify-center p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      <div className="w-full max-w-md bg-[#172923] border border-[#2D3C37] rounded-[3px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-[rgba(200,179,142,0.1)] border border-[#C8B38E] rounded-full flex items-center justify-center mb-4">
            <span className="font-cinzel text-xl font-bold text-[#C8B38E]">A</span>
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-[#ECE0CC] tracking-wide mb-2">ARCA</h1>
          <p className="font-inter text-[12px] text-[#7B7C70]">Initialize your wealth instance</p>
        </div>

        {/* STEPS */}
        <div className="w-full flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#6FAE8D] flex items-center justify-center flex-shrink-0">
              <Check size={14} className="text-[#0A201F]" />
            </div>
            <div className="font-inter text-[13px] text-[#ACA492]">Create Account</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-[#C8B38E] flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] text-[#C8B38E]">2</span>
            </div>
            <div className="font-inter text-[13px] text-[#ECE0CC] font-bold">Connect Broker</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-[#2D3C37] flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] text-[#7B7C70]">3</span>
            </div>
            <div className="font-inter text-[13px] text-[#7B7C70]">Sync Data</div>
          </div>
        </div>

        {/* INPUTS */}
        <div className="w-full flex flex-col gap-4 mb-8">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[10px] uppercase tracking-wide text-[#7B7C70]">Broker Integration</label>
            <select className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.3)] w-full">
              <option>Select Broker...</option>
              <option>Zerodha Kite</option>
              <option>Upstox</option>
              <option>Groww</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[10px] uppercase tracking-wide text-[#7B7C70]">API Key / Access Token</label>
            <input 
              type="password"
              placeholder="Enter secure token"
              className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.3)] w-full"
            />
          </div>
        </div>

        {/* CTA BUTTON */}
        <button 
          onClick={() => navigate('/app')}
          className="w-full bg-[#C8B38E] text-[#0A201F] rounded-[3px] px-6 py-3 font-inter text-[12px] font-bold tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_rgba(200,179,142,0.15)] mb-4"
        >
          INITIALIZE SYSTEM
        </button>

        <button 
          onClick={() => navigate('/app')}
          className="font-inter text-[11px] text-[#7B7C70] hover:text-[#ACA492] transition-colors"
        >
          Skip onboarding and enter dashboard
        </button>

      </div>
    </div>
  );
}
