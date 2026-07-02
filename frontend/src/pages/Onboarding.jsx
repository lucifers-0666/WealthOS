import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldAlert, Sparkles, Loader2, ArrowRight, ShieldCheck, Upload } from 'lucide-react';
import { request } from '../services/api.js';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [broker, setBroker] = useState('');
  
  // Credentials state
  const [creds, setCreds] = useState({
    api_key: '',
    api_secret: '',
    request_token: '',
    client_id: '',
    client_secret: '',
    redirect_code: ''
  });

  const [csvFile, setCsvFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [error, setError] = useState(null);

  // Sync state parameters
  const [syncProgress, setSyncProgress] = useState(0);

  const handleInputChange = (field, val) => {
    setCreds(prev => ({ ...prev, [field]: val }));
  };

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);

    try {
      let payload = {};
      if (broker === 'zerodha') {
        payload = {
          api_key: creds.api_key.trim(),
          api_secret: creds.api_secret.trim(),
          request_token: creds.request_token.trim()
        };
      } else if (broker === 'upstox') {
        payload = {
          client_id: creds.client_id.trim(),
          client_secret: creds.client_secret.trim(),
          redirect_code: creds.redirect_code.trim()
        };
      } else if (broker === 'manual') {
        payload = {}; // instant verify
      }

      const res = await request('POST', '/api/broker/verify', {
        broker,
        credentials: payload
      });

      if (res.valid) {
        setBrokerVerified(true);
        setAccountInfo({
          broker_name: res.broker_name || broker,
          account_id: res.account_id || 'LOCAL-USER'
        });
        setStep(3);
      } else {
        setError(res.error || 'Connection verification failed.');
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Check your API parameters.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 3 holdings sync sequence
  useEffect(() => {
    if (step === 3 && brokerVerified) {
      let progressInterval;
      async function startSync() {
        setSyncing(true);
        progressInterval = setInterval(() => {
          setSyncProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 15;
          });
        }, 300);

        try {
          // If Manual CSV selected, upload the file if present
          if (broker === 'manual' && csvFile) {
            const formData = new FormData();
            formData.append('file', csvFile);
            const token = localStorage.getItem('token') || '';
            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/holdings-csv`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });
            if (!uploadRes.ok) throw new Error('CSV upload failed.');
          }

          // Trigger general broker/csv holdings database sync
          await request('POST', '/api/broker/sync', { broker });
          
          setSyncProgress(100);
          setTimeout(() => {
            localStorage.setItem('broker_verified', 'true');
            navigate('/dashboard');
          }, 800);
        } catch (err) {
          setError(err.message || 'Holdings sync failed.');
          setStep(2); // Fallback to credentials review
        } finally {
          clearInterval(progressInterval);
          setSyncing(false);
        }
      }
      startSync();
      return () => clearInterval(progressInterval);
    }
  }, [step, brokerVerified]);

  const handleSkip = () => {
    localStorage.setItem('broker_verified', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      <div className="w-full max-w-lg bg-[var(--color-card)] border border-[var(--color-border)] rounded-[4px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-8 text-center shrink-0">
          <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-full flex items-center justify-center mb-4">
            <span className="font-cinzel text-xl font-bold text-[var(--color-gold)]">A</span>
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-[var(--color-text)] tracking-wide mb-1.5">ARCA</h1>
          <p className="font-inter text-[11px] text-[var(--color-text-faint)]">Wealth Engine Integration Terminal</p>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="flex justify-between items-center mb-8 px-4 relative shrink-0">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[var(--color-border)] -translate-y-1/2 z-0"></div>
          {[1, 2, 3].map((num) => {
            const isDone = step > num || (num === 3 && brokerVerified && syncProgress === 100);
            const isActive = step === num;
            return (
              <div 
                key={num} 
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-[12px] font-bold z-10 transition-all ${
                  isDone 
                    ? 'bg-[var(--color-gain)] border-[var(--color-gain)] text-[var(--color-bg)]' 
                    : isActive 
                      ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-[var(--color-bg)]' 
                      : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-faint)]'
                }`}
              >
                {isDone ? <Check size={14} /> : num}
              </div>
            );
          })}
        </div>

        {/* STEP CONTROLLERS */}
        <div className="flex-1 min-h-[220px] flex flex-col justify-center">
          
          {/* STEP 1: BROKER SELECT */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-[fadeSlideUp_0.3s_ease-out]">
              <div className="flex flex-col gap-1.5">
                <label className="font-cinzel text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Step 1 — Connect Trading Broker</label>
                <select 
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-3 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full cursor-pointer"
                >
                  <option value="">Select Integrated Broker...</option>
                  <option value="zerodha">Zerodha Kite Connect</option>
                  <option value="upstox">Upstox OAuth2 SDK</option>
                  <option value="manual">Manual Ledger (CSV upload)</option>
                </select>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!broker}
                className="w-full bg-[var(--color-gold)] text-[var(--color-bg)] rounded-[3px] py-3.5 mt-4 font-inter text-[12px] font-bold tracking-wider hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Configure Credentials <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2: CREDENTIALS */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-[fadeSlideUp_0.3s_ease-out]">
              <div className="font-cinzel text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] mb-1">
                Step 2 — {broker === 'manual' ? 'Upload Trade Ledger' : 'Broker API Authorization'}
              </div>

              {broker === 'zerodha' && (
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="Kite API Key"
                    value={creds.api_key}
                    onChange={(e) => handleInputChange('api_key', e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full"
                  />
                  <input 
                    type="password" 
                    placeholder="Kite API Secret"
                    value={creds.api_secret}
                    onChange={(e) => handleInputChange('api_secret', e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full"
                  />
                  <input 
                    type="text" 
                    placeholder="Request Token (generate via login url redirect)"
                    value={creds.request_token}
                    onChange={(e) => handleInputChange('request_token', e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full"
                  />
                </div>
              )}

              {broker === 'upstox' && (
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="Upstox Client ID"
                    value={creds.client_id}
                    onChange={(e) => handleInputChange('client_id', e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full"
                  />
                  <input 
                    type="password" 
                    placeholder="Upstox Client Secret"
                    value={creds.client_secret}
                    onChange={(e) => handleInputChange('client_secret', e.target.value)}
                    className="bg-[var(--color-bg)] border border(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full"
                  />
                  <input 
                    type="text" 
                    placeholder="OAuth2 Redirect Authorization Code"
                    value={creds.redirect_code}
                    onChange={(e) => handleInputChange('redirect_code', e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-4 py-2.5 font-inter text-[13px] text-[var(--color-text)] outline-none focus:border-[rgba(200,179,142,0.4)] w-full"
                  />
                </div>
              )}

              {broker === 'manual' && (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[3px] py-8 cursor-pointer hover:border-[var(--color-gold)]/40 transition-colors bg-[var(--color-bg)]">
                    <Upload size={24} className="text-[var(--color-text-faint)] mb-2" />
                    <span className="font-inter text-[12px] text-[var(--color-text-muted)]">
                      {csvFile ? csvFile.name : 'Select trade history CSV ledger file'}
                    </span>
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 border border-[var(--color-loss)]/30 bg-[var(--color-loss)]/10 text-[var(--color-loss)] px-4 py-3 rounded-[3px] font-inter text-[12px] leading-relaxed shrink-0">
                  <ShieldAlert size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-4 shrink-0">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[3px] py-3 font-inter text-[12px] font-bold hover:text-[var(--color-text)] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  onClick={handleVerify}
                  disabled={verifying || (broker === 'manual' && !csvFile)}
                  className="flex-1 bg-[var(--color-gold)] text-[var(--color-bg)] rounded-[3px] py-3 font-inter text-[12px] font-bold tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {verifying ? <Loader2 size={14} className="animate-spin" /> : 'Verify Connection'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SYNC HOLDINGS */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center gap-6 animate-[fadeSlideUp_0.3s_ease-out]">
              <div className="w-10 h-10 bg-[var(--color-gain)]/10 border border-[var(--color-gain)]/30 rounded-full flex items-center justify-center animate-bounce">
                <ShieldCheck size={20} className="text-[var(--color-gain)]" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-cinzel text-sm font-bold text-[var(--color-text)]">Syncing Wealth Instance</h3>
                <p className="font-inter text-[12px] text-[var(--color-text-faint)]">
                  Setting secure channels with {accountInfo?.broker_name || 'Broker'}...
                </p>
              </div>

              <div className="w-full max-w-xs h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-[var(--color-gain)] rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>

              <span className="font-mono text-[10px] text-[var(--color-text-faint)] uppercase tracking-widest">
                {syncProgress === 100 ? 'SUCCESS' : `SYNCHRONIZING: ${syncProgress}%`}
              </span>
            </div>
          )}

        </div>

        {/* BOTTOM BYPASS TRIGGERS */}
        <div className="flex flex-col items-center border-t border-[var(--color-border)] pt-5 mt-6 shrink-0">
          <button 
            onClick={handleSkip}
            className="font-inter text-[11px] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
          >
            Skip integration & enter demo desk
          </button>
        </div>

      </div>
    </div>
  );
}

