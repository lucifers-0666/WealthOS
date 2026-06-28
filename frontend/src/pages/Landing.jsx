import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, LockSimple, ShieldCheck, Check, TwitterLogo, 
  LinkedinLogo, GithubLogo, Eye, Lock, UserMinus, 
  Warning, TrendUp, Star, Copyright
} from '@phosphor-icons/react';
import './Landing.css';

// Custom Hook for Scroll Animations & Counter
const useScrollAnimations = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Counter animation
            if (entry.target.hasAttribute('data-count-to')) {
              const target = parseFloat(entry.target.getAttribute('data-count-to'));
              const prefix = entry.target.getAttribute('data-prefix') || '';
              const suffix = entry.target.getAttribute('data-suffix') || '';
              const decimals = parseInt(entry.target.getAttribute('data-decimals') || '0', 10);
              const duration = 1400; // 1.4s
              const start = performance.now();
              
              const updateCounter = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutQuart
                const easeOut = 1 - Math.pow(1 - progress, 4);
                const current = (target * easeOut).toFixed(decimals);
                
                entry.target.textContent = `${prefix}${current}${suffix}`;
                
                if (progress < 1) {
                  requestAnimationFrame(updateCounter);
                } else {
                  entry.target.textContent = `${prefix}${target}${suffix}`;
                }
              };
              requestAnimationFrame(updateCounter);
              // Prevent re-triggering
              entry.target.removeAttribute('data-count-to');
            }
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.animate-on-scroll, .stagger-child').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

// Section 00 — FIXED NAVBAR
const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div className="nav-wrapper">
      <div className="fixed-navbar">
        <div className="nav-left">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 24 L16 10 L24 24" />
            <path d="M11 20 H21" strokeWidth="1.5" />
          </svg>
          <span className="nav-logo-text">ARCA</span>
          <div className="nav-separator"></div>
          <span className="nav-subtitle">PRIVATE TERMINAL</span>
        </div>
        <div className="nav-center">
          <a href="#features" className="nav-link">Features</a>
          <a href="#intelligence" className="nav-link">Intelligence</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#security" className="nav-link">Security</a>
          <a href="#about" className="nav-link">About</a>
        </div>
        <div className="nav-right">
          <button className="btn-nav-ghost" onClick={() => navigate('/login')}>
            LOG IN
          </button>
          <div className="nav-divider"></div>
          <button className="nav-cta-primary" onClick={() => navigate('/onboarding')} aria-label="Open ARCA Terminal">
            GET ACCESS →
          </button>
        </div>
      </div>
      <div className="meander-strip" />
    </div>
  );
};

// Coded Donut Chart component supporting multiple sizes
const DonutChart = ({ size = 128, strokeWidth = 20 }) => {
  const segments = [
    { pct: 18.5, color: 'var(--color-gold)' },
    { pct: 15.2, color: 'var(--color-gain)' },
    { pct: 12.8, color: '#A07840' },
    { pct: 11.3, color: 'var(--color-blue)' },
    { pct: 9.7,  color: 'var(--color-loss)' },
    { pct: 8.4,  color: '#5A7A6A' },
    { pct: 24.1, color: '#3D4D47' },
  ];
  const r = size / 2.5;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-card)" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circ;
        const gap = circ - dash;
        const rotate = (offset / 100) * 360 - 90;
        offset += seg.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotate}, ${cx}, ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy - (size * 0.03)} textAnchor="middle"
        fontFamily="JetBrains Mono" fontSize={size * 0.09} fontWeight="700" fill="var(--color-text)">7</text>
      <text x={cx} y={cy + (size * 0.08)} textAnchor="middle"
        fontFamily="Inter" fontSize={size * 0.055} fill="var(--color-text-faint)" letterSpacing="1">HOLDINGS</text>
    </svg>
  );
};

