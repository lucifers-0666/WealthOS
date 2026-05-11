import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  Bot,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Command,
  LayoutDashboard,
  Newspaper,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const NAV = [
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard, group: 'Core' },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase, group: 'Core' },
  { to: '/upload', label: 'Import', icon: Upload, group: 'Data' },
  { to: '/advisor', label: 'Advisor', icon: Bot, group: 'Intelligence' },
  { to: '/news', label: 'Signals', icon: Newspaper, group: 'Intelligence' },
  { to: '/settings', label: 'System', icon: Settings, group: 'Control' },
]

const grouped = NAV.reduce((acc, item) => {
  acc[item.group] ||= []
  acc[item.group].push(item)
  return acc
}, {})

const titles = {
  '/dashboard': ['Command Center', 'Portfolio intelligence cockpit'],
  '/portfolio': ['Portfolio Matrix', 'Risk, allocation, and live exposure'],
  '/upload': ['Data Ingestion', 'Broker imports and OCR processing'],
  '/advisor': ['AI Analyst', 'Portfolio-aware financial reasoning'],
  '/news': ['Market Signals', 'Editorial intelligence feed'],
  '/settings': ['System Control', 'Keys, targets, and preferences'],
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const [title, sub] = titles[location.pathname] || ['WealthOS', 'Financial operating system']

  return (
    <div className="app-shell" style={{ minHeight: '100dvh', display: 'flex', overflow: 'hidden' }}>
      <motion.aside
        animate={{ width: collapsed ? 84 : 238 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flexShrink: 0,
          height: '100dvh',
          padding: 14,
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(148,163,184,0.14)',
            borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(11,23,40,0.78), rgba(7,17,31,0.58))',
            boxShadow: '0 24px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: collapsed ? '16px 12px' : '18px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                color: '#020617',
                background: 'linear-gradient(180deg, #D6C7A1, #7DD3FC)',
                boxShadow: '0 16px 34px rgba(125,211,252,0.14)',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>
                  <div className="editorial-title" style={{ fontSize: 17, lineHeight: 1 }}>WealthOS</div>
                  <div className="section-label" style={{ marginTop: 5 }}>Private Terminal</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="divider" />

          <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 9px' : '14px 10px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                {!collapsed && <div className="section-label" style={{ padding: '0 10px 8px' }}>{group}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to}>
                      {({ isActive }) => (
                        <motion.div
                          whileHover={{ x: collapsed ? 0 : 2 }}
                          style={{
                            minHeight: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 10,
                            padding: collapsed ? '0' : '0 10px',
                            position: 'relative',
                            borderRadius: 12,
                            border: `1px solid ${isActive ? 'rgba(125,211,252,0.22)' : 'transparent'}`,
                            color: isActive ? '#F3F4F6' : '#94A3B8',
                            background: isActive ? 'rgba(125,211,252,0.075)' : 'transparent',
                            transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        >
                          {isActive && (
                            <span
                              style={{
                                position: 'absolute',
                                left: -1,
                                top: 9,
                                bottom: 9,
                                width: 2,
                                borderRadius: 99,
                                background: 'linear-gradient(180deg, #D6C7A1, #7DD3FC)',
                                boxShadow: '0 0 16px rgba(125,211,252,0.35)',
                              }}
                            />
                          )}
                          <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
                          <AnimatePresence initial={false}>
                            {!collapsed && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>
                                {label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div style={{ padding: 10, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
            {!collapsed && (
              <div style={{ padding: '12px 10px', marginBottom: 10, borderRadius: 14, background: 'rgba(2,6,23,0.42)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#86EFAC', fontSize: 12, fontWeight: 700 }}>
                  <ShieldCheck size={14} /> Secure Sync
                </div>
                <div style={{ color: '#64748B', fontSize: 11, marginTop: 5 }}>Latency 22ms · encrypted</div>
              </div>
            )}
            <button onClick={() => setCollapsed((v) => !v)} className="btn-icon" style={{ width: '100%' }} aria-label="Toggle navigation">
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </div>
      </motion.aside>

      <div style={{ flex: 1, minWidth: 0, height: '100dvh', display: 'flex', flexDirection: 'column', padding: '14px 14px 14px 0' }}>
        <header
          style={{
            height: 62,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '0 16px 0 20px',
            border: '1px solid rgba(148,163,184,0.14)',
            borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(7,17,31,0.78), rgba(7,17,31,0.52))',
            boxShadow: '0 20px 70px rgba(0,0,0,0.32)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="section-label">Wealth Intelligence</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 2 }}>
              <h1 className="editorial-title" style={{ fontSize: 18 }}>{title}</h1>
              <span className="hide-mobile" style={{ color: '#64748B', fontSize: 12 }}>{sub}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 9, width: 280, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(2,6,23,0.45)' }}>
              <Search size={14} color="#64748B" />
              <span style={{ color: '#64748B', fontSize: 12, flex: 1 }}>Search assets, filings, notes</span>
              <span className="mono" style={{ color: '#64748B', fontSize: 10, border: '1px solid rgba(148,163,184,0.14)', borderRadius: 6, padding: '1px 5px' }}>CTRL K</span>
            </div>
            <div className="hide-tablet" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(134,239,172,0.18)', color: '#86EFAC', background: 'rgba(34,197,94,0.055)', fontSize: 12, fontWeight: 700 }}>
              <CircleDot size={13} /> Markets Open
            </div>
            <button className="btn-icon" aria-label="AI actions"><Zap size={15} /></button>
            <button className="btn-icon" aria-label="Command menu"><Command size={15} /></button>
            <button className="btn-icon" aria-label="Notifications" style={{ position: 'relative' }}>
              <Bell size={15} />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 99, background: '#D6C7A1' }} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(214,199,161,0.1)', border: '1px solid rgba(214,199,161,0.22)', color: '#D6C7A1', fontWeight: 800 }}>W</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 10px 10px 20px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
