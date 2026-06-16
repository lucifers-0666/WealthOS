import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/useAuth.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import { resetPassword } from '../lib/auth.js';
import { getProfileBundle, updateProfile, getPreferences, updatePreferences, getActivity } from '../services/portfolio.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { ShieldCheck, UserCircle2, Lock, Save, Activity, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageLoadingState, PageErrorState } from '../components/PageStates.jsx';

const badgeStyle = (tone) => ({
  padding: '6px 10px',
  borderRadius: 999,
  border: `1px solid var(--border)`,
  background: tone === 'risk' ? 'rgba(212,160,23,0.12)' : 'rgba(74,138,106,0.08)',
  color: tone === 'risk' ? 'var(--greek-gold)' : 'var(--aegean-green)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'var(--font-serif)',
});

export default function Profile() {
  const { user, signOut } = useAuth();
  const { refresh: refreshPortfolio } = usePortfolio();
  const queryClient = useQueryClient();

  const profileBundleQuery = useQuery({
    queryKey: ['user-profile-bundle'],
    queryFn: getProfileBundle,
    retry: 1,
  });

  const preferencesQuery = useQuery({
    queryKey: ['user-preferences'],
    queryFn: getPreferences,
    retry: 1,
  });

  const activityQuery = useQuery({
    queryKey: ['user-activity'],
    queryFn: () => getActivity(50),
    retry: 1,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    email: '',
    bio: '',
    avatar_url: '',
    risk_profile: '',
    investment_horizon: '',
    preferred_sectors: '',
    rebalance_frequency: '',
    investment_goal: '',
    target_corpus: '',
  });
  const [preferencesForm, setPreferencesForm] = useState({
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
    investment_profile: {},
  });

  const [profileBaseline, setProfileBaseline] = useState(null);
  const [preferencesBaseline, setPreferencesBaseline] = useState(null);
  const [securityNotice, setSecurityNotice] = useState(null);

  const [toast, setToast] = useState(null);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    const profile = profileBundleQuery.data?.profile;
    if (!profile) return;
    const mapped = {
      full_name: profile.full_name || '',
      username: profile.username || '',
      email: profile.email || user?.email || '',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      risk_profile: profile.risk_profile || '',
      investment_horizon: profile.investment_horizon || '',
      preferred_sectors: Array.isArray(profile.preferred_sectors) ? profile.preferred_sectors.join(', ') : (profile.preferred_sectors || ''),
      rebalance_frequency: profile.rebalance_frequency || '',
      investment_goal: profile.investment_goal || '',
      target_corpus: profile.target_corpus || '',
    };
    setProfileForm(mapped);
    setProfileBaseline(mapped);
  }, [profileBundleQuery.data, user?.email]);

  useEffect(() => {
    const prefs = preferencesQuery.data;
    if (!prefs) return;
    const mapped = {
      notification_settings: {
        price_alerts: true,
        advisor_alerts: true,
        market_summaries: true,
        tax_reminders: true,
        ...(prefs.notification_settings || {}),
      },
      ui_preferences: {
        table_density: 'comfortable',
        terminal_animations: true,
        compact_mode: false,
        default_view: 'command',
        ...(prefs.ui_preferences || {}),
      },
      investment_profile: prefs.investment_profile || {},
    };
    setPreferencesForm(mapped);
    setPreferencesBaseline(mapped);
  }, [preferencesQuery.data]);

  function showToast(message, tone = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3000);
  }

  function updateProfileField(key, value) {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePreferenceField(key, field, value) {
    setPreferencesForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onMutate: async (payload) => {
      setSaveState('saving');
      const previous = queryClient.getQueryData(['user-profile-bundle']);
      queryClient.setQueryData(['user-profile-bundle'], (old) => ({
        ...(old || {}),
        profile: {
          ...(old?.profile || {}),
          ...payload,
        },
      }));
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-profile-bundle'], context.previous);
      }
      setSaveState('error');
      showToast('Profile save failed. Changes were rolled back.', 'error');
    },
    onSuccess: (data) => {
      setSaveState('saved');
      const normalized = {
        ...profileForm,
        email: data?.email || user?.email || profileForm.email,
      };
      setProfileBaseline(normalized);
      showToast('Profile saved successfully.', 'success');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-profile-bundle'] });
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: updatePreferences,
    onMutate: async (payload) => {
      const previous = queryClient.getQueryData(['user-preferences']);
      queryClient.setQueryData(['user-preferences'], (old) => ({ ...(old || {}), ...payload }));
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-preferences'], context.previous);
      }
      setSaveState('error');
      showToast('Preference save failed. Changes were rolled back.', 'error');
    },
    onSuccess: () => {
      setPreferencesBaseline(preferencesForm);
      showToast('Preferences saved successfully.', 'success');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  async function handleSaveAll() {
    if (!profileForm.full_name?.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }

    const profilePayload = {
      full_name: profileForm.full_name || null,
      username: profileForm.username || null,
      bio: profileForm.bio || null,
      avatar_url: profileForm.avatar_url || null,
      risk_profile: profileForm.risk_profile || null,
      investment_goal: profileForm.investment_goal || null,
      target_corpus: profileForm.target_corpus ? Number(profileForm.target_corpus) : null,
      investment_horizon: profileForm.investment_horizon || null,
      preferred_sectors: profileForm.preferred_sectors
        ? profileForm.preferred_sectors.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      rebalance_frequency: profileForm.rebalance_frequency || null,
    };

    const preferencesPayload = {
      notification_settings: preferencesForm.notification_settings,
      ui_preferences: preferencesForm.ui_preferences,
      investment_profile: {
        ...(preferencesForm.investment_profile || {}),
        risk_profile: profileForm.risk_profile || null,
        horizon: profileForm.investment_horizon || null,
      },
    };

    try {
      setSaveState('saving');
      await profileMutation.mutateAsync(profilePayload);
      await preferencesMutation.mutateAsync(preferencesPayload);
      await queryClient.invalidateQueries({ queryKey: ['user-activity'] });
      await refreshPortfolio();
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) {
      setSecurityNotice('No email is attached to this profile session.');
      return;
    }
    await resetPassword(user.email);
    setSecurityNotice('Password reset flow has been initiated for this account.');
    showToast('Password reset link sent.', 'success');
  }

  async function handleLogoutAll() {
    await signOut();
    window.location.assign('/login');
  }

  if (profileBundleQuery.isLoading || preferencesQuery.isLoading) {
    return <PageLoadingState title="Loading profile…" subtitle="Preparing your institutional account workspace." />;
  }

  if (profileBundleQuery.isError || preferencesQuery.isError) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <PageErrorState title="Profile unavailable" message={profileBundleQuery.error?.message || preferencesQuery.error?.message || 'Unable to load profile.'} />
        <button
          onClick={() => {
            profileBundleQuery.refetch();
            preferencesQuery.refetch();
            activityQuery.refetch();
          }}
          style={{ border: '1px solid rgba(212,160,23,0.5)', borderRadius: 12, padding: '10px 14px', background: 'linear-gradient(180deg, #f0e6c8, #d4a017)', color: '#1a1206', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const profile = profileBundleQuery.data?.profile || {};
  const metrics = profileBundleQuery.data?.metrics || {};
  const joinDate = (profile.created_at || user?.created_at) ? new Date(profile.created_at || user.created_at) : null;
  const verified = Boolean(user?.email_confirmed_at);
  const mfaReady = Array.isArray(user?.factors) ? user.factors.length > 0 : false;
  const activity = activityQuery.data?.activity || [];

  const avatarPreview = profileForm.avatar_url || '';
  const profileDirty = JSON.stringify(profileForm) !== JSON.stringify(profileBaseline || profileForm);
  const preferencesDirty = JSON.stringify(preferencesForm) !== JSON.stringify(preferencesBaseline || preferencesForm);
  const hasUnsavedChanges = profileDirty || preferencesDirty;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(212,160,23,0.14)', display: 'grid', placeItems: 'center', color: 'var(--greek-gold)' }}>
              {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} /> : <UserCircle2 size={28} />}
            </div>
            <div>
              <div className="section-label">WealthOS Profile</div>
              <h2 className="editorial-title" style={{ margin: '6px 0 0', fontSize: 'clamp(1.8rem, 2.6vw, 2.6rem)' }}>{profileForm.full_name || '—'}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{profileForm.email || user?.email || '—'} · {joinDate ? joinDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={badgeStyle('risk')}>{profileForm.risk_profile || 'Not set'}</div>
            <div style={badgeStyle('safe')}>Portfolio ₹{Number(metrics.portfolio_value || 0).toLocaleString('en-IN')}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: `1px solid var(--border)`, color: verified ? 'var(--aegean-green)' : 'var(--text-secondary)', fontSize: 12 }}>
              <ShieldCheck size={14} /> {verified ? 'Email verified' : 'Email not verified'}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
          {[
            ['Holdings', metrics.holdings_count || 0],
            ['Watchlist', metrics.watchlist_count || 0],
            ['Total Invested', `₹${Number(metrics.total_invested || 0).toLocaleString('en-IN')}`],
            ['Unrealized P&L', `₹${Number(metrics.unrealized_pnl || 0).toLocaleString('en-IN')}`],
          ].map(([label, value]) => (
            <div key={label} style={{ border: `1px solid var(--border)`, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ color: 'var(--text-faint)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ color: 'var(--parchment)', fontWeight: 600, marginTop: 4, fontFamily: 'var(--font-serif)' }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Account settings</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Identity and profile controls</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Full name</label><input value={profileForm.full_name} onChange={(e) => updateProfileField('full_name', e.target.value)} style={fieldStyle()} /></div>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Username</label><input value={profileForm.username} onChange={(e) => updateProfileField('username', e.target.value)} style={fieldStyle()} /></div>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Bio</label><textarea rows={3} value={profileForm.bio} onChange={(e) => updateProfileField('bio', e.target.value)} style={fieldStyle({ resize: 'vertical' })} /></div>
              <div><label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Avatar URL</label><input value={profileForm.avatar_url} onChange={(e) => updateProfileField('avatar_url', e.target.value)} placeholder="https://" style={fieldStyle()} /></div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Investment profile</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Risk, horizon, and allocation intent</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Risk appetite</label>
                <select value={profileForm.risk_profile} onChange={(e) => updateProfileField('risk_profile', e.target.value)} style={fieldStyle()}>
                  <option value="">Select risk appetite</option>
                  {['conservative', 'moderate', 'aggressive'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Investment horizon</label>
                <select value={profileForm.investment_horizon} onChange={(e) => updateProfileField('investment_horizon', e.target.value)} style={fieldStyle()}>
                  <option value="">Select horizon</option>
                  {['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'].map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Preferred sectors</label>
                <input value={profileForm.preferred_sectors} onChange={(e) => updateProfileField('preferred_sectors', e.target.value)} placeholder="Banking, IT, FMCG" style={fieldStyle()} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Rebalance frequency</label>
                <select value={profileForm.rebalance_frequency} onChange={(e) => updateProfileField('rebalance_frequency', e.target.value)} style={fieldStyle()}>
                  <option value="">Select frequency</option>
                  {['monthly', 'quarterly', 'semiannual', 'annual'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Security</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Session and access controls</h3>
            <div style={{ display: 'grid', gap: 10, color: theme.colors.textSoft, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={14} /> Current session: {user?.id ? `${user.id.slice(0, 8)}…` : 'Unavailable'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={14} /> MFA readiness: {mfaReady ? 'Enabled factors detected' : 'No factors enrolled yet'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={14} /> Last sign-in: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-IN') : 'Unavailable'}</div>
            </div>
            {securityNotice && <div style={{ marginTop: 12, color: 'var(--greek-gold)', fontSize: 13 }}>{securityNotice}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={handlePasswordReset} style={{ border: `1px solid var(--border-subtle)`, borderRadius: 12, padding: '10px 14px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Reset password</button>
              <button onClick={handleLogoutAll} style={{ border: 0, borderRadius: 12, padding: '10px 14px', background: 'rgba(212,160,23,0.12)', color: 'var(--greek-gold)', cursor: 'pointer' }}>Logout all devices</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Notifications</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Alert preferences</h3>
            {Object.entries(preferencesForm.notification_settings).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 0', color: theme.colors.textSoft }}>
                <span>{key.replace('_', ' ')}</span>
                <input type="checkbox" checked={Boolean(value)} onChange={(e) => updatePreferenceField('notification_settings', key, e.target.checked)} />
              </label>
            ))}
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Saved preferences</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Terminal experience</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Table density</label>
                <select value={preferencesForm.ui_preferences.table_density} onChange={(e) => updatePreferenceField('ui_preferences', 'table_density', e.target.value)} style={fieldStyle()}>
                  {['comfortable', 'compact'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: theme.colors.textSoft }}>
                <span>Terminal animations</span>
                <input type="checkbox" checked={Boolean(preferencesForm.ui_preferences.terminal_animations)} onChange={(e) => updatePreferenceField('ui_preferences', 'terminal_animations', e.target.checked)} />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: theme.colors.textSoft }}>
                <span>Compact mode</span>
                <input type="checkbox" checked={Boolean(preferencesForm.ui_preferences.compact_mode)} onChange={(e) => updatePreferenceField('ui_preferences', 'compact_mode', e.target.checked)} />
              </label>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: theme.colors.textMuted }}>Default dashboard view</label>
                <select value={preferencesForm.ui_preferences.default_view} onChange={(e) => updatePreferenceField('ui_preferences', 'default_view', e.target.value)} style={fieldStyle()}>
                  {['command', 'portfolio', 'signals'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Activity history</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Latest activity</h3>
            {activityQuery.isLoading && (
              <div style={{ display: 'grid', gap: 8 }}>
                {[1, 2, 3].map((n) => <div key={n} style={{ height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            )}
            {activity.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {activity.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}` }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{item.event_type?.replaceAll('_', ' ') || ''}</div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textSoft }}>{item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              !activityQuery.isLoading && <div style={{ color: theme.colors.textMuted }}>No recorded activity yet.</div>
            )}
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle({ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
          <Activity size={16} /> {hasUnsavedChanges ? 'Unsaved changes detected' : 'All changes synced'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ color: saveState === 'error' ? 'var(--terracotta)' : 'var(--text-secondary)', fontSize: 12 }}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save failed' : 'Idle'}
          </div>
          <button onClick={handleSaveAll} disabled={saveState === 'saving' || !hasUnsavedChanges} style={{ border: '1px solid rgba(212,160,23,0.5)', borderRadius: 12, padding: '12px 16px', background: 'linear-gradient(180deg, #f0e6c8, #d4a017)', color: '#1a1206', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: hasUnsavedChanges ? 1 : 0.6 }}>
            <Save size={15} /> {saveState === 'saving' ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </section>

      {toast && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60, padding: '10px 14px', borderRadius: 12, border: `1px solid var(--border)`, background: toast.tone === 'error' ? 'rgba(107,46,46,0.2)' : 'rgba(74,138,106,0.2)', color: 'var(--text-primary)', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          {toast.tone === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