// Section 01 — HERO CODED DASHBOARD
const HeroDashboard = () => (
  <div className="hero-dashboard-card">
    {/* Top row: 3 mini KPI chips in gold/teal */}
    <div className="hero-db-kpis">
      <div className="hero-db-kpi">
        <span className="hero-db-kpi-label">PORTFOLIO</span>
        <span className="hero-db-kpi-val">₹25,74,000</span>
      </div>
      <div className="hero-db-kpi gold-border">
        <span className="hero-db-kpi-label">TODAY'S CHANGE</span>
        <span className="hero-db-kpi-val gain">+2.34%</span>
      </div>
      <div className="hero-db-kpi">
        <span className="hero-db-kpi-label">AI CONFIDENCE</span>
        <span className="hero-db-kpi-val">94.2%</span>
      </div>
    </div>

    {/* Center: donut chart + Right sidebar: holdings */}
    <div className="hero-db-body">
      <div className="hero-db-chart">
        <DonutChart size={160} strokeWidth={18} />
      </div>
      <div className="hero-db-sidebar">
        <div className="hero-db-hold">
          <span className="hero-db-hold-name">HDFCBANK</span>
          <span className="hero-db-hold-pct">18.5%</span>
        </div>
        <div className="hero-db-hold">
          <span className="hero-db-hold-name">RELIANCE</span>
          <span className="hero-db-hold-pct">12.8%</span>
        </div>
      </div>
    </div>

    {/* Bottom: 2 activity pills */}
    <div className="hero-db-footer">
      <div className="hero-db-act-pill">
        <span className="badge buy">BUY</span>
        <span className="text">INFY 50 @ ₹1,425</span>
      </div>
      <div className="hero-db-act-pill">
        <span className="badge sell">SELL</span>
        <span className="text">ITC 100 @ ₹412</span>
      </div>
    </div>
  </div>
);

// Section 02 — HERO
const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="hero-section">
      <div className="hero-bg-gradient"></div>
      <div className="hero-noise"></div>

      <div className="hero-grid">
        <div className="hero-left">
          <div className="hero-pre-title">WEALTH INTELLIGENCE PLATFORM</div>
          <h1 className="hero-heading">
            Intelligence for Private Wealth.
          </h1>
          <p className="hero-subtitle">
            Built for investors who manage real money across equities, bonds, and alternatives — not for casual app users.
          </p>

          <div className="hero-social-proof">
            <span className="hero-social-text">
              (Illustrative preview — not live trading data)
            </span>
          </div>

          <div className="hero-cta-row">
            <button className="btn-primary" onClick={() => navigate('/onboarding')} aria-label="Open ARCA Terminal">
              OPEN TERMINAL →
            </button>
            <button className="btn-secondary">
              <span className="play-icon"><Play size={12} weight="fill" /></span> Watch 90-sec Demo
            </button>
          </div>
        </div>

        <div className="hero-right">
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
};

// Section 02 — MARQUEE TRUST BAR
const TrustBar = () => {
  const items = [
    "Read-Only Access", "TLS 1.3 Protocol", "256-bit AES Encrypted", 
    "No Third-Party Data Sharing", "Target Latency < 25ms", 
    "INR-Native", "99.98% Uptime", "OAuth Token Based"
  ];
  return (
    <section className="marquee-section">
      <div className="marquee-mask left"></div>
      <div className="marquee-mask right"></div>
      <div className="marquee-track">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="marquee-item">
            <span className="marquee-icon">✦</span>
            {item}
            <span className="marquee-separator">·</span>
          </div>
        ))}
      </div>
    </section>
  );
};

