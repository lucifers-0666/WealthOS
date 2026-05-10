import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Upload, Bot, Newspaper, Settings, ChevronLeft, ChevronRight, TrendingUp, Bell, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { to:'/',          label:'Dashboard', icon:LayoutDashboard },
  { to:'/portfolio', label:'Portfolio', icon:Briefcase },
  { to:'/upload',    label:'Import',    icon:Upload },
  { to:'/advisor',   label:'AI Advisor',icon:Bot },
  { to:'/news',      label:'News',      icon:Newspaper },
  { to:'/settings',  label:'Settings',  icon:Settings },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const currentLabel = NAV.find(n => n.to === location.pathname)?.label || 'WealthOS'

  return (
    <div style={{ display:'flex', height:'100dvh', overflow:'hidden', background:'#050816' }}>
      <div style={{ position:'fixed', width:480, height:480, top:-140, left:-120, borderRadius:'50%', filter:'blur(110px)', pointerEvents:'none', zIndex:0, background:'radial-gradient(circle, rgba(59,130,246,0.09), transparent 70%)' }} />
      <div style={{ position:'fixed', width:360, height:360, bottom:80, right:0, borderRadius:'50%', filter:'blur(110px)', pointerEvents:'none', zIndex:0, background:'radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)' }} />

      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration:0.28, ease:[0.16,1,0.3,1] }}
        style={{ flexShrink:0, height:'100dvh', display:'flex', flexDirection:'column', background:'rgba(11,17,32,0.75)', backdropFilter:'blur(20px)', borderRight:'1px solid rgba(148,163,184,0.15)', position:'relative', zIndex:10 }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 16px 18px', minHeight:60 }}>
          <div style={{ width:32, height:32, flexShrink:0, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <TrendingUp size={16} color="#fff" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration:0.2 }}
                style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:15, color:'#F8FAFC', whiteSpace:'nowrap' }}>
                WealthOS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="divider" style={{ margin:'0 12px' }} />

        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2, padding:'12px 8px', overflowY:'auto' }}>
          {NAV.map(({ to, label, icon:Icon }) => (
            <NavLink key={to} to={to} end={to==='/'}>
              {({ isActive }) => (
                <motion.div whileHover={{ x: collapsed ? 0 : 2 }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding: collapsed ? '9px 14px' : '9px 12px', borderRadius:9, cursor:'pointer', position:'relative',
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                    color: isActive ? '#60A5FA' : '#94A3B8', transition:'all 180ms',
                    justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  {isActive && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:99, background:'linear-gradient(180deg,#22D3EE,#3B82F6)' }} />}
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-6 }} transition={{ duration:0.18 }}
                        style={{ fontSize:13, fontWeight: isActive ? 600 : 400, whiteSpace:'nowrap' }}>
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(148,163,184,0.15)' }}>
          <button onClick={() => setCollapsed(c => !c)} className="btn-icon" style={{ width:'100%', justifyContent:'center' }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </motion.aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', zIndex:1 }}>
        <header style={{ height:56, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(5,8,22,0.8)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(148,163,184,0.15)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:14, color:'#F8FAFC' }}>{currentLabel}</span>
            <span style={{ color:'#475569', fontSize:12 }}>/ Overview</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(148,163,184,0.05)', border:'1px solid rgba(148,163,184,0.15)', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>
              <Search size={12} color="#475569" />
              <span style={{ fontSize:12, color:'#475569' }}>Search...</span>
              <kbd style={{ fontSize:10, color:'#475569', background:'rgba(148,163,184,0.1)', padding:'1px 5px', borderRadius:4 }}>⌘K</kbd>
            </div>
            <button className="btn-icon" style={{ position:'relative' }}>
              <Bell size={14} />
              <span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:'#3B82F6' }} />
            </button>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer' }}>W</div>
          </div>
        </header>
        <main style={{ flex:1, overflowY:'auto', padding:'28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
