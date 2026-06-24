import React from 'react';
import { useAuth } from '../lib/useAuth.js';

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
  
  const email = user?.email || 'user@arca.wealth';
  const initial = email.charAt(0).toUpperCase();
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : 'Jan 2024';

  const handleSignOut = async () => {
    await signOut();
    window.location.assign('/login');
  };

  return (
    <div className="flex flex-col min-h-0 h-full items-center p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        
        {/* 1. PAGE HEADER */}
        <div>
          <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide">Profile & Security</h1>
          <div className="font-inter text-[11px] text-[#7B7C70] mt-1">Account settings and session management</div>
        </div>

        {/* 3. PROFILE CARD */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_100ms_both]">
          <SectionHeader title="ACCOUNT DETAILS" />
          
          <div className="flex items-center gap-5 mt-5">
            <div className="w-16 h-16 rounded-full bg-[rgba(200,179,142,0.15)] border border-[#C8B38E] flex items-center justify-center font-cinzel text-2xl text-[#C8B38E]">
              {initial}
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-cinzel text-[16px] font-bold text-[#ECE0CC]">Arca Member</div>
              <div className="font-inter text-[12px] text-[#ACA492]">Free Tier</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-[rgba(45,60,55,0.55)]">
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[10px] uppercase tracking-wide text-[#7B7C70]">Email Address</span>
              <span className="font-mono text-[13px] text-[#ECE0CC]">{email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[10px] uppercase tracking-wide text-[#7B7C70]">Member Since</span>
              <span className="font-inter text-[13px] text-[#ECE0CC]">{joinDate}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[10px] uppercase tracking-wide text-[#7B7C70]">Risk Profile</span>
              <span className="font-inter text-[13px] text-[#C8B38E]">Moderate</span>
            </div>
          </div>
        </div>

        {/* 4. SECURITY CARD */}
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_200ms_both]">
          <SectionHeader title="SECURITY" />
          
          <div className="flex flex-col mt-4">
            <div className="flex justify-between items-center py-4 border-b border-[rgba(45,60,55,0.55)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Two-Factor Authentication</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Add an extra layer of security to your account</span>
              </div>
              <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[11px] hover:text-[#ECE0CC] hover:border-[rgba(200,179,142,0.3)] transition-colors">
                Enable
              </button>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-[rgba(45,60,55,0.55)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Active Sessions</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Manage devices logged into your account</span>
              </div>
              <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[11px] hover:text-[#ECE0CC] hover:border-[rgba(200,179,142,0.3)] transition-colors">
                View All
              </button>
            </div>
            <div className="flex justify-between items-center py-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter text-[13px] text-[#ECE0CC]">Change Password</span>
                <span className="font-inter text-[11px] text-[#7B7C70]">Update your account password</span>
              </div>
              <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-3 py-1.5 font-inter text-[11px] hover:text-[#ECE0CC] hover:border-[rgba(200,179,142,0.3)] transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* 5. DANGER ZONE */}
        <div className="bg-[#172923] border border-[#B66A6A] rounded-[3px] p-6 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
          <SectionHeader title="DANGER ZONE" />
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-inter text-[12px] text-[#ACA492]">Sign out of your current session on this device.</span>
              <button onClick={handleSignOut} className="bg-[rgba(182,106,106,0.15)] border border-[#B66A6A] text-[#B66A6A] rounded-[3px] px-4 py-1.5 font-inter text-[11px] font-bold tracking-wide hover:bg-[rgba(182,106,106,0.25)] transition-colors">
                SIGN OUT
              </button>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[rgba(182,106,106,0.3)]">
              <span className="font-inter text-[12px] text-[#ACA492]">Permanently delete your account and all associated data.</span>
              <button className="border border-[#B66A6A] text-[#B66A6A] rounded-[3px] px-4 py-1.5 font-inter text-[11px] font-bold tracking-wide hover:bg-[rgba(182,106,106,0.15)] transition-colors">
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
