import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/useAuth.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import { getProfile, updateProfile } from '../services/portfolio.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { ShieldCheck, UserCircle2, Bell, Lock, Save, Activity } from 'lucide-react';
import { PageLoadingState, PageErrorState } from '../components/PageStates.jsx';

const badgeStyle = (tone) => ({
  padding: '6px 10px',
  borderRadius: 999,
  border: `1px solid ${theme.colors.border}`,
  background: tone === 'risk' ? 'rgba(200,179,142,0.12)' : 'rgba(111,174,141,0.08)',
  color: tone === 'risk' ? theme.colors.gold : theme.colors.success,
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
});

export default function Profile() {
  const { user } = useAuth();
  const { portfolio, transactions } = usePortfolio();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    risk_profile: 'moderate',
    investment_horizon: '3-5 years',
    preferred_sectors: '',
    rebalance_frequency: 'quarterly',
    investment_goal: '',
    target_corpus: '',
    notification_settings: {
      price_alerts: true,
      advisor_alerts: true,
      market_summaries: true,
      tax_reminders: true,
    },
    ui_preferences: {
      table_density: 'comfortable',
      terminal_animations: true,
      compact_mode: false,
      default_view: 'command',
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const data = profileQuery.data;
    setForm((prev) => ({
      ...prev,
      full_name: data.full_name || '',
      username: data.username || '',
      bio: data.bio || '',
      avatar_url: data.avatar_url || '',
      risk_profile: data.risk_profile || prev.risk_profile,
      investment_goal: data.investment_goal || '',
      target_corpus: data.target_corpus || '',
      investment_horizon: data.investment_horizon || prev.investment_horizon,
      preferred_sectors: Array.isArray(data.preferred_sectors) ? data.preferred_sectors.join(', ') : data.preferred_sectors || '',
      rebalance_frequency: data.rebalance_frequency || prev.rebalance_frequency,
      notification_settings: data.notification_settings || prev.notification_settings,
      ui_preferences: data.ui_preferences || prev.ui_preferences,
    }));
  }, [profileQuery.data]);

  const portfolioValue = portfolio?.summary?.current_value || 0;
  const joinDate = profileQuery.data?.created_at ? new Date(profileQuery.data.created_at) : null;

  const activity = useMemo(() => {
    return (transactions || []).slice(0, 6).map((tx) => ({
      id: tx.id || `${tx.ticker}-${tx.transaction_date}`,
      title: `${tx.action} ${tx.ticker}`,
      subtitle: `${tx.quantity} units · ₹${Number(tx.price || 0).toFixed(0)}`,
      date: tx.transaction_date,
    }));
  }, [transactions]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateNested(key, field, value) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSave() {
    await saveMutation.mutateAsync({
      full_name: form.full_name || null,
      username: form.username || null,
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
      risk_profile: form.risk_profile,
      investment_goal: form.investment_goal || null,
      target_corpus: form.target_corpus ? Number(form.target_corpus) : null,
      investment_horizon: form.investment_horizon || null,
      preferred_sectors: form.preferred_sectors
        ? form.preferred_sectors.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      rebalance_frequency: form.rebalance_frequency || null,
      notification_settings: form.notification_settings,
      ui_preferences: form.ui_preferences,
      investment_profile: {
        risk_profile: form.risk_profile,
        horizon: form.investment_horizon,
      },
    });
  }

  if (profileQuery.isLoading) {
    return <PageLoadingState title="Loading profile…" subtitle="Preparing your institutional account workspace." />;
  }

  if (profileQuery.isError) {
    return <PageErrorState title="Profile unavailable" message={profileQuery.error?.message || 'Unable to load profile.'} />;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(200,179,142,0.14)', display: 'grid', placeItems: 'center', color: theme.colors.gold }}>
              {form.avatar_url ? <img src={form.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} /> : <UserCircle2 size={28} />}
            </div>
            <div>
              <div className="section-label">WealthOS Profile</div>
              <h2 className="editorial-title" style={{ margin: '6px 0 0', fontSize: 'clamp(1.8rem, 2.6vw, 2.6rem)' }}>{form.full_name || 'Private Client'}</h2>
              <div style={{ color: theme.colors.textSoft, fontSize: 13 }}>{user?.email || '—'} · {joinDate ? joinDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Join date pending'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={badgeStyle('risk')}>{form.risk_profile}</div>
            <div style={badgeStyle('safe')}>Portfolio ₹{Number(portfolioValue || 0).toLocaleString('en-IN')}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft, fontSize: 12 }}><ShieldCheck size={14} /> Verified</div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Account settings</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Identity and profile controls</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Full name</label><input value={form.full_name} onChange={(e) => updateField('full_name', e.target.value)} style={fieldStyle()} /></div>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Username</label><input value={form.username} onChange={(e) => updateField('username', e.target.value)} style={fieldStyle()} /></div>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Bio</label><textarea rows={3} value={form.bio} onChange={(e) => updateField('bio', e.target.value)} style={fieldStyle({ resize: 'vertical' })} /></div>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Avatar URL</label><input value={form.avatar_url} onChange={(e) => updateField('avatar_url', e.target.value)} placeholder="https://" style={fieldStyle()} /></div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Investment profile</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Risk, horizon, and allocation intent</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Risk appetite</label>
                <select value={form.risk_profile} onChange={(e) => updateField('risk_profile', e.target.value)} style={fieldStyle()}>
                  {['conservative', 'moderate', 'aggressive'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Investment horizon</label>
                <select value={form.investment_horizon} onChange={(e) => updateField('investment_horizon', e.target.value)} style={fieldStyle()}>
                  {['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'].map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Preferred sectors</label>
                <input value={form.preferred_sectors} onChange={(e) => updateField('preferred_sectors', e.target.value)} placeholder="Banking, IT, FMCG" style={fieldStyle()} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Rebalance frequency</label>
                <select value={form.rebalance_frequency} onChange={(e) => updateField('rebalance_frequency', e.target.value)} style={fieldStyle()}>
                  {['monthly', 'quarterly', 'semiannual', 'annual'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Security</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Session and access controls</h3>
            <div style={{ display: 'grid', gap: 10, color: theme.colors.textSoft, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={14} /> Password reset available via your identity provider.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={14} /> MFA readiness placeholder in place.</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '10px 14px', background: 'transparent', color: theme.colors.textSoft, cursor: 'pointer' }}>Reset password</button>
              <button style={{ border: 0, borderRadius: 12, padding: '10px 14px', background: 'rgba(200,179,142,0.12)', color: theme.colors.gold, cursor: 'pointer' }}>Logout all devices</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Notifications</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Alert preferences</h3>
            {Object.entries(form.notification_settings).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 0', color: theme.colors.textSoft }}>
                <span>{key.replace('_', ' ')}</span>
                <input type="checkbox" checked={value} onChange={(e) => updateNested('notification_settings', key, e.target.checked)} />
              </label>
            ))}
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Saved preferences</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Terminal experience</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Table density</label>
                <select value={form.ui_preferences.table_density} onChange={(e) => updateNested('ui_preferences', 'table_density', e.target.value)} style={fieldStyle()}>
                  {['comfortable', 'compact'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: theme.colors.textSoft }}>
                <span>Terminal animations</span>
                <input type="checkbox" checked={form.ui_preferences.terminal_animations} onChange={(e) => updateNested('ui_preferences', 'terminal_animations', e.target.checked)} />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: theme.colors.textSoft }}>
                <span>Compact mode</span>
                <input type="checkbox" checked={form.ui_preferences.compact_mode} onChange={(e) => updateNested('ui_preferences', 'compact_mode', e.target.checked)} />
              </label>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Default dashboard view</label>
                <select value={form.ui_preferences.default_view} onChange={(e) => updateNested('ui_preferences', 'default_view', e.target.value)} style={fieldStyle()}>
                  {['command', 'portfolio', 'signals'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Activity history</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Latest activity</h3>
            {activity.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {activity.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}` }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{item.subtitle}</div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textSoft }}>{item.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: theme.colors.textMuted }}>No recent activity yet.</div>
            )}
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle({ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.textSoft }}>
          <Activity size={16} /> Profile and preferences sync to Supabase for persistence.
        </div>
        <button onClick={handleSave} disabled={saveMutation.isLoading} style={{ border: 0, borderRadius: 12, padding: '12px 16px', background: theme.colors.text, color: '#0A201F', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Save size={15} /> {saveMutation.isLoading ? 'Saving…' : 'Save profile'}
        </button>
      </section>
    </div>
  );
}
