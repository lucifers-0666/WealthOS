import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useAuth } from '../lib/useAuth.js';
import SectionHeader from '../components/SectionHeader.jsx';

const ASSET_CLASSES = [
  { key: 'equity_IN', label: 'Indian Equity' },
  { key: 'equity_US', label: 'US Equity / ETFs' },
  { key: 'gold', label: 'Gold' },
  { key: 'debt', label: 'Debt / Bonds' },
  { key: 'cash', label: 'Cash & Liquid' },
  { key: 'crypto', label: 'Crypto' },
];

export default function Settings() {
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

  const total = Object.values(allocations).reduce((s, v) => s + Number(v || 0), 0);
  const valid = Math.abs(total - 100) < 0.01 || total === 0;

  async function handleSave() {
    setSaving(true);
    try {
      const arr = Object.entries(allocations)
        .filter(([, v]) => Number(v) > 0)
        .map(([asset_class, target_pct]) => ({ asset_class, target_pct: Number(target_pct) }));
      await saveTargetAllocation(arr);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your investment strategy and preferences</p>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-card">
        <SectionHeader title="Account" subtitle="Your WealthOS profile" />
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{user?.email || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">User ID</span>
          <span className="settings-value mono">{user?.id?.slice(0, 16)}...</span>
        </div>
        <button className="btn-danger" onClick={signOut} style={{ marginTop: 16 }}>Sign Out</button>
      </div>

      {/* Target Allocation */}
      <div className="settings-card">
        <SectionHeader
          title="Target Allocation"
          subtitle={`Total: ${total.toFixed(1)}% ${!valid && total > 0 ? '— must equal 100%' : ''}`}
        />
        <div className="allocation-grid">
          {ASSET_CLASSES.map(({ key, label }) => (
            <div key={key} className="allocation-row">
              <label htmlFor={key} className="allocation-label">{label}</label>
              <div className="allocation-input-wrap">
                <input
                  id={key}
                  type="number"
                  min={0} max={100} step={1}
                  value={allocations[key] || ''}
                  onChange={(e) => setAllocations((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="allocation-input"
                  placeholder="0"
                />
                <span className="allocation-pct">%</span>
              </div>
              <div className="allocation-bar">
                <div
                  className="allocation-fill"
                  style={{ width: `${Math.min(Number(allocations[key] || 0), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || (!valid && total > 0)}
          style={{ marginTop: 20 }}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Target Allocation'}
        </button>
      </div>
    </div>
  );
}
