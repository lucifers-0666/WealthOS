import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useAuth } from '../lib/useAuth.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { LogOut, Settings2, ShieldCheck, SlidersHorizontal } from 'lucide-react';

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
            <p style={{ margin: '10px 0 0', color: theme.colors.textSoft, lineHeight: 1.65 }}>Keep your system profile, strategy, and account controls in one quiet place.</p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft }}>
            <ShieldCheck size={15} /> Protected
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Account</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>User profile</h3>
            <div style={{ display: 'grid', gap: 10, color: theme.colors.textSoft, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>Email</span><span style={{ color: theme.colors.text }}>{user?.email || '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>User ID</span><span className="mono" style={{ color: theme.colors.text }}>{user?.id?.slice(0, 16) || '—'}...</span></div>
            </div>
            <button onClick={handleSignOut} style={{ marginTop: 16, border: '0', borderRadius: 12, padding: '11px 14px', background: 'rgba(182,106,106,0.12)', color: theme.colors.error, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Security posture</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Session and access control</h3>
            <div style={{ display: 'grid', gap: 10, color: theme.colors.textSoft, lineHeight: 1.7, fontSize: 14 }}>
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
                  <label htmlFor={key} style={{ color: theme.colors.textSoft, fontSize: 13 }}>{label}</label>
                  <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>{Number(allocations[key] || 0).toFixed(0)}%</span>
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
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(allocations[key] || 0), 100)}%`, height: '100%', borderRadius: 999, background: theme.colors.gold }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, color: theme.colors.textSoft }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SlidersHorizontal size={15} /> Total target allocation</div>
            <strong style={{ color: valid ? theme.colors.text : theme.colors.error }}>{total.toFixed(1)}%</strong>
          </div>
          <button onClick={handleSave} disabled={saving || (!valid && total > 0)} style={{ marginTop: 16, border: '0', borderRadius: 12, padding: '12px 16px', background: theme.colors.text, color: '#0A201F', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save allocation'}
          </button>
        </div>
      </section>
    </div>
  );
}
