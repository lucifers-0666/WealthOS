import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, PieChart, Upload, BrainCircuit,
  Newspaper, Settings, ChevronLeft, ChevronRight,
  TrendingUp, Bell, Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { to:'/dashboard', icon: LayoutDashboard, label:'Dashboard'  },
  { to:'/portfolio',  icon: PieChart,         label:'Portfolio'  },
  { to:'/upload',     icon: Upload,           label:'Upload'     },
  { to:'/advisor',    icon: BrainCircuit,     label:'AI Advisor' },
  { to:'/news',       icon: Newspaper,        label:'News'       },
  { to:'/settings',   icon: Settings,         label:'Settings'   },
]

const PAGE_TITLES = {
  '/dashboard':'Dashboard','/portfolio':'Portfolio',
  '/upload':'Upload Data','/advisor':'AI Advisor',
  '/news':'Market News','/settings':'Settings'
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'WealthOS'

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'var(--bg)'}}>
      {/* Background orbs */}
      <div className="orb" style={{width:420,height:420,background:'rgba(59,130,246,0.06)',top:-80,left:-80}} />
      <div className="orb" style={{width:320,height:320,background:'rgba(139,92,246,0.05)',bottom:80,right:120}} />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 220 }}
        transition={{ duration: 0.28, ease:[0.16,1,0.3,1] }}
        className="relative flex-shrink-0 flex flex-col z-20"
        style={{
          background:'rgba(11,17,32,0.8)',
          backdropFilter:'blur(24px)',
          borderRight:'1px solid var(--border)'
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 overflow-hidden" style={{minHeight:64}}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{background:'linear-gradient(135deg,#3B82F6,#2563EB)'}}>
            <TrendingUp size={16} color="#fff" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}}
                transition={{duration:0.2}}
                className="font-display font-bold text-sm tracking-tight whitespace-nowrap"
                style={{color:'var(--text-1)'}}
              >WealthOS</motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="divider mx-3" />

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-2 pt-3 flex-1">
          {NAV.map(({to,icon:Icon,label}) => (
            <NavLink key={to} to={to} className={({isActive}) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${
                isActive
                  ? 'text-white'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/5'
              }`
            }>
              {({isActive}) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{background:'rgba(59,130,246,0.16)',border:'1px solid rgba(59,130,246,0.25)'}}
                      transition={{duration:0.25,ease:[0.16,1,0.3,1]}}
                    />
                  )}
                  <Icon size={17} className="relative z-10 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}}
                        transition={{duration:0.18}}
                        className="relative z-10 text-xs font-medium whitespace-nowrap"
                      >{label}</motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="btn-icon mx-auto mb-4"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            height:56,
            background:'rgba(5,8,22,0.75)',
            backdropFilter:'blur(16px)',
            borderBottom:'1px solid var(--border)'
          }}
        >
          <div>
            <p className="section-label">WealthOS</p>
            <h1 className="text-sm font-semibold" style={{color:'var(--text-1)'}}>{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-icon"><Search size={15}/></button>
            <button className="btn-icon"><Bell size={15}/></button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',color:'#fff'}}>
              L
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