// Section 03 — PROBLEM STATEMENT
const ProblemStatement = () => {
  return (
    <section className="problem-section">
      <div className="problem-sticky">
        <span className="section-label center animate-on-scroll">THE PROBLEM</span>
        <h2 className="problem-heading animate-on-scroll">
          Your Portfolio Deserves Better Than a Spreadsheet.
        </h2>
        
        <div className="problem-divider animate-on-scroll"></div>
        
        <p className="problem-body animate-on-scroll">
          Most investors manage wealth through PDFs, Excel, and fragmented broker apps. Lack of data, slow tools, and missed opportunities are costing you clarity — and potentially, returns.
        </p>
        
        <div className="problem-stats animate-on-scroll">
          <div className="problem-stat">
            <span className="problem-stat-value animate-on-scroll" data-count-to="25" data-prefix="< " data-suffix="ms" data-decimals="0">&lt; 25ms</span>
            <span className="problem-stat-label">TARGET DATA LATENCY</span>
            <span className="problem-stat-sub">designed for real-time</span>
          </div>
          <div className="p-stat-sep"></div>
          <div className="problem-stat">
            <span className="problem-stat-value animate-on-scroll" data-count-to="100" data-suffix="%" data-decimals="0">100%</span>
            <span className="problem-stat-label">READ-ONLY BY DESIGN</span>
            <span className="problem-stat-sub">we never touch your capital</span>
          </div>
          <div className="p-stat-sep"></div>
          <div className="problem-stat">
            <span className="problem-stat-value animate-on-scroll" data-count-to="0" data-decimals="0">0</span>
            <span className="problem-stat-label">THIRD-PARTY DATA SOLD</span>
            <span className="problem-stat-sub">your data stays yours</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// Section 04 — FEATURES
const FeaturesSection = () => {
  return (
    <section className="features-section" id="features">
      <span className="section-label animate-on-scroll">THE FEATURES</span>
      <h2 className="features-heading animate-on-scroll">
        A Complete Intelligence Layer for Your Wealth.
      </h2>
      <p className="features-subtext animate-on-scroll">
        Every tool you need. Nothing you don't.
      </p>
      
      <div className="bento-grid">
        {/* CARD A — YOUR COMMAND CENTER */}
        <div className="bento-card card-a bento-card-hero animate-on-scroll" style={{transitionDelay: '0ms'}}>
          <div className="bento-header">YOUR COMMAND CENTER</div>
          <div className="card-a-title">Your Command Center</div>
          <div className="card-a-desc">
            Live P&L, allocation donut, AI brief — your entire portfolio at a glance. Updated in real time.
          </div>
          
          <div className="card-a-visual">
            <div className="card-a-bar-row">
              <div className="bar-labels">
                <span className="bar-name">HDFC Bank</span>
                <span className="bar-val">18.5%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '18.5%', background: 'var(--color-gold)' }}></div>
              </div>
            </div>
            <div className="card-a-bar-row">
              <div className="bar-labels">
                <span className="bar-name">Infosys</span>
                <span className="bar-val">12.8%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '12.8%', background: 'var(--color-blue)' }}></div>
              </div>
            </div>
            <div className="card-a-bar-row">
              <div className="bar-labels">
                <span className="bar-name">Reliance</span>
                <span className="bar-val">9.7%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '9.7%', background: 'rgba(200,179,142,0.4)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD B — AI ADVISORY */}
        <div className="bento-card card-b animate-on-scroll" style={{transitionDelay: '80ms'}}>
          <div className="bento-header">AI ADVISORY</div>
          <div className="card-b-title">Advisory</div>
          <p className="card-b-body-text">
            Plain-language portfolio analysis generated for your specific holdings.
          </p>
          <div className="ai-pills-stack">
            <div className="ai-status-pill warn">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight: 6}}><path d="M8 2 L14 13 H2 Z M8 5 V9 M8 11 H8.01" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Rebalance suggested
            </div>
            <div className="ai-status-pill gain">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight: 6}}><path d="M2 13 L6 9 L10 11 L14 6 M14 9 V6 H11" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Tech overweight
            </div>
          </div>
        </div>

        {/* CARD C — LIVE MARKET DATA */}
        <div className="bento-card card-c animate-on-scroll" style={{transitionDelay: '160ms'}}>
          <div className="bento-header">LIVE MARKET DATA</div>
          <div className="card-c-title">Market Feeds</div>
          <p className="card-c-body-text">
            NSE/BSE data flowing directly into your portfolio positions.
          </p>
          <div className="mini-ticker-table">
            <div className="ticker-row">
              <span className="tick-name">NIFTY 50</span>
              <span className="tick-val">22,419</span>
              <span className="tick-chg gain">+0.42%</span>
            </div>
            <div className="ticker-row">
              <span className="tick-name">SENSEX</span>
              <span className="tick-val">73,806</span>
              <span className="tick-chg gain">+0.45%</span>
            </div>
            <div className="ticker-row">
              <span className="tick-name">USD/INR</span>
              <span className="tick-val">83.24</span>
              <span className="tick-chg loss">-0.12%</span>
            </div>
          </div>
        </div>

        {/* CARD D — TRANSACTION LOG */}
        <div className="bento-card card-d animate-on-scroll" style={{transitionDelay: '240ms'}}>
          <div className="bento-header">TRANSACTION LOG</div>
          <div className="card-d-title">Activity Log</div>
          <p className="card-d-body-text">
            Every buy, sell, and dividend — automatically categorised.
          </p>
          <div className="tx-log-table">
            <div className="tx-row">
              <span className="tx-badge buy">BUY</span>
              <span className="tx-symbol">INFY</span>
              <span className="tx-details">50 @ ₹1,425</span>
              <span className="tx-date">Jun 15</span>
            </div>
            <div className="tx-row">
              <span className="tx-badge sell">SELL</span>
              <span className="tx-symbol">ITC</span>
              <span className="tx-details">100 @ ₹412</span>
              <span className="tx-date">Jun 14</span>
            </div>
            <div className="tx-row">
              <span className="tx-badge buy">BUY</span>
              <span className="tx-symbol">HDFC</span>
              <span className="tx-details">25 @ ₹1,650</span>
              <span className="tx-date">Jun 12</span>
            </div>
            <div className="tx-row">
              <span className="tx-badge buy">BUY</span>
              <span className="tx-symbol">TCS</span>
              <span className="tx-details">15 @ ₹3,820</span>
              <span className="tx-date">Jun 10</span>
            </div>
            <div className="tx-row">
              <span className="tx-badge buy">BUY</span>
              <span className="tx-symbol">INFY</span>
              <span className="tx-details">30 @ ₹1,390</span>
              <span className="tx-date">Jun 8</span>
            </div>
          </div>
        </div>

        {/* CARD E — WATCHLIST */}
        <div className="bento-card card-e animate-on-scroll" style={{transitionDelay: '320ms'}}>
          <div className="bento-header">WATCHLIST</div>
          <div className="card-e-title">Watchlist</div>
          <p className="card-e-body-text">
            Track stocks before you commit.
          </p>
          <div className="wl-rows">
            <div className="wl-row">
              <span className="wl-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--color-gold)" strokeWidth="1.5"><path d="M8 1.5 L10.2 6 L15 6.5 L11.3 9.7 L12.5 14.5 L8 12 L3.5 14.5 L4.7 9.7 L1 6.5 L5.8 6 Z" strokeLinejoin="round" fill="none"/></svg>
              </span>
              <span className="wl-ticker">BAJFINANCE</span>
              <span className="wl-price">₹7,245</span>
              <span className="wl-chg gain">↑ +2.34%</span>
            </div>
            <div className="wl-row">
              <span className="wl-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--color-gold)" strokeWidth="1.5"><path d="M8 1.5 L10.2 6 L15 6.5 L11.3 9.7 L12.5 14.5 L8 12 L3.5 14.5 L4.7 9.7 L1 6.5 L5.8 6 Z" strokeLinejoin="round" fill="none"/></svg>
              </span>
              <span className="wl-ticker">ASIANPAINT</span>
              <span className="wl-price">₹2,892</span>
              <span className="wl-chg loss">↓ -0.87%</span>
            </div>
            <div className="wl-row">
              <span className="wl-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--color-gold)" strokeWidth="1.5"><path d="M8 1.5 L10.2 6 L15 6.5 L11.3 9.7 L12.5 14.5 L8 12 L3.5 14.5 L4.7 9.7 L1 6.5 L5.8 6 Z" strokeLinejoin="round" fill="none"/></svg>
              </span>
              <span className="wl-ticker">HDFCLIFE</span>
              <span className="wl-price">₹645</span>
              <span className="wl-chg gain">↑ +1.12%</span>
            </div>
          </div>
        </div>

        {/* CARD F — CONCENTRATION ALERTS */}
        <div className="bento-card card-f animate-on-scroll" style={{transitionDelay: '400ms'}}>
          <div className="bento-header">CONCENTRATION ALERTS</div>
          <div className="card-f-title">Risk Alerts</div>
          <p className="card-f-body-text">
            Know when a holding dominates beyond your target limit.
          </p>
          <div className="warn-banner">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight: 8, flexShrink: 0}}><path d="M8 2 L14 13 H2 Z M8 5 V9 M8 11 H8.01" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="warn-text">Financials: 33.7% — above your 30% target</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// Section 05 — FULL-WIDTH PRODUCT PREVIEW
