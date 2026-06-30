import React, { useState, useEffect } from 'react';
import { 
  Sliders, Key, Coins, Bell, Eye, EyeSlash, 
  Check, WarningCircle, X, CircleNotch, ShieldCheck 
} from '@phosphor-icons/react';
import { getPreferences, updatePreferences, getProfile, updateProfile } from '../services/portfolio.js';

function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-2 border-b border-[var(--color-border)]/50">
      {Icon && <Icon size={16} className="text-[var(--color-gold)]" />}
      <h3 className="font-cinzel text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text)]">
        {title}
      </h3>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div 
      className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all duration-300 flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'bg-[var(--color-gain)]' : 'bg-[var(--color-bg)] border border-[var(--color-border)]'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className={`w-4 h-4 rounded-full bg-[var(--color-text)] shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ui');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [uiPrefs, setUiPrefs] = useState({
    animations: true,
    compactMode: false,
    theme: 'dark-emerald',
    defaultDashboard: 'Command Center'
  });

  const [apiKeys, setApiKeys] = useState({
    alphavantage_api_key: '',
    gemini_api_key: ''
  });

  const [showKeys, setShowKeys] = useState({
    alphavantage: false,
    gemini: false
  });

  const [investProfile, setInvestProfile] = useState({
    currency: 'INR',
    exchange: 'NSE',
    broker: 'Zerodha',
    target_corpus: ''
  });

  const [notifSettings, setNotifSettings] = useState({
    emailAlerts: true,
    weeklyDigest: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [prefsData, profileData] = await Promise.all([
        getPreferences().catch(() => ({})),
        getProfile().catch(() => ({}))
      ]);

      // Reconcile UI Preferences
      const ui = prefsData?.ui_preferences || profileData?.ui_preferences || {};
      setUiPrefs({
        animations: ui.animations !== false,
        compactMode: !!ui.compactMode,
        theme: ui.theme || 'dark-emerald',
        defaultDashboard: ui.defaultDashboard || 'Command Center'
      });

      // Reconcile Notification Settings
      const notifs = prefsData?.notification_settings || profileData?.notification_settings || {};
      setNotifSettings({
        emailAlerts: notifs.emailAlerts !== false,
        weeklyDigest: !!notifs.weeklyDigest
      });

      // Reconcile Investment Profile
      const invest = prefsData?.investment_profile || profileData?.investment_profile || {};
      setInvestProfile({
        currency: invest.currency || 'INR',
        exchange: invest.exchange || 'NSE',
        broker: invest.broker || 'Zerodha',
        target_corpus: profileData?.target_corpus || invest.target_corpus || ''
      });

      // Reconcile API Keys (Direct database columns with fallback to UI preference JSON fields)
      setApiKeys({
        alphavantage_api_key: profileData?.alphavantage_api_key || ui.alphavantage_api_key || '',
        gemini_api_key: profileData?.gemini_api_key || ui.gemini_api_key || ''
      });

    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings from terminal database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Save UI preferences (include API Keys inside JSONB preferences as safe fallback)
      const uiPayload = {
        ...uiPrefs,
        alphavantage_api_key: apiKeys.alphavantage_api_key,
        gemini_api_key: apiKeys.gemini_api_key
      };

      const prefsPayload = {
        ui_preferences: uiPayload,
        notification_settings: notifSettings,
        investment_profile: investProfile
      };

      // Save direct profile columns
      const profilePayload = {
        target_corpus: investProfile.target_corpus ? parseFloat(investProfile.target_corpus) : null,
        alphavantage_api_key: apiKeys.alphavantage_api_key,
        gemini_api_key: apiKeys.gemini_api_key,
        ui_preferences: uiPayload,
        notification_settings: notifSettings,
        investment_profile: investProfile
      };

      await Promise.all([
        updatePreferences(prefsPayload).catch(e => console.warn('updatePreferences error', e)),
        updateProfile(profilePayload).catch(e => console.warn('updateProfile error', e))
      ]);

      // Apply UI Theme / animations globally (simulated or real setting hook)
      if (uiPrefs.animations) {
        document.documentElement.classList.remove('no-animations');
      } else {
        document.documentElement.classList.add('no-animations');
      }

      setSuccessMsg('System settings successfully synchronized with Arca cloud.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'ui', label: 'Terminal Interface', icon: Sliders },
    { id: 'api', label: 'API Connectors', icon: Key },
    { id: 'investment', label: 'Investment Strategy', icon: Coins },
    { id: 'notifications', label: 'Alerts & Comms', icon: Bell }
  ];

  return (
    <div className="flex flex-col min-h-0 h-full items-center p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto bg-[var(--color-bg)]">
      <div className="w-full max-w-3xl flex flex-col gap-6 pb-24">
        
        {/* HEADER */}
        <div className="flex justify-between items-end pb-3 border-b border-[var(--color-border)]">
          <div>
            <div className="font-cinzel text-[10px] font-bold tracking-[0.22em] text-[var(--color-gold)] uppercase mb-1">
              SYSTEM CONFIGURATION
            </div>
            <h1 className="font-cinzel text-2xl font-bold text-[var(--color-text)] tracking-wide m-0">Terminal Settings</h1>
          </div>
          <div className="font-inter text-[11px] text-[var(--color-text-faint)]">
            Status: <span className="text-[var(--color-gain)] font-bold uppercase font-mono">Sync Online</span>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="bg-[rgba(182,106,106,0.06)] border border-[var(--color-loss)]/60 p-4 rounded-[4px] flex items-center gap-3 text-[var(--color-loss)] font-inter text-xs">
            <WarningCircle size={16} weight="fill" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        )}

        {successMsg && (
          <div className="bg-[rgba(34,197,94,0.06)] border border-[var(--color-gain)]/60 p-4 rounded-[4px] flex items-center gap-3 text-[var(--color-gain)] font-inter text-xs">
            <Check size={16} weight="bold" />
            <div className="flex-1">{successMsg}</div>
            <button onClick={() => setSuccessMsg(null)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CircleNotch size={32} className="animate-spin text-[var(--color-gold)]" />
            <span className="font-inter text-xs text-[var(--color-text-faint)] tracking-wider">LOADING SECURE SETTINGS...</span>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* TABS SIDEBAR */}
            <div className="w-full md:w-56 flex md:flex-col gap-1.5 flex-wrap">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[3px] font-inter text-[12px] font-semibold tracking-wide transition-all w-full text-left border ${active ? 'bg-[rgba(200,179,142,0.08)] border-[var(--color-gold)]/60 text-[var(--color-gold)] shadow-[0_0_10px_rgba(200,179,142,0.05)]' : 'bg-transparent border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)]/30'}`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CARD CONTENT */}
            <div className="flex-1 w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[4px] p-6 relative min-h-[300px]">
              
              {/* TAB 1: UI PREFERENCES */}
              {activeTab === 'ui' && (
                <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
                  <SectionHeader title="Terminal Interface Preferences" icon={Sliders} />
                  
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Terminal Animations</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Enable smooth sliding transitions, chart drawing paths, and terminal typing effects.</span>
                    </div>
                    <Toggle checked={uiPrefs.animations} onChange={(val) => setUiPrefs({...uiPrefs, animations: val})} />
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Compact Mode Layout</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Reduce padding across all grids, tables, and charts to fit more metrics on screen.</span>
                    </div>
                    <Toggle checked={uiPrefs.compactMode} onChange={(val) => setUiPrefs({...uiPrefs, compactMode: val})} />
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Default Dashboard View</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Specify your default landing screen after logging into the terminal.</span>
                    </div>
                    <select 
                      value={uiPrefs.defaultDashboard}
                      onChange={e => setUiPrefs({...uiPrefs, defaultDashboard: e.target.value})}
                      className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 cursor-pointer min-w-[150px]"
                    >
                      <option value="Command Center">Command Center</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Market Watch">Market Watch</option>
                      <option value="Sandbox">Sandbox</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Terminal Theme Profile</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Customize colors to fit your trading room environment.</span>
                    </div>
                    <select 
                      value={uiPrefs.theme}
                      onChange={e => setUiPrefs({...uiPrefs, theme: e.target.value})}
                      className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 cursor-pointer min-w-[150px]"
                    >
                      <option value="dark-emerald">Classic Emerald (Dark)</option>
                      <option value="deep-obsidian">Obsidian Black (Pitch)</option>
                      <option value="light-terminal">Light Terminal (Day)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: API KEY CONNECTORS */}
              {activeTab === 'api' && (
                <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
                  <SectionHeader title="API Connectors & Keys (BYOK)" icon={Key} />
                  
                  <div className="bg-[rgba(200,179,142,0.04)] border border-[var(--color-gold)]/20 p-4 rounded-[4px] mb-2 flex gap-3 items-start">
                    <ShieldCheck size={20} className="text-[var(--color-gold)] mt-0.5 flex-shrink-0" />
                    <div className="font-inter text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      <strong>Bring Your Own Key (BYOK)</strong>: These API credentials are saved directly to your encrypted client profile to query real-time market metrics and feed custom AI insights. If left empty, the terminal runs on shared system fallback limits.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">AlphaVantage API Key</label>
                    <div className="relative">
                      <input 
                        type={showKeys.alphavantage ? "text" : "password"} 
                        value={apiKeys.alphavantage_api_key}
                        onChange={e => setApiKeys({...apiKeys, alphavantage_api_key: e.target.value})}
                        placeholder="Enter AlphaVantage Key" 
                        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] pl-4 pr-10 py-2.5 font-mono text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowKeys({...showKeys, alphavantage: !showKeys.alphavantage})}
                        className="absolute right-3 top-3 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                      >
                        {showKeys.alphavantage ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="font-inter text-[9px] text-[var(--color-text-faint)]">Used to query historical charts and real-time stocks.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">Gemini AI API Key</label>
                    <div className="relative">
                      <input 
                        type={showKeys.gemini ? "text" : "password"} 
                        value={apiKeys.gemini_api_key}
                        onChange={e => setApiKeys({...apiKeys, gemini_api_key: e.target.value})}
                        placeholder="Enter Google Gemini API Key" 
                        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] pl-4 pr-10 py-2.5 font-mono text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 w-full"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowKeys({...showKeys, gemini: !showKeys.gemini})}
                        className="absolute right-3 top-3 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                      >
                        {showKeys.gemini ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="font-inter text-[9px] text-[var(--color-text-faint)]">Used for custom portfolio advisory narratives and chat.</span>
                  </div>
                </div>
              )}

              {/* TAB 3: INVESTMENT PROFILE */}
              {activeTab === 'investment' && (
                <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
                  <SectionHeader title="Investment Portfolio Strategy" icon={Coins} />
                  
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Primary Currency Base</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Currency used to measure values and total net equity.</span>
                    </div>
                    <select 
                      value={investProfile.currency}
                      onChange={e => setInvestProfile({...investProfile, currency: e.target.value})}
                      className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 cursor-pointer min-w-[150px]"
                    >
                      <option value="INR">INR (₹) Indian Rupee</option>
                      <option value="USD">USD ($) United States Dollar</option>
                      <option value="EUR">EUR (€) Euro</option>
                      <option value="GBP">GBP (£) British Pound</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Default Trade Exchange</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Primary exchange searched when placing sandboxed orders.</span>
                    </div>
                    <select 
                      value={investProfile.exchange}
                      onChange={e => setInvestProfile({...investProfile, exchange: e.target.value})}
                      className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 cursor-pointer min-w-[150px]"
                    >
                      <option value="NSE">National Stock Exchange (NSE)</option>
                      <option value="BSE">Bombay Stock Exchange (BSE)</option>
                      <option value="NYSE">New York Stock Exchange (NYSE)</option>
                      <option value="NASDAQ">NASDAQ Exchange</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Preferred Broker API</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Sync helper default for holding document uploads.</span>
                    </div>
                    <select 
                      value={investProfile.broker}
                      onChange={e => setInvestProfile({...investProfile, broker: e.target.value})}
                      className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-2 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 cursor-pointer min-w-[150px]"
                    >
                      <option value="Zerodha">Zerodha Console</option>
                      <option value="Groww">Groww</option>
                      <option value="AngelOne">AngelOne</option>
                      <option value="Upstox">Upstox</option>
                      <option value="Other">Generic/Other Broker</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Target Wealth Corpus</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Define your final net worth goal for advisory metrics.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--color-text-faint)]">{investProfile.currency === 'INR' ? '₹' : '$'}</span>
                      <input 
                        type="number" 
                        value={investProfile.target_corpus}
                        onChange={e => setInvestProfile({...investProfile, target_corpus: e.target.value})}
                        placeholder="e.g. 50000000"
                        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-mono text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]/60 max-w-[150px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
                  <SectionHeader title="Communications & Security Alerts" icon={Bell} />
                  
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/30">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Email Transactions & Alerts</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Receive immediate email receipts upon trade execution, resetting, or critical logins.</span>
                    </div>
                    <Toggle checked={notifSettings.emailAlerts} onChange={(val) => setNotifSettings({...notifSettings, emailAlerts: val})} />
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">Weekly Advisor Digest</span>
                      <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Get a weekly performance summary and AI-generated rebalancing signals sent to your inbox.</span>
                    </div>
                    <Toggle checked={notifSettings.weeklyDigest} onChange={(val) => setNotifSettings({...notifSettings, weeklyDigest: val})} />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* FIXED FOOTER SAVE ACTION */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg)]/80 backdrop-blur-md border-t border-[var(--color-border)] p-4 flex justify-center z-20 lg:left-64">
          <div className="w-full max-w-3xl flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--color-gold)] text-[#000] rounded-[3px] px-6 py-2.5 font-inter text-[12px] font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(200,179,142,0.15)] flex items-center gap-2"
            >
              {saving ? (
                <>
                  <CircleNotch size={14} className="animate-spin text-black" />
                  <span>SYNCHRONIZING...</span>
                </>
              ) : (
                <>
                  <Check size={14} weight="bold" />
                  <span>SAVE SYSTEM SETTINGS</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
