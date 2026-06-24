import React, { useState } from 'react';

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[2px] h-3 bg-[#C8B38E]"></div>
      <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ACA492]">
        {title}
      </h3>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div 
      className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${checked ? 'bg-[#6FAE8D]' : 'bg-[#0A201F] border border-[#2D3C37]'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 rounded-full bg-[#ECE0CC] transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    animations: true,
    compactMode: false,
    darkMode: true,
    apiKey: '',
    geminiKey: '',
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Dummy save
  };

  return (
    <div className="flex flex-col min-h-0 h-full relative items-center p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col gap-6 pb-20">
        
        {/* 1. PAGE HEADER */}
        <div>
          <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide">System Settings</h1>
          <div className="font-inter text-[11px] text-[#7B7C70] mt-1">Application configuration and API keys</div>
        </div>

        {/* 3. SETTINGS SECTIONS: UI PREFERENCES */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_100ms_both]">
          <SectionHeader title="UI PREFERENCES" />
          
          <div className="flex flex-col mt-4">
            <div className="flex justify-between items-center py-4 border-b border-[rgba(45,60,55,0.55)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Terminal Animations</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Enable smooth layout transitions and typing effects</span>
              </div>
              <Toggle checked={settings.animations} onChange={() => toggleSetting('animations')} />
            </div>
            <div className="flex justify-between items-center py-4 border-b border-[rgba(45,60,55,0.55)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Compact Mode</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Reduce padding to fit more data on screen</span>
              </div>
              <Toggle checked={settings.compactMode} onChange={() => toggleSetting('compactMode')} />
            </div>
            <div className="flex justify-between items-center py-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Default Dashboard View</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Select the startup landing page</span>
              </div>
              <select className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.3)]">
                <option>Command Center</option>
                <option>Portfolio</option>
                <option>Analytics</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. SETTINGS SECTIONS: API INTEGRATIONS */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_200ms_both]">
          <SectionHeader title="API INTEGRATIONS" />
          
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col gap-2">
              <label className="font-inter text-[11px] uppercase tracking-wide text-[#ACA492]">AlphaVantage / Market Data API Key</label>
              <input 
                type="password" 
                value={settings.apiKey}
                onChange={e => setSettings(prev => ({...prev, apiKey: e.target.value}))}
                placeholder="Enter API key" 
                className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-4 py-2 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.3)] w-full"
              />
              <span className="font-inter text-[10px] text-[#7B7C70]">Used for fetching live stock prices and historical data.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-inter text-[11px] uppercase tracking-wide text-[#ACA492]">Gemini AI API Key</label>
              <input 
                type="password" 
                value={settings.geminiKey}
                onChange={e => setSettings(prev => ({...prev, geminiKey: e.target.value}))}
                placeholder="Enter Gemini API key" 
                className="bg-[#0A201F] border border-[#2D3C37] rounded-[3px] px-4 py-2 font-inter text-[12px] text-[#ECE0CC] outline-none focus:border-[rgba(200,179,142,0.3)] w-full"
              />
              <span className="font-inter text-[10px] text-[#7B7C70]">Required for AI Advisor and portfolio analysis features.</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. SAVE BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A201F] border-t border-[#2D3C37] p-4 flex justify-center z-10 lg:left-64">
        <div className="w-full max-w-2xl flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-[#C8B38E] text-[#0A201F] rounded-[3px] px-6 py-2.5 font-inter text-[12px] font-bold tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_rgba(200,179,142,0.15)]"
          >
            SAVE SETTINGS
          </button>
        </div>
      </div>

    </div>
  );
}