const ProductPreview = () => {
  return (
    <section className="preview-section" id="intelligence">
      <div className="preview-top">
        <span className="section-label center animate-on-scroll">THE PREVIEW</span>
        <h2 className="preview-heading animate-on-scroll">
          See Exactly What You Get.
        </h2>
        <p className="preview-subtitle animate-on-scroll">
          The actual interface — not marketing illustrations. The same view real users open every morning.
        </p>
      </div>

      <div className="preview-dashboard-wrapper animate-on-scroll">
        <div className="browser-chrome">
          <div className="browser-dots">
            <div className="b-dot r"></div>
            <div className="b-dot y"></div>
            <div className="b-dot g"></div>
          </div>
          <span className="browser-url">app.arca.finance/dashboard</span>
          <LockSimple size={12} color="var(--color-gain)" style={{marginLeft: 'auto'}} />
        </div>
        <div className="dashboard-frame-wrapper">
          <div className="dashboard-scale-container">
            {/* Coded mockup of the full dashboard UI layout */}
            <div style={{display: 'flex', height: '420px', background: 'var(--color-bg)'}}>
              {/* Sidebar (120px) */}
              <div style={{width: '120px', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', padding: '16px 12px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px'}}>
                  <div style={{width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--color-gold)'}}></div>
                  <span style={{fontFamily: 'Cinzel', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text)'}}>ARCA</span>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {['Dashboard', 'Watchlist', 'Analytics', 'Alerts', 'Settings'].map((item, i) => (
                    <div key={i} style={{fontSize: '9px', fontFamily: 'Inter', color: i === 0 ? 'var(--color-text)' : 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <div style={{width: '6px', height: '6px', background: i === 0 ? 'var(--color-gold)' : 'transparent', borderRadius: '50%'}}></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                {/* Topbar */}
                <div style={{height: '36px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px'}}>
                  <div style={{fontFamily: 'Cinzel', fontSize: '9px', color: 'var(--color-text)'}}>COMMAND CENTER</div>
                  <div className="db-status-pill"><div className="db-status-dot"></div>MARKETS OPEN</div>
                </div>
                
                {/* Main Dashboard Workspace */}
                <div style={{flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {/* Top: 4 KPI cards */}
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px'}}>
                    <div className="db-kpi-card gold-border" style={{padding: '8px 12px'}}>
                      <div style={{fontSize: '7px', color: 'var(--color-text-faint)', textTransform: 'uppercase'}}>PORTFOLIO VALUE</div>
                      <div style={{fontSize: '13px', color: 'var(--color-text)', fontFamily: 'JetBrains Mono', fontWeight: 'bold'}}>₹25,74,000</div>
                    </div>
                    <div className="db-kpi-card" style={{padding: '8px 12px'}}>
                      <div style={{fontSize: '7px', color: 'var(--color-text-faint)', textTransform: 'uppercase'}}>TOTAL INVESTED</div>
                      <div style={{fontSize: '13px', color: 'var(--color-text)', fontFamily: 'JetBrains Mono', fontWeight: 'bold'}}>₹22,10,000</div>
                    </div>
                    <div className="db-kpi-card" style={{padding: '8px 12px'}}>
                      <div style={{fontSize: '7px', color: 'var(--color-text-faint)', textTransform: 'uppercase'}}>TOTAL P&L</div>
                      <div style={{fontSize: '13px', color: 'var(--color-gain)', fontFamily: 'JetBrains Mono', fontWeight: 'bold'}}>+₹3,64,000</div>
                    </div>
                    <div className="db-kpi-card" style={{padding: '8px 12px'}}>
                      <div style={{fontSize: '7px', color: 'var(--color-text-faint)', textTransform: 'uppercase'}}>TODAY'S CHANGE</div>
                      <div style={{fontSize: '13px', color: 'var(--color-gain)', fontFamily: 'JetBrains Mono', fontWeight: 'bold'}}>+2.34%</div>
                    </div>
                  </div>
                  
                  {/* Middle Row */}
                  <div style={{display: 'flex', gap: '12px', flex: 1}}>
                    {/* Middle-left: Donut */}
                    <div style={{flex: 3, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '3px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px'}}>
                      <DonutChart size={100} strokeWidth={14} />
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                        <div style={{fontSize: '9px', color: 'var(--color-text)', fontFamily: 'Cinzel', fontWeight: 'bold'}}>Allocation</div>
                        <div style={{fontSize: '8px', color: 'var(--color-text-faint)'}}>7 major holdings across financials, technology, and energy sectors.</div>
                      </div>
                    </div>
                    {/* Middle-right: Position Weights */}
                    <div style={{flex: 2, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '3px', padding: '12px'}}>
                      <div style={{fontSize: '8px', color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: '8px'}}>POSITION WEIGHTS</div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'JetBrains Mono', color: 'var(--color-text)'}}>
                          <span>HDFCBANK</span><span>18.5%</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'JetBrains Mono', color: 'var(--color-text)'}}>
                          <span>RELIANCE</span><span>12.8%</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'JetBrains Mono', color: 'var(--color-text)'}}>
                          <span>INFY</span><span>11.3%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Activity Feed */}
                  <div style={{background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '3px', padding: '10px 12px'}}>
                    <div style={{fontSize: '8px', color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: '4px'}}>ACTIVITY FEED</div>
                    <div style={{display: 'flex', gap: '16px', fontSize: '9px', fontFamily: 'JetBrains Mono'}}>
                      <div style={{color: 'var(--color-gain)'}}>[BUY] INFY 50 @ ₹1,425</div>
                      <div style={{color: 'var(--color-loss)'}}>[SELL] ITC 100 @ ₹412</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="preview-fade-mask" />
      </div>
    </section>
  );
};

// Section 06 — TESTIMONIALS
const Testimonials = () => {
  const testimonials = [
    {
      quote: "The portfolio view I've always wanted. Everything visible in one place — I stopped using 3 separate apps the day I tried this.",
      author: "R.M.",
      title: "Independent Equity Investor · Mumbai"
    },
    {
      quote: "The AI brief actually reads my portfolio, not some generic advice. That alone is worth the subscription.",
      author: "P.K.",
      title: "Retired CFO · Bengaluru"
    },
    {
      quote: "I've been investing for 22 years. This is the first tool that feels built for serious investors, not beginners.",
      author: "S.A.",
      title: "HNI Investor · Delhi NCR"
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="testimonials-header">
        <span className="section-label center animate-on-scroll">THE TESTIMONIALS</span>
        <h2 className="section-top-heading animate-on-scroll" style={{ margin: '0 auto 16px auto', maxWidth: '580px', textAlign: 'center' }}>
          Built for People Who Take Their Wealth Seriously.
        </h2>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: '12px',
          marginBottom: '0',
          fontStyle: 'italic'
        }}>
          Testimonials are illustrative and do not represent verified financial results.
        </p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((t, idx) => (
          <div key={idx} className="t-card animate-on-scroll" style={{transitionDelay: `${idx * 100}ms`}}>
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="testimonial-star">★</span>
              ))}
            </div>
            <span className="t-quote-mark">"</span>
            <blockquote className="testimonial-quote">{t.quote}</blockquote>
            <div className="t-sep"></div>
            
            <div className="t-author-row">
              <div className="t-avatar">
                {t.author.replace(/\./g, '')}
              </div>
              <div className="t-author-info">
                <span className="testimonial-author-name">{t.author}</span>
                <span className="testimonial-author-title">{t.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Section 07 — HOW IT WORKS
const HowItWorks = () => {
  return (
    <section className="how-section">
      <span className="section-label animate-on-scroll">HOW IT WORKS</span>
      <h2 className="section-top-heading animate-on-scroll" style={{ marginBottom: '48px' }}>
        Three Steps. Then You're In.
      </h2>

      <div className="how-steps-container">
        <div className="how-step animate-on-scroll">
          <div className="how-step-number">01</div>
          <div className="step-content">
            <h3 className="step-title">Import Your Holdings</h3>
            <p className="step-body">Connect your broker via CSV upload or our secure API integration. Your data imports in under 60 seconds.</p>
            <div className="how-step-chips">
              <span className="how-step-chip">CSV Upload</span>
              <span className="how-step-chip">Live API</span>
              <span className="how-step-chip">Manual Entry</span>
            </div>
          </div>
        </div>

        <div className="how-step animate-on-scroll">
          <div className="how-step-number">02</div>
          <div className="step-content">
            <h3 className="step-title">Set Your Preferences</h3>
            <p className="step-body">Define your risk profile, target allocation, and alert thresholds. ARCA learns your investment style.</p>
            <div className="how-step-chips">
              <span className="how-step-chip">Risk Profile</span>
              <span className="how-step-chip">Sector Limits</span>
              <span className="how-step-chip">Alerts</span>
            </div>
          </div>
        </div>

        <div className="how-step animate-on-scroll">
          <div className="how-step-number">03</div>
          <div className="step-content">
            <h3 className="step-title">Open the Terminal</h3>
            <p className="step-body">Your personalised Command Center is ready. Live data, AI brief, alerts — everything in one view.</p>
            <div className="how-step-chips">
              <span className="how-step-chip">Live Dashboard</span>
              <span className="how-step-chip">AI Brief</span>
              <span className="how-step-chip">Alerts Active</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

// Section 08 — TRUST
const SecuritySection = () => {
  return (
    <section className="security-section" id="security">
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <span className="section-label center animate-on-scroll">THE TRUST</span>
        <h2 className="section-top-heading animate-on-scroll" style={{ margin: '0 auto 16px auto', maxWidth: 'none', textAlign: 'center' }}>
          Your Data Lives By Your Rules.
        </h2>
        <p className="preview-subtitle animate-on-scroll" style={{ margin: '0 auto', maxWidth: '500px', textAlign: 'center' }}>
          Read-only access. No credentials stored. Your data is never shared.
        </p>
      </div>

      <div className="sec-grid">
        <div className="sec-card animate-on-scroll">
          <Eye size={24} className="sec-icon" />
          <h3 className="sec-title">READ-ONLY API INTEGRATION</h3>
          <p className="sec-body">We connect to your broker in read-only mode. ARCA can view your data — never move funds, place orders, or execute any transaction.</p>
        </div>
        
        <div className="sec-card animate-on-scroll">
          <ShieldCheck size={24} className="sec-icon" />
          <h3 className="sec-title">NO THIRD-PARTY DATA SHARING</h3>
          <p className="sec-body">Your holdings, transactions, and portfolio data are never shared with, sold to, or accessed by any external party.</p>
        </div>
        
        <div className="sec-card animate-on-scroll">
          <Lock size={24} className="sec-icon" />
          <h3 className="sec-title">FINANCIAL-GRADE ENCRYPTION</h3>
          <p className="sec-body">All data transmitted between you and ARCA is encrypted using AES-256 and TLS 1.3 — the same standards used by major financial institutions.</p>
        </div>

        <div className="sec-card animate-on-scroll">
          <UserMinus size={24} className="sec-icon" />
          <h3 className="sec-title">NO PERSONAL CREDENTIALS STORED</h3>
          <p className="sec-body">ARCA never stores your broker login credentials. OAuth tokens are encrypted and revocable from your broker's portal at any time.</p>
        </div>
      </div>
    </section>
  );
};

// Section 09 — PRICING
const PricingSection = () => {
  const navigate = useNavigate();
  return (
    <section className="pricing-section" id="pricing">
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <span className="section-label center animate-on-scroll">PRICING</span>
        <h2 className="section-top-heading animate-on-scroll" style={{ margin: '0 auto 16px auto', maxWidth: 'none', textAlign: 'center' }}>
          One Product. Two Ways In.
        </h2>
        <p style={{ fontFamily: 'Inter', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Cancel anytime. No setup fees. No long-term contracts.
        </p>
      </div>

      <div className="pricing-row">
        {/* Card 1 — OBSERVER */}
        <div className="pricing-card animate-on-scroll">
          <div className="p-tier">
            OBSERVER
          </div>
          <div className="p-price-block">
            <span className="p-sym">₹</span>
            <span className="p-num">0</span>
          </div>
          <div className="p-mo">
            forever
          </div>
          
          <div className="p-sep"></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--status-gain)' }} />
              <span className="p-text">Portfolio value snapshot (manual entry)</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--status-gain)' }} />
              <span className="p-text">Basic allocation view</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--status-gain)' }} />
              <span className="p-text">7-day historical chart</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--status-gain)' }} />
              <span className="p-text">Limited to 10 holdings</span>
            </div>
          </div>

          <button className="btn-pricing-ghost" onClick={() => navigate('/onboarding')}>
            START FREE →
          </button>
        </div>

        {/* Card 2 — PRIVATE */}
        <div className="pricing-card premium animate-on-scroll">
          <span className="p-rec">RECOMMENDED</span>
          <div className="p-tier" style={{ marginTop: '10px' }}>
            PRIVATE
          </div>
          <div className="p-price-block">
            <span className="p-sym" style={{ color: 'var(--accent-gold)' }}>₹</span>
            <span className="p-num">499</span>
          </div>
          <div className="p-mo">
            per month, billed monthly
          </div>
          
          <div className="p-sep"></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Unlimited holdings</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Live NSE/BSE data (15-min delay)</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Full AI advisory brief</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Concentration and drift alerts</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Watchlist with price triggers</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Transaction log and history</span>
            </div>
            <div className="p-feature">
              <Check size={14} className="p-icon" style={{ color: 'var(--accent-gold)' }} />
              <span className="p-text">Priority support</span>
            </div>
          </div>

          <button className="btn-pricing-gold" onClick={() => navigate('/onboarding')}>
            REQUEST ACCESS →
          </button>
          
          <div style={{ marginTop: '12px', fontFamily: 'Inter', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Cancel anytime · No long-term commitment
          </div>
        </div>
      </div>
    </section>
  );
};

// Section 10 — FINAL CTA
const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="cta-section">
      <div className="cta-glow"></div>
      <div className="cta-noise"></div>
      
      <div className="cta-content">
        <span className="section-label center animate-on-scroll" style={{ marginBottom: '28px' }}>BEGIN HERE</span>
        <h2 className="cta-heading animate-on-scroll">
          Your Portfolio Is Waiting For<br />
          <span style={{ color: 'var(--accent-gold)' }}>Intelligence.</span>
        </h2>
        <p className="cta-body animate-on-scroll">
          Join investors who've moved beyond spreadsheets and fragmented broker apps.
        </p>
        
        <div className="hero-cta-row animate-on-scroll" style={{ justifyContent: 'center', gap: '14px' }}>
          <button className="btn-primary" onClick={() => navigate('/onboarding')} aria-label="Open ARCA Terminal">
            OPEN TERMINAL →
          </button>
          <button className="btn-secondary">
            <Play size={12} weight="fill" style={{ marginRight: '4px' }} /> Watch 90-sec Demo
          </button>
        </div>
        
        <div className="cta-sub animate-on-scroll">
          ARCA is a portfolio intelligence viewer.<br />
          We do not provide investment advice, manage funds, or execute trades. Not SEBI registered.
        </div>
      </div>
    </section>
  );
};

// Section 11 — FOOTER
const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="meander-strip" style={{ marginBottom: '48px' }} />
        <div className="f-top">
          <div className="f-left">
            <div className="f-brand">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="var(--color-gold)" strokeWidth="1.5">
                <path d="M6 22 A10 10 0 0 1 10 8" strokeLinecap="round" />
                <path d="M6 18 C5 17 7 16 7 16" />
                <path d="M8 14 C7 13 9 12 9 12" />
                <path d="M10 10 C9 9 11 8 11 8" />
                <path d="M26 22 A10 10 0 0 0 22 8" strokeLinecap="round" />
                <path d="M26 18 C27 17 25 16 25 16" />
                <path d="M24 14 C25 13 23 12 23 12" />
                <path d="M22 10 C23 9 21 8 21 8" />
                <circle cx="13" cy="13" r="2.5" strokeWidth="1.2" />
                <circle cx="19" cy="13" r="2.5" strokeWidth="1.2" />
                <circle cx="13" cy="13" r="0.8" fill="var(--color-gold)" />
                <circle cx="19" cy="13" r="0.8" fill="var(--color-gold)" />
                <path d="M16 14.5 L15 16.5 L17 16.5 Z" fill="var(--color-gold)" stroke="none" />
                <path d="M11 10.5 C12 9.5 14 9.5 16 10 C18 9.5 20 9.5 21 10.5 L21.5 13.5 C21.5 18 19 21 16 21 C13 21 10.5 18 10.5 13.5 Z" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M11 14 C12 16 12.5 18 13.5 19.5" strokeWidth="1" />
                <path d="M21 14 C20 16 19.5 18 18.5 19.5" strokeWidth="1" />
              </svg>
              <span className="f-brand-text">ARCA</span>
            </div>
            <div className="f-tagline">
              Intelligence for Private Wealth.
            </div>
          </div>
          
          <div className="f-right">
            <div className="f-col">
              <span className="f-col-header">Products</span>
              <span className="f-link">Dashboard</span>
              <span className="f-link">Watchlist</span>
              <span className="f-link">Analytics</span>
              <span className="f-link">Alerts</span>
            </div>
            <div className="f-col">
              <span className="f-col-header">Company</span>
              <span className="f-link">About</span>
              <span className="f-link">Blog</span>
              <span className="f-link">Changelog</span>
              <span className="f-link">Careers</span>
            </div>
            <div className="f-col">
              <span className="f-col-header">Legal</span>
              <span className="f-link">Privacy Policy</span>
              <span className="f-link">Terms of Service</span>
              <span className="f-link">Cookie Policy</span>
            </div>
            <div className="f-col">
              <span className="f-col-header">Social</span>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <a href="https://x.com" aria-label="X / Twitter" className="f-social-icon-link">
                  <TwitterLogo size={18} weight="fill" />
                </a>
                <a href="https://linkedin.com" aria-label="LinkedIn" className="f-social-icon-link">
                  <LinkedinLogo size={18} weight="fill" />
                </a>
                <a href="https://github.com" aria-label="GitHub" className="f-social-icon-link">
                  <GithubLogo size={18} weight="fill" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="f-sep"></div>
        
        <div className="f-bottom">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span className="f-copy"><Copyright size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> 2026 ARCA. All rights reserved.</span>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span className="f-copy">Not SEBI Registered · Not AMFI Registered</span>
          </div>
          <div className="f-copy">
            Built in India · For serious investors.
          </div>
        </div>
    </footer>
  );
};

