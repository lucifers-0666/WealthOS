import React, { useState, useEffect } from 'react';
import {
  SquaresFour, Bell, X, BellSlash, Terminal, ChartPie, TrendUp,
  ArrowsLeftRight, Brain, Star, Gear, UserCircle, ChartBar, FileText, ArrowSquareOut
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/useAuth.js';
import { supabase } from '../lib/auth.js';

function useMarketStatus() {
  const [status, setStatus] = useState('closed')
  
  useEffect(() => {
    function check() {
      const now = new Date()
      // IST = UTC+5:30
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
      const ist = new Date(utcMs + 5.5 * 3600000)
      const day = ist.getDay()         // 0=Sun, 6=Sat
      const h = ist.getHours()
      const m = ist.getMinutes()
      const mins = h * 60 + m
      
      if (day === 0 || day === 6) { setStatus('closed'); return }
      if (mins >= 555 && mins < 915) { setStatus('open'); return }   // 9:15 – 15:15
      if (mins >= 540 && mins < 555) { setStatus('pre'); return }    // 9:00 – 9:15
      setStatus('closed')
    }
    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [])
  
  return status
}

function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Kolkata', hour12: false
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function TopbarRight() {
  const [activePanel, setActivePanel] = useState(null);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const marketStatus = useMarketStatus();

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const pRow = data || {};
        const name = pRow.full_name || pRow.display_name || user.user_metadata?.full_name || '';
        const parts = name.trim().split(' ').filter(Boolean);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.length > 0
            ? name.slice(0, 2).toUpperCase()
            : user.email.slice(0, 2).toUpperCase();
            
        setProfile({
          display_name: pRow.display_name || name || user.email.split('@')[0],
          initials
        });
      } catch (e) {
        console.error(e);
      }
    }
    loadProfile();
  }, [user]);

  const togglePanel = (name) => setActivePanel(prev => prev === name ? null : name);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActivePanel(null);
    };
    if (activePanel) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activePanel]);

  // Notifications Mock
  const notifications = [
    { id: 1, type: 'ALERT', read: false, title: 'Concentration Threshold Reached', body: 'HDFC Bank has exceeded 15% portfolio weight.', time: '2 hours ago' },
    { id: 2, type: 'TRADE', read: false, title: 'Buy Order Executed', body: '50 shares of INFY @ ₹1,425 placed successfully.', time: 'June 25, 2026' },
    { id: 3, type: 'SYSTEM', read: true, title: 'Market closed for the session', body: 'NSE/BSE trading hours ended at 15:30.', time: 'June 25, 2026' }
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {activePanel && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActivePanel(null)} />
      )}
      
      <div className="flex items-center relative z-50">
        <div className="flex items-center gap-2">
          <span className={`market-pill ${marketStatus === 'open' ? 'market-open' : 'market-closed'}`}>
            <span className={`status-dot ${marketStatus === 'open' ? 'dot-gain' : 'dot-muted'}`} />
            {marketStatus === 'open' ? 'MARKETS OPEN' : marketStatus === 'pre' ? 'PRE-OPEN' : 'MARKET CLOSED'}
          </span>
          <span className="topbar-clock font-mono text-[11px] text-[#7B7C70]">{useClock()}</span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(45,60,55,0.55)', margin: '0 12px' }} />

        <div className="flex items-center gap-[8px]">
          {/* Quick Launch */}
          <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <button 
              className={`topbar-icon-btn ${activePanel === 'quicklaunch' ? 'active' : ''}`}
              style={{ padding: 8, width: '100%', height: '100%' }}
              onClick={() => togglePanel('quicklaunch')}
            >
              <SquaresFour size={16} weight={activePanel === 'quicklaunch' ? 'fill' : 'regular'} />
            </button>
          <AnimatePresence>
            {activePanel === 'quicklaunch' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="panel-dropdown"
                style={{ right: -8, width: 200, padding: '14px 14px' }}
              >
                <div className="panel-header" style={{ padding: 0 }}>
                  <span>QUICK LAUNCH</span>
                  <button onClick={() => setActivePanel(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}><X size={13} /></button>
                </div>
                <div className="panel-sep" />
                <div className="grid grid-cols-3 gap-[8px]">
                  {[
                    { label: 'Terminal', icon: Terminal },
                    { label: 'Portfolio', icon: ChartPie },
                    { label: 'Market', icon: TrendUp },
                    { label: 'Trades', icon: ArrowsLeftRight },
                    { label: 'Advisor', icon: Brain },
                    { label: 'Watchlist', icon: Star }
                  ].map(item => (
                    <button key={item.label} className="ql-tile">
                      <item.icon size={20} className="ql-icon" />
                      <span className="ql-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        

        {/* Notifications */}
        <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
          <button 
            className={`topbar-icon-btn ${activePanel === 'notifications' ? 'active' : ''}`}
            style={{ padding: 8, width: '100%', height: '100%' }}
            onClick={() => togglePanel('notifications')}
          >
            <Bell size={16} weight={activePanel === 'notifications' ? 'fill' : 'regular'} className={unreadCount > 0 && activePanel !== 'notifications' ? 'text-primary' : ''} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          
          <AnimatePresence>
            {activePanel === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="panel-dropdown"
                style={{ right: -8, width: 300, maxHeight: 400, overflowY: 'auto' }}
              >
                <div className="panel-header" style={{ padding: '14px 16px' }}>
                  <span>NOTIFICATIONS</span>
                  <div className="flex items-center gap-[10px]">
                    <button className="text-[9px] font-medium text-[#7B7C70] hover:text-[#ECE0CC] transition-colors">MARK ALL READ</button>
                    <button onClick={() => setActivePanel(null)} className="text-[#7B7C70] hover:text-[#ECE0CC]"><X size={14} /></button>
                  </div>
                </div>
                <div className="panel-sep" style={{ margin: 0 }} />
                
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-[40px]">
                    <BellSlash size={32} className="text-[#7B7C70] mb-2" />
                    <span className="text-[#7B7C70] font-inter text-[12px]">No notifications</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((n, i) => (
                      <div key={n.id} className={`notif-row ${i === notifications.length - 1 ? 'last' : ''}`}>
                        <div className={`notif-dot ${n.read ? 'read' : 'unread'}`} />
                        <div className="notif-content">
                          <div className={`notif-title ${n.read ? 'read' : 'unread'}`}>{n.title}</div>
                          <div className="notif-body">{n.body}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                        <div className={`notif-type-badge ${n.type.toLowerCase()}`}>{n.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        

        {/* Profile Dropdown */}
        <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
          <button 
            className={`topbar-avatar ${activePanel === 'profile' ? 'active' : ''}`}
            onClick={() => togglePanel('profile')}
          >
            {profile?.initials ?? '..'}
          </button>
          
          <AnimatePresence>
            {activePanel === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="panel-dropdown"
                style={{ right: 0, width: 220 }}
              >
                <div className="flex items-center p-[14px_16px]">
                  <div className="profile-large-avatar">{profile?.initials ?? '..'}</div>
                  <div className="ml-[12px]">
                    <div className="font-inter font-semibold text-[13px] text-[#ECE0CC]">{profile?.display_name ?? 'Arca Member'}</div>
                    <div className="font-inter font-normal text-[10px] text-[#7B7C70]">Portfolio Owner</div>
                  </div>
                </div>
                <div className="panel-sep" style={{ margin: '0 0 6px 0' }} />
                
                <div className="flex flex-col pb-[6px]">
                  {[
                    { label: 'My Profile', icon: UserCircle },
                    { label: 'Settings', icon: Gear },
                    { label: 'Performance Report', icon: ChartBar },
                    { label: 'Export Portfolio', icon: FileText }
                  ].map(item => (
                    <button key={item.label} className="profile-menu-item">
                      <item.icon size={14} className="pm-icon" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="panel-sep" style={{ margin: '6px 0' }} />
                  <button onClick={async () => {
                    await signOut();
                    window.location.assign('/login');
                  }} className="profile-menu-item danger">
                    <ArrowSquareOut size={14} className="pm-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
                <div className="p-[10px_16px] font-inter text-[9px] text-[#7B7C70]">
                  v1.0.0 · Antigravity Terminal
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </>
  );
}
