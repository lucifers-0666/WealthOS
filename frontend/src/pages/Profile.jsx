import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth.js';
import { supabase, isDemoMode } from '../lib/auth.js';
import { 
  ShieldCheck, WarningCircle, X, Check, CaretDown, UserCircle, 
  Briefcase, Globe, CurrencyInr, ChartLineUp, LockKey, Trash, SignOut, PencilSimple
} from '@phosphor-icons/react';
import { request } from '../services/api.js';

const PLAN_LABELS = {
  free:          'Free Tier',
  pro:           'Pro Terminal',
  premium:       'Institutional Premium',
  institutional: 'Institutional Enterprise'
};

const PLAN_COLORS = {
  free:          'bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  pro:           'bg-[rgba(56,189,248,0.1)] text-[#38bdf8] border-[#38bdf8]/30',
  premium:       'bg-[rgba(217,119,6,0.15)] text-[#f59e0b] border-[#f59e0b]/40',
  institutional: 'bg-[rgba(168,85,247,0.15)] text-[#c084fc] border-[#c084fc]/40'
};

const RISK_LABELS = {
  conservative: 'Conservative (Capital Preservation)',
  moderate:     'Moderate (Balanced Growth)',
  aggressive:   'Aggressive (Maximum Capital Growth)',
  CONSERVATIVE: 'Conservative (Capital Preservation)',
  BALANCED:     'Moderate (Balanced Growth)',
  AGGRESSIVE:   'Aggressive (Maximum Capital Growth)'
};

const RISK_BADGES = {
  conservative: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  moderate:     'bg-amber-500/10 text-amber-400 border-amber-500/30',
  aggressive:   'bg-rose-500/10 text-rose-400 border-rose-500/30',
  CONSERVATIVE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  BALANCED:     'bg-amber-500/10 text-amber-400 border-amber-500/30',
  AGGRESSIVE:   'bg-rose-500/10 text-rose-400 border-rose-500/30'
};

function SectionHeader({ title, icon: Icon, actionButton }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(45,60,55,0.4)]">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-[var(--color-gold)]" />}
        <h3 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          {title}
        </h3>
      </div>
      {actionButton}
    </div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);

  const [editForm, setEditForm] = useState({
    display_name: '',
    phone: '',
    city: '',
    country: '',
    occupation: '',
    annual_income: '',
    experience_years: '',
    risk_profile: '',
    investment_goal: '',
    investment_horizon: ''
  });

  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        if (!user) throw new Error('Not authenticated');

        let pRow = {};
        if (supabase) {
          const { data: profileRow, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Could not fetch remote profile:', profileError.message);
          } else if (profileRow) {
            pRow = profileRow;
          }
        }
        
        // Reconcile with localStorage fallback
        const localCached = JSON.parse(localStorage.getItem('arca_profile') || '{}');
        const merged = { ...localCached, ...pRow };

        const name = merged.full_name || merged.display_name || user.user_metadata?.full_name || user.email.split('@')[0];
        const parts = name.trim().split(' ').filter(Boolean);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();

        const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric'
        }) : 'Recent';

        const profileData = {
          id: merged.id || user.id,
          full_name: merged.full_name || name,
          display_name: merged.display_name || name,
          avatar_url: merged.avatar_url,
          plan_tier: merged.plan_tier || 'free',
          email: merged.email || user.email,
          phone: merged.phone || 'Not provided',
          referral_code: merged.referral_code || 'None',
          city: merged.city || 'Not specified',
          country: merged.country || 'India',
          occupation: merged.occupation || 'Not specified',
          annual_income: merged.annual_income || 'Not specified',
          experience_years: merged.experience_years || 'BEGINNER',
          risk_profile: merged.risk_profile || 'moderate',
          investment_goal: merged.investment_goal || 'Capital Growth',
          investment_horizon: merged.investment_horizon || 'MEDIUM',
          member_since: memberSince,
          initials
        };

        setProfile(profileData);
        setEditForm({
          display_name: profileData.display_name,
          phone: profileData.phone === 'Not provided' ? '' : profileData.phone,
          city: profileData.city === 'Not specified' ? '' : profileData.city,
          country: profileData.country,
          occupation: profileData.occupation === 'Not specified' ? '' : profileData.occupation,
          annual_income: profileData.annual_income === 'Not specified' ? '' : profileData.annual_income,
          experience_years: profileData.experience_years,
          risk_profile: profileData.risk_profile,
          investment_goal: profileData.investment_goal,
          investment_horizon: profileData.investment_horizon
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    if (user) loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.assign('/login');
  };

  const handleSaveProfile = async (section) => {
    setError(null);
    setSuccessMsg(null);
    const updates = {
      display_name: editForm.display_name,
      phone: editForm.phone,
      city: editForm.city,
      country: editForm.country,
      occupation: editForm.occupation,
      annual_income: editForm.annual_income,
      experience_years: editForm.experience_years,
      risk_profile: editForm.risk_profile,
      investment_goal: editForm.investment_goal,
      investment_horizon: editForm.investment_horizon,
      updated_at: new Date().toISOString()
    };

    // Update local cache immediately
    const existingCached = JSON.parse(localStorage.getItem('arca_profile') || '{}');
    const updatedProfile = { ...existingCached, ...updates };
    localStorage.setItem('arca_profile', JSON.stringify(updatedProfile));

    const existingUsers = JSON.parse(localStorage.getItem('arca_registered_users') || '[]');
    const userIdx = existingUsers.findIndex(u => u.id === profile.id);
    if (userIdx >= 0) {
      existingUsers[userIdx].profile = { ...(existingUsers[userIdx].profile || {}), ...updates };
      if (updates.display_name) existingUsers[userIdx].full_name = updates.display_name;
      localStorage.setItem('arca_registered_users', JSON.stringify(existingUsers));
    }

    if (supabase && profile?.id && !profile.id.startsWith('demo-user')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: profile.id, user_id: profile.id, ...updates });

        if (error) throw error;
      } catch (err) {
        console.warn('Remote profile save warning:', err.message);
      }
    }

    setProfile(prev => ({ ...prev, ...updates }));
    if (section === 'personal') setIsEditingPersonal(false);
    if (section === 'strategy') setIsEditingStrategy(false);
    setSuccessMsg('Profile updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter new password (min 8 characters):");
    if (!newPassword) return;
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
        setTimeout(() => setPasswordError(null), 5000);
        return;
      }
    }
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        await request('DELETE', '/api/user');
        await handleSignOut();
      } catch (err) {
        setError(err.message || 'Failed to delete account');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full items-center p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col gap-6 pb-12">
        
        {/* PAGE HEADER */}
        <div className="flex justify-between items-end pb-2 border-b border-[var(--color-border)]">
          <div>
            <div className="font-cinzel text-[10px] font-bold tracking-[0.22em] text-[var(--color-gold)] uppercase mb-1">
              ARCA CLIENT PROFILE
            </div>
            <h1 className="font-cinzel text-2xl font-bold text-[var(--color-text)] tracking-wide m-0">Account Intelligence & Settings</h1>
          </div>
          <div className="font-inter text-[11px] text-[var(--color-text-faint)]">
            USER ID: <span className="font-mono text-[var(--color-gold)] font-bold">{profile?.id || user?.id}</span>
          </div>
        </div>

        {error && (
          <div className="bg-[rgba(182,106,106,0.1)] border border-[var(--color-loss)] p-3 rounded flex items-center gap-2 text-[var(--color-loss)] font-inter text-[12px]">
            <WarningCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={14}/></button>
          </div>
        )}

        {successMsg && (
          <div className="bg-[rgba(34,197,94,0.1)] border border-[#22c55e] p-3 rounded flex items-center gap-2 text-[#22c55e] font-inter text-[12px]">
            <Check size={16} />
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="ml-auto"><X size={14}/></button>
          </div>
        )}

        {/* 1. IDENTITY HEADER CARD */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[4px] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-2xl pointer-events-none" />
          
          {loading || !profile ? (
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[var(--color-overlay)] animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 bg-[var(--color-overlay)] rounded animate-pulse" />
                <div className="h-3 w-24 bg-[var(--color-overlay)] rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-gold)]/40 flex items-center justify-center font-cinzel text-[22px] font-bold text-[var(--color-gold)] shadow-inner">
                  {profile.initials}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel text-[20px] font-bold text-[var(--color-text)] tracking-wide">{profile.display_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-inter font-bold uppercase tracking-wider border ${PLAN_COLORS[profile.plan_tier]}`}>
                      {PLAN_LABELS[profile.plan_tier]}
                    </span>
                  </div>
                  <div className="font-inter text-[12px] text-[var(--color-text-muted)] flex items-center gap-2">
                    <span>{profile.email}</span>
                    <span>&middot;</span>
                    <span>Member since {profile.member_since}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. PERSONAL & CONTACT DETAILS CARD */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[4px] p-6">
          <SectionHeader 
            title="PERSONAL & CONTACT PROFILE" 
            icon={UserCircle} 
            actionButton={
              !isEditingPersonal ? (
                <button 
                  onClick={() => setIsEditingPersonal(true)} 
                  className="flex items-center gap-1 text-[var(--color-gold)] hover:text-[var(--color-text)] font-inter text-xs px-2.5 py-1 rounded border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50 transition-all"
                >
                  <PencilSimple size={13} /> Edit Details
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditingPersonal(false)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] font-inter text-xs px-2 py-1">Cancel</button>
                  <button onClick={() => handleSaveProfile('personal')} className="bg-[var(--color-gold)] text-[#000] px-3 py-1 rounded font-inter text-xs font-bold shadow">Save</button>
                </div>
              )
            }
          />

          {loading || !profile ? (
            <div className="grid grid-cols-2 gap-4 h-24 bg-[var(--color-overlay)]/30 rounded animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-2">
              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Unique Terminal User ID</span>
                <span className="font-mono text-[13px] text-[var(--color-gold)] font-bold tracking-wider">{profile.id}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Display Name</span>
                {isEditingPersonal ? (
                  <input 
                    type="text" 
                    value={editForm.display_name} 
                    onChange={e => setEditForm({...editForm, display_name: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                  />
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">{profile.display_name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Phone Number</span>
                {isEditingPersonal ? (
                  <input 
                    type="text" 
                    value={editForm.phone} 
                    onChange={e => setStep1 ? setEditForm({...editForm, phone: e.target.value}) : null}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                  />
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">{profile.phone}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">City & Country</span>
                {isEditingPersonal ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="City"
                      value={editForm.city} 
                      onChange={e => setEditForm({...editForm, city: e.target.value})}
                      className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                    />
                    <input 
                      type="text" 
                      placeholder="Country"
                      value={editForm.country} 
                      onChange={e => setEditForm({...editForm, country: e.target.value})}
                      className="w-24 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">{profile.city}, {profile.country}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Occupation</span>
                {isEditingPersonal ? (
                  <input 
                    type="text" 
                    value={editForm.occupation} 
                    onChange={e => setEditForm({...editForm, occupation: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                  />
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">{profile.occupation}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Annual Income Range</span>
                {isEditingPersonal ? (
                  <select 
                    value={editForm.annual_income} 
                    onChange={e => setEditForm({...editForm, annual_income: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="Below ₹10L">Below ₹10L</option>
                    <option value="₹10L – ₹25L">₹10L – ₹25L</option>
                    <option value="₹25L – ₹50L">₹25L – ₹50L</option>
                    <option value="₹50L – ₹1Cr">₹50L – ₹1Cr</option>
                    <option value="Above ₹1Cr">Above ₹1Cr</option>
                  </select>
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">{profile.annual_income}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Referral Code</span>
                <span className="font-mono text-[12px] text-[var(--color-gold)] font-medium">{profile.referral_code}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. INVESTMENT STRATEGY & RISK PROFILE CARD */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[4px] p-6">
          <SectionHeader 
            title="INVESTMENT STRATEGY & RISK PROFILE" 
            icon={ChartLineUp} 
            actionButton={
              !isEditingStrategy ? (
                <button 
                  onClick={() => setIsEditingStrategy(true)} 
                  className="flex items-center gap-1 text-[var(--color-gold)] hover:text-[var(--color-text)] font-inter text-xs px-2.5 py-1 rounded border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50 transition-all"
                >
                  <PencilSimple size={13} /> Edit Strategy
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditingStrategy(false)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] font-inter text-xs px-2 py-1">Cancel</button>
                  <button onClick={() => handleSaveProfile('strategy')} className="bg-[var(--color-gold)] text-[#000] px-3 py-1 rounded font-inter text-xs font-bold shadow">Save</button>
                </div>
              )
            }
          />

          {loading || !profile ? (
            <div className="h-24 bg-[var(--color-overlay)]/30 rounded animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-2">
              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Risk Appetite</span>
                {isEditingStrategy ? (
                  <select 
                    value={editForm.risk_profile} 
                    onChange={e => setEditForm({...editForm, risk_profile: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)] max-w-xs"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate / Balanced</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                ) : (
                  <div>
                    <span className={`inline-block px-3 py-1 rounded text-[11px] font-inter font-semibold border ${RISK_BADGES[profile.risk_profile] || RISK_BADGES.moderate}`}>
                      {RISK_LABELS[profile.risk_profile] || profile.risk_profile}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Primary Investment Goal</span>
                {isEditingStrategy ? (
                  <input 
                    type="text" 
                    value={editForm.investment_goal} 
                    onChange={e => setEditForm({...editForm, investment_goal: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                  />
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-semibold">{profile.investment_goal}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Investment Horizon</span>
                {isEditingStrategy ? (
                  <select 
                    value={editForm.investment_horizon} 
                    onChange={e => setEditForm({...editForm, investment_horizon: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="SHORT">Short Term (1-3 Years)</option>
                    <option value="MEDIUM">Medium Term (3-7 Years)</option>
                    <option value="LONG">Long Term (7+ Years)</option>
                  </select>
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">{profile.investment_horizon} Term</span>
                )}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="font-inter text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Trading & Market Experience</span>
                {isEditingStrategy ? (
                  <select 
                    value={editForm.experience_years} 
                    onChange={e => setEditForm({...editForm, experience_years: e.target.value})}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-gold)] max-w-xs"
                  >
                    <option value="BEGINNER">Beginner (0-2 Years)</option>
                    <option value="INTERMEDIATE">Intermediate (2-5 Years)</option>
                    <option value="EXPERIENCED">Experienced / Pro (5+ Years)</option>
                  </select>
                ) : (
                  <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">{profile.experience_years}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. SECURITY CARD */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[4px] p-6">
          <SectionHeader title="SECURITY & AUTHENTICATION" icon={LockKey} />
          
          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3.5 border-b border-[rgba(45,60,55,0.4)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">Two-Factor Authentication (2FA)</span>
                <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Add hardware or authenticator app security to your account</span>
              </div>
              <button className="bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] rounded px-3 py-1 font-inter text-[11px] hover:border-[var(--color-gold)] hover:text-[var(--color-text)] transition-all">
                Enable 2FA
              </button>
            </div>

            <div className="flex justify-between items-center py-3.5 border-b border-[rgba(45,60,55,0.4)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">Active Device Sessions</span>
                <span className="font-inter text-[11px] text-[var(--color-text-faint)]">
                  Current device &middot; Encrypted Active Session
                </span>
              </div>
              <button className="bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] rounded px-3 py-1 font-inter text-[11px] hover:border-[var(--color-gold)] hover:text-[var(--color-text)] transition-all">
                View Sessions
              </button>
            </div>

            <div className="flex justify-between items-center py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">Account Password</span>
                <span className="font-inter text-[11px] text-[var(--color-text-faint)]">
                  {passwordError ? (
                    <span className="text-[var(--color-loss)]">{passwordError}</span>
                  ) : passwordSuccess ? (
                    <span className="text-[#22c55e]">Password updated successfully</span>
                  ) : (
                    'Change or update your master terminal password'
                  )}
                </span>
              </div>
              <button onClick={handleChangePassword} className="bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] rounded px-3 py-1 font-inter text-[11px] hover:border-[var(--color-gold)] hover:text-[var(--color-text)] transition-all">
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* 5. DANGER ZONE */}
        <div className="bg-[rgba(182,106,106,0.03)] border-l-2 border-y border-r border-[var(--color-border)] border-l-[var(--color-loss)] rounded-[4px] p-6">
          <SectionHeader title="DANGER ZONE" icon={Trash} />
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">Sign Out</span>
                <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Terminate your active session on this terminal device.</span>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 bg-transparent border border-[var(--color-loss)]/60 text-[var(--color-loss)] rounded px-4 py-1.5 font-cinzel text-[11px] font-bold tracking-wider hover:bg-[var(--color-loss)]/10 transition-colors">
                <SignOut size={14} /> SIGN OUT
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[rgba(182,106,106,0.2)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[var(--color-text)] font-medium">Permanently Delete Account</span>
                <span className="font-inter text-[11px] text-[var(--color-text-faint)]">Irreversibly wipe your user account and all synced portfolios.</span>
              </div>
              <button onClick={handleDeleteAccount} className="flex items-center gap-1.5 bg-[var(--color-loss)]/10 border border-[var(--color-loss)] text-[var(--color-loss)] rounded px-4 py-1.5 font-cinzel text-[11px] font-bold tracking-wider hover:bg-[var(--color-loss)]/20 transition-colors">
                <Trash size={14} /> DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