// MAIN COMPONENT
export default function Landing() {
  useScrollAnimations();

  // SCROLL FIX: Unlock html/body/root overflow while landing page is mounted.
  // index.css sets overflow:hidden globally for the dashboard layout shell.
  // The landing page renders outside that shell so needs scroll re-enabled.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevRoot = root ? root.style.overflow : '';

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';

    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      if (root) root.style.overflow = prevRoot;
    };
  }, []);

  // FIX 09 — Custom cursor starts invisible, fades in on first mouse move
  useEffect(() => {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    let cursorVisible = false;

    const moveCursor = (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      if (!cursorVisible) {
        cursor.style.opacity = '1';
        cursorVisible = true;
      }
    };

    const hideCursor = () => { cursor.style.opacity = '0'; };
    const showCursor = () => { if (cursorVisible) cursor.style.opacity = '1'; };
    const addHover = () => cursor.classList.add('hovering');
    const removeHover = () => cursor.classList.remove('hovering');

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('mouseenter', showCursor);

    const interactives = document.querySelectorAll('button, a, .t-card, .sec-card, .pricing-card, .bento-card');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  return (
    <div className="landing-page">
      <div className="custom-cursor"></div>

      <Navbar />
      <HeroSection />
      <div className="section-divider" />
      <TrustBar />
      <div className="section-divider" />
      <ProblemStatement />
      <div className="section-divider" />
      <FeaturesSection />
      <div className="section-divider" />
      <ProductPreview />
      <div className="section-divider" />
      <Testimonials />
      <div className="section-divider" />
      <HowItWorks />
      <div className="section-divider" />
      <SecuritySection />
      <div className="section-divider" />
      <PricingSection />
      <div className="section-divider" />
      <FinalCTA />
      <div className="section-divider" />
      <Footer />
    </div>
  );
}
