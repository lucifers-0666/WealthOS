import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useAuth } from '../lib/useAuth.js';
import { updateProfile as updateProfileApi } from '../services/portfolio.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { LogOut, ShieldCheck, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

const ASSET_CLASSES = [
  { key: 'equity_IN', label: 'Indian Equity' },
  { key: 'equity_US', label: 'US Equity / ETFs' },
  { key: 'gold', label: 'Gold' },
  { key: 'debt', label: 'Debt / Bonds' },
  { key: 'cash', label: 'Cash & Liquid' },
  { key: 'crypto', label: 'Crypto' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { targetAllocation, saveTargetAllocation } = usePortfolio();
  const { user, signOut } = useAuth();
  const [allocations, setAllocations] = useState({});
  const [profile, setProfile] = useState({ currency: 'INR', risk_profile: 'moderate', investment_goal: '', target_corpus: '' });
  const [preferences, setPreferences] = useState({ strategy_mode: 'balanced', rebalance_frequency: 'monthly' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('wealthos:system-preferences');
    if (stored) {
      try {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        // ignore malformed local preferences
      }
    }
  }, []);

  useEffect(() => {
    const map = {};
    ASSET_CLASSES.forEach((a) => { map[a.key] = 0; });
    (targetAllocation || []).forEach((t) => { map[t.asset_class] = t.target_pct; });
    setAllocations(map);
  }, [targetAllocation]);

  const total = useMemo(() => Object.values(allocations).reduce((s, v) => s + Number(v || 0), 0), [allocations]);
  const valid = Math.abs(total - 100) < 0.01 || total === 0;

  async function handleSave() {
    setSaving(true);
    try {
      const arr = Object.entries(allocations)
        .filter(([, v]) => Number(v) > 0)
        .map(([asset_class, target_pct]) => ({ asset_class, target_pct: Number(target_pct) }));
      await saveTargetAllocation(arr);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfileApi({
        currency: profile.currency,
        risk_profile: profile.risk_profile,
        investment_goal: profile.investment_goal || null,
        target_corpus: profile.target_corpus ? Number(profile.target_corpus) : null,
      });
      window.localStorage.setItem('wealthos:system-preferences', JSON.stringify(preferences));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 740 }}>
            <div className="section-label">System settings</div>
            <h2 className="editorial-title" style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 3vw, 3rem)' }}>Profile, preferences, and allocation policy.</h2>
            <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'var(--font-sans)' }}>Keep your system profile, strategy, and account controls in one quiet place.</p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: `1px solid var(--border-subtle)`, color: 'var(--text-secondary)' }}>
            <ShieldCheck size={15} /> Protected
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Account</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>User profile</h3>
            <div style={{ display: 'grid', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>Email</span><span style={{ color: 'var(--text-primary)' }}>{user?.email || '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>User ID</span><span className="mono" style={{ color: 'var(--text-primary)' }}>{user?.id?.slice(0, 16) || '—'}...</span></div>
            </div>
            <button onClick={handleSignOut} style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px', background: 'rgba(107,46,46,0.12)', color: 'var(--terracotta)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Profile preferences</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Currency, risk, and corpus goals</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-faint)' }}>Currency</label>
                <select value={profile.currency} onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))} style={fieldStyle()}>
                  {['INR', 'USD', 'EUR', 'GBP'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-faint)' }}>Risk level</label>
                <select value={profile.risk_profile} onChange={(e) => setProfile((p) => ({ ...p, risk_profile: e.target.value }))} style={fieldStyle()}>
                  {['conservative', 'moderate', 'aggressive'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-faint)' }}>Investment goal</label>
                <input value={profile.investment_goal} onChange={(e) => setProfile((p) => ({ ...p, investment_goal: e.target.value }))} placeholder="Retirement, house, corpus planning…" style={fieldStyle()} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-faint)' }}>Target corpus</label>
                <input type="number" min={0} step="any" value={profile.target_corpus} onChange={(e) => setProfile((p) => ({ ...p, target_corpus: e.target.value }))} placeholder="10000000" style={fieldStyle()} />
              </div>
            </div>
            <div style={{ marginTop: 14, color: 'var(--text-secondary)', fontSize: 13 }}>
              These preferences persist to your profile row in Supabase when configured.
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Operating preferences</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Strategy mode and rebalance cadence</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-faint)' }}>Strategy mode</label>
                <select value={preferences.strategy_mode} onChange={(e) => setPreferences((p) => ({ ...p, strategy_mode: e.target.value }))} style={fieldStyle()}>
                  {['conservative', 'balanced', 'growth'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-faint)' }}>Rebalance frequency</label>
                <select value={preferences.rebalance_frequency} onChange={(e) => setPreferences((p) => ({ ...p, rebalance_frequency: e.target.value }))} style={fieldStyle()}>
                  {['monthly', 'quarterly', 'semiannual', 'annual'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Security posture</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Session and access control</h3>
            <div style={{ display: 'grid', gap: 10, color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
              <div>Protected routes enabled</div>
              <div>Session persistence active</div>
              <div>Auth token sync to backend</div>
              <div>Role-ready profile structure</div>
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle({ padding: 22 }) }}>
          <div className="section-label">Strategy controls</div>
          <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Target allocation</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {ASSET_CLASSES.map(({ key, label }) => (
              <div key={key} style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <label htmlFor={key} style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</label>
                  <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{Number(allocations[key] || 0).toFixed(0)}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    id={key}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={allocations[key] || ''}
                    onChange={(e) => setAllocations((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="0"
                    style={{ ...fieldStyle({ maxWidth: 120 }) }}
                  />
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(allocations[key] || 0), 100)}%`, height: '100%', borderRadius: 999, background: 'var(--greek-gold)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SlidersHorizontal size={15} /> Total target allocation</div>
            <strong style={{ color: valid ? 'var(--text-primary)' : 'var(--terracotta)' }}>{total.toFixed(1)}%</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={handleSaveProfile} disabled={saving} style={{ border: '1px solid rgba(212,160,23,0.5)', borderRadius: 12, padding: '12px 16px', background: 'linear-gradient(180deg, #f0e6c8, #d4a017)', color: '#1a1206', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={15} /> {saving ? 'Saving…' : profileSaved ? 'Profile saved' : 'Save profile'}
            </button>
            <button onClick={handleSave} disabled={saving || (!valid && total > 0)} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', background: 'rgba(212,160,23,0.05)', color: 'var(--greek-gold)', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save allocation'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
