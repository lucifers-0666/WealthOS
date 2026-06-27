import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth.js';
import { supabase } from '../lib/auth.js';
import { PhosphorLogo, WarningCircle, X } from '@phosphor-icons/react'; // Phosphor icons fallback

const PLAN_LABELS = {
  free:          'Free Tier',
  pro:           'Pro',
  premium:       'Premium',
  institutional: 'Institutional'
};

const PLAN_COLORS = {
  free:          'text-[#7B7C70]',
  pro:           'text-[#869FC4]',
  premium:       'text-[#C8B38E]',
  institutional: 'text-[#C8B38E]'
};

const RISK_LABELS = {
  conservative: 'Conservative',
  moderate:     'Moderate',
  aggressive:   'Aggressive',
  custom:       'Custom'
};

const RISK_COLORS = {
  conservative: 'text-[#869FC4]',
  moderate:     'text-[#D3A75B]', // status-warning
  aggressive:   'text-[#B66A6A]', // status-loss
  custom:       'text-[#C8B38E]'
};

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

export default function Profile() {
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', risk_profile: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        if (!user) throw new Error('Not authenticated');

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If no row exists, just use auth.user data fallback
          if (profileError.code !== 'PGRST116') throw profileError;
        }

        const pRow = profileRow || {};
        
        const name = pRow.full_name || pRow.display_name || user.user_metadata?.full_name || '';
        const parts = name.trim().split(' ').filter(Boolean);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.length > 0
            ? name.slice(0, 2).toUpperCase()
            : user.email.slice(0, 2).toUpperCase();

        const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric'
        });

        setProfile({
          id: user.id,
          full_name: pRow.full_name,
          display_name: pRow.display_name || name || user.email.split('@')[0],
          avatar_url: pRow.avatar_url,
          plan_tier: pRow.plan_tier || 'free',
          risk_profile: pRow.risk_profile || 'moderate',
          email: user.email,
          member_since: memberSince,
          initials
        });
        
        setEditForm({
          display_name: pRow.display_name || name || user.email.split('@')[0],
          risk_profile: pRow.risk_profile || 'moderate',
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

  const handleUpdateProfile = async () => {
    const updates = {
      display_name: editForm.display_name,
      risk_profile: editForm.risk_profile,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (!error) {
      setProfile(prev => ({ ...prev, ...updates }));
      setIsEditing(false);
    } else {
      setError(error.message);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordError(error.message);
    else setPasswordSuccess(true);
    
    setTimeout(() => {
      setPasswordError(null);
      setPasswordSuccess(false);
    }, 5000);
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        const response = await fetch((import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ user_id: profile.id })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to delete account');
        }
        
        await handleSignOut();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full items-center p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        
        {/* PAGE HEADER */}
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-[#ECE0CC] tracking-wide">Profile & Security</h1>
          <div className="font-inter text-[11px] text-[#7B7C70] mt-1">Account settings and session management</div>
        </div>

        {error && (
          <div className="bg-[rgba(182,106,106,0.1)] border border-[#B66A6A] p-3 rounded flex items-center gap-2 text-[#B66A6A] font-inter text-[12px]">
            <WarningCircle size={16} />
            <span>Could not load profile: {error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={14}/></button>
          </div>
        )}

        {/* PROFILE CARD */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_100ms_both]">
          <SectionHeader title="ACCOUNT DETAILS" />
          
          {loading || !profile ? (
            <div className="flex flex-col gap-5 mt-5">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#1E3530] animate-pulse"></div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-[#1E3530] rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-[#1E3530] rounded animate-pulse"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-[rgba(45,60,55,0.55)]">
                <div className="h-8 bg-[#1E3530] rounded animate-pulse w-[60%]"></div>
                <div className="h-8 bg-[#1E3530] rounded animate-pulse w-[50%]"></div>
                <div className="h-8 bg-[#1E3530] rounded animate-pulse w-[55%]"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-5 mt-5">
                <div className="w-16 h-16 rounded-full bg-[#172923] border border-[#2D3C37] flex items-center justify-center font-cinzel text-[20px] text-[#ECE0CC]">
                  {profile.initials}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.display_name} 
                      onChange={e => setEditForm({...editForm, display_name: e.target.value})}
                      className="bg-[#0A201F] border border-[#2D3C37] text-[#ECE0CC] font-cinzel text-sm px-2 py-1 rounded w-48 focus:border-[#C8B38E] outline-none"
                    />
                  ) : (
                    <div className="font-cinzel text-[18px] font-bold text-[#ECE0CC]">{profile.display_name}</div>
                  )}
                  <div className={`font-inter text-[11px] ${PLAN_COLORS[profile.plan_tier]}`}>
                    {PLAN_LABELS[profile.plan_tier]}
                  </div>
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="text-[#7B7C70] hover:text-[#ECE0CC] font-inter text-xs">Cancel</button>
                      <button onClick={handleUpdateProfile} className="bg-[#C8B38E] text-[#102321] px-3 py-1 rounded font-inter text-xs font-semibold">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="text-[#C8B38E] hover:text-[#ECE0CC] font-inter text-xs border border-transparent hover:border-[rgba(200,179,142,0.3)] px-3 py-1.5 rounded transition-all">Edit</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-[rgba(45,60,55,0.55)]">
                <div className="flex flex-col gap-1">
                  <span className="font-inter text-[9px] font-medium uppercase tracking-[0.14em] text-[#7B7C70]">Email Address</span>
                  <span className="font-cinzel text-[14px] text-[#ECE0CC]">{profile.email}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-inter text-[9px] font-medium uppercase tracking-[0.14em] text-[#7B7C70]">Member Since</span>
                  <span className="font-cinzel text-[14px] text-[#ECE0CC]">{profile.member_since}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-inter text-[9px] font-medium uppercase tracking-[0.14em] text-[#7B7C70]">Risk Profile</span>
                  {isEditing ? (
                    <select 
                      value={editForm.risk_profile}
                      onChange={e => setEditForm({...editForm, risk_profile: e.target.value})}
                      className="bg-[#0A201F] border border-[#2D3C37] text-[#ECE0CC] font-inter text-xs px-2 py-1 rounded w-32 focus:border-[#C8B38E] outline-none"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="custom">Custom</option>
                    </select>
                  ) : (
                    <span className={`font-cinzel text-[14px] ${RISK_COLORS[profile.risk_profile]}`}>
                      {RISK_LABELS[profile.risk_profile]}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* SECURITY CARD */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_200ms_both]">
          <SectionHeader title="SECURITY" />
          
          <div className="flex flex-col mt-4">
            <div className="flex justify-between items-center py-4 border-b border-[rgba(45,60,55,0.55)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Two-Factor Authentication</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Add an extra layer of security to your account</span>
              </div>
              <button className="bg-transparent border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[11px] hover:bg-[rgba(200,179,142,0.15)] hover:text-[#ECE0CC] hover:border-[#C8B38E] transition-all">
                Enable
              </button>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-[rgba(45,60,55,0.55)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Active Sessions</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">
                  {loading ? 'Loading...' : `Current device · Active now`}
                </span>
              </div>
              <button className="bg-transparent border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[11px] hover:bg-[rgba(200,179,142,0.15)] hover:text-[#ECE0CC] hover:border-[#C8B38E] transition-all">
                View All
              </button>
            </div>
            <div className="flex justify-between items-center py-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Change Password</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">
                  {passwordError ? <span className="text-[#B66A6A]">{passwordError}</span> : passwordSuccess ? <span className="text-[#C8B38E]">Password updated successfully</span> : 'Update your account password'}
                </span>
              </div>
              <button onClick={handleChangePassword} className="bg-transparent border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[11px] hover:bg-[rgba(200,179,142,0.15)] hover:text-[#ECE0CC] hover:border-[#C8B38E] transition-all">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="bg-[rgba(182,106,106,0.04)] border-l-2 border-y border-r border-[#2D3C37] border-l-[#B66A6A] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
          <SectionHeader title="DANGER ZONE" />
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-inter text-[12px] text-[#ACA492]">Sign out of your current session on this device.</span>
              <button onClick={handleSignOut} className="bg-transparent border border-[#B66A6A] text-[#B66A6A] rounded-[3px] px-4 py-1.5 h-[30px] font-cinzel text-[11px] font-bold tracking-wide hover:bg-[rgba(182,106,106,0.15)] transition-colors">
                SIGN OUT
              </button>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[rgba(182,106,106,0.2)]">
              <span className="font-inter text-[12px] text-[#ACA492]">Permanently delete your account and all associated data.</span>
              <button onClick={handleDeleteAccount} className="bg-[rgba(182,106,106,0.1)] border border-[#B66A6A] text-[#B66A6A] rounded-[3px] px-4 py-1.5 h-[30px] font-cinzel text-[11px] font-bold tracking-wide hover:bg-[rgba(182,106,106,0.2)] transition-colors">
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
