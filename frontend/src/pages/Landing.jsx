import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlayCircle, LockSimple, ShieldCheck, EyeSlash, FileX, 
  Check, CheckCircle, TwitterLogo, LinkedinLogo, GithubLogo 
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
              const duration = 1400; // 1.4s
              const start = performance.now();
              const isPct = entry.target.hasAttribute('data-is-pct');
              
              const updateCounter = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutQuart
                const easeOut = 1 - Math.pow(1 - progress, 4);
                const current = (target * easeOut).toFixed(1);
                
                if (isPct) {
                  entry.target.textContent = `+${current}%`;
                } else {
                  entry.target.textContent = current;
                }
                
                if (progress < 1) {
                  requestAnimationFrame(updateCounter);
                } else {
                  entry.target.textContent = isPct ? `+${target}%` : target;
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
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="#C8B38E">
            <circle cx="13" cy="13" r="12" strokeWidth="1"/>
            <circle cx="10" cy="11" r="2.5" strokeWidth="1"/>
            <circle cx="16" cy="11" r="2.5" strokeWidth="1"/>
            <circle cx="10" cy="11" r="1" fill="#C8B38E"/>
            <circle cx="16" cy="11" r="1" fill="#C8B38E"/>
            <path d="M9 16 Q13 19 17 16" strokeWidth="1" fill="none" strokeLinecap="round"/>
            <path d="M11 7 L9 5 M15 7 L17 5" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="nav-logo-text">ANTIGRAVITY</span>
          <div className="nav-separator"></div>
          <span className="nav-subtitle">PRIVATE TERMINAL</span>
        </div>
        <div className="nav-center">
          <a href="#features" className="nav-link">Features</a>
          <a href="#intelligence" className="nav-link">Intelligence</a>
          <a href="#security" className="nav-link">Security</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        <div className="nav-right">
          <button className="btn-nav-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/onboarding')}>
            Start Free <span className="arrow">→</span>
          </button>
        </div>
      </div>
      <div className="meander-strip"></div>
    </div>
  );
};

// Section 01 — HERO CODED DASHBOARD
const HeroDashboard = () => (
  <div className="hero-dashboard-render">
    <div className="db-chrome">
      <div className="db-chrome-dots">
        <div className="db-chrome-dot" style={{background: '#B66A6A'}}></div>
        <div className="db-chrome-dot" style={{background: '#D2A76D'}}></div>
        <div className="db-chrome-dot" style={{background: '#6FAE8D'}}></div>
      </div>
      <span className="db-chrome-url">app.antigravity.in/terminal</span>
    </div>
    
    <div className="db-topbar">
      <span className="db-title">ANTIGRAVITY TERMINAL</span>
      <div className="db-status-pill">
        <div className="db-status-dot"></div>
        MARKETS OPEN
      </div>
    </div>
    
    <div className="db-kpi-grid">
      <div className="db-kpi-card gold-border">
        <div className="db-kpi-label">PORTFOLIO VALUE</div>
        <div className="db-kpi-val">₹25,74,000</div>
        <div className="db-kpi-sub gain">+16.47% All-time</div>
      </div>
      <div className="db-kpi-card">
        <div className="db-kpi-label">TODAY'S CHANGE</div>
        <div className="db-kpi-val">+2.34%</div>
        <div className="db-kpi-sub gain">+₹58,200</div>
      </div>
      <div className="db-kpi-card">
        <div className="db-kpi-label">TOTAL INVESTED</div>
        <div className="db-kpi-val">₹22,10,000</div>
        <div className="db-kpi-sub neutral">Base</div>
      </div>
      <div className="db-kpi-card">
        <div className="db-kpi-label">CASH BALANCE</div>
        <div className="db-kpi-val">₹1,45,000</div>
        <div className="db-kpi-sub neutral">Available</div>
      </div>
    </div>
    
    <div className="db-main-content">
      {/* Donut Chart area */}
      <div className="db-donut-area">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#2D3C37" strokeWidth="18" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="#C8B38E" strokeWidth="18" strokeDasharray="314" strokeDashoffset="100" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="#6FAE8D" strokeWidth="18" strokeDasharray="314" strokeDashoffset="240" />
          <text x="60" y="65" textAnchor="middle" fill="#ECE0CC" fontSize="14" fontFamily="JetBrains Mono" fontWeight="bold">7</text>
        </svg>
      </div>
      
      {/* Activity Feed */}
      <div className="db-activity-feed">
        <div className="db-section-title">ACTIVITY FEED</div>
        <div className="db-feed-item">
          <span className="db-feed-pill buy">BUY</span>
          <span className="db-feed-text">INFY 50 shares @ ₹1,425</span>
        </div>
        <div className="db-feed-item">
          <span className="db-feed-pill sell">SELL</span>
          <span className="db-feed-text">ITC 100 shares @ ₹412</span>
        </div>
        <div className="db-feed-item">
          <span className="db-feed-pill buy">BUY</span>
          <span className="db-feed-text">HDFC 25 shares @ ₹1,650</span>
        </div>
      </div>
    </div>
  </div>
);

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="hero-section">
      <div className="hero-bg-gradient"></div>
      <div className="hero-noise"></div>
      
      <div className="hero-left">
        <div className="hero-pre-title">PRIVATE WEALTH INTELLIGENCE</div>
        <h1 className="hero-heading">
          Intelligence<br/>
          for Private<br/>
          Wealth<span className="hero-heading-gold-dot">.</span>
        </h1>
        <p className="hero-subtitle">
          Antigravity is the intelligence layer built for serious investors — real-time data, AI-powered decisions, and institutional-grade portfolio oversight. In one terminal.
        </p>
        
        <div className="hero-cta-row">
          <button className="btn-hero-primary" onClick={() => navigate('/onboarding')}>
            Open Terminal <span className="arrow">→</span>
          </button>
          <button className="btn-hero-secondary">
            <PlayCircle size={14} color="#7B7C70" /> Watch 90-sec demo
          </button>
        </div>
        
        <div className="hero-social-proof">
          <div className="hero-avatars">
            <div className="hero-avatar"></div>
            <div className="hero-avatar"></div>
            <div className="hero-avatar"></div>
          </div>
          <span className="hero-social-text">Join 2,400+ investors managing ₹120Cr+ on the platform <span className="hero-social-text-dot">·</span></span>
        </div>
        
        <div className="hero-metrics-strip">
          <div className="hero-metric-item hero-metric-item-1">
            <span className="hero-metric-label">PORTFOLIO INDEX</span>
            <span className="hero-metric-val-mono">₹25.7L</span>
            <span className="hero-metric-change-gain">+16.47% all-time</span>
          </div>
          <div className="hero-metric-sep"></div>
          <div className="hero-metric-item hero-metric-item-2">
            <span className="hero-metric-label">MARKET STATUS</span>
            <span className="hero-metric-val-cinzel">OPEN</span>
            <span className="hero-metric-change-muted">09:15 – 15:30 IST</span>
          </div>
          <div className="hero-metric-sep"></div>
          <div className="hero-metric-item hero-metric-item-3">
            <span className="hero-metric-label">AI CONFIDENCE</span>
            <span className="hero-metric-val-mono">
              <span className="animate-on-scroll" data-count-to="94.2" data-is-pct>0</span>
            </span>
            <span className="hero-metric-change-sec">signal strength</span>
          </div>
        </div>
      </div>
      
      <div className="hero-right">
        <HeroDashboard />
      </div>
    </section>
  );
};

// Section 02 — MARQUEE TRUST BAR
const TrustBar = () => {
  const items = [
    "BSE Certified", "SEBI Compliant", "256-bit AES Encrypted", 
    "No Third-Party Data Sharing", "22ms Execution Latency", 
    "INR-Native", "99.98% Uptime", "ISO 27001 Secured"
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
        <div className="problem-label animate-on-scroll">THE PROBLEM</div>
        <h2 className="problem-heading">
          <span className="animate-on-scroll" style={{display: 'block'}}>Your portfolio deserves</span>
          <span className="animate-on-scroll" style={{display: 'block', transitionDelay: '0.2s'}}>
            better than a <span className="gold-word">spreadsheet.</span>
          </span>
        </h2>
        
        <div className="problem-divider animate-on-scroll" style={{transitionDelay: '0.3s'}}></div>
        
        <p className="problem-body animate-on-scroll" style={{transitionDelay: '0.4s'}}>
          Most investors manage wealth through PDFs, Excel, and fragmented broker apps. Data is stale. Decisions are reactive. Opportunities are invisible.
          <br/><br/>
          Antigravity changes that — giving you live intelligence, AI-driven signals, and a unified terminal that thinks faster than any spreadsheet ever could.
        </p>
        
        <div className="problem-stats animate-on-scroll" style={{transitionDelay: '0.5s'}}>
          <div className="problem-stat">
            <span className="p-stat-val">₹120Cr+</span>
            <span className="p-stat-label">Assets tracked on platform</span>
            <span className="p-stat-sub">and growing</span>
          </div>
          <div className="p-stat-sep"></div>
          <div className="problem-stat">
            <span className="p-stat-val">22ms</span>
            <span className="p-stat-label">Average data latency</span>
            <span className="p-stat-sub">real-time feeds</span>
          </div>
          <div className="p-stat-sep"></div>
          <div className="problem-stat">
            <span className="p-stat-val">94.2%</span>
            <span className="p-stat-label">AI signal accuracy</span>
            <span className="p-stat-sub">over 12 months</span>
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
      <span className="section-top-label animate-on-scroll">WHAT YOU GET</span>
      <h2 className="section-top-heading animate-on-scroll">
        A complete intelligence layer for your wealth.
      </h2>
      
      <div className="bento-grid">
        {/* CARD A */}
        <div className="bento-card card-a animate-on-scroll" style={{transitionDelay: '0ms'}}>
          <div className="bento-header">| INSTITUTIONAL DASHBOARD</div>
          <div style={{display: 'flex', gap: '32px', height: '100%'}}>
            <div style={{flex: 1}}>
              <div className="card-a-title">Your command center</div>
              <div className="card-a-desc">
                Unified view across all holdings, accounts, and brokers — consolidated in one terminal.
              </div>
              <div className="bento-chip-row">
                <span className="bento-chip">Live data</span>
                <span className="bento-chip">Multi-broker</span>
                <span className="bento-chip">Consolidated</span>
              </div>
            </div>
            <div style={{flex: 1, display: 'flex', alignItems: 'center'}}>
              {/* Mini dashboard render */}
              <div style={{width: '100%', background: '#102321', border: '1px solid #2D3C37', borderRadius: '4px', padding: '16px'}}>
                <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                  <div style={{flex: 1, background: '#172923', border: '1px solid #2D3C37', padding: '8px', borderRadius: '2px'}}>
                    <div style={{fontSize: '8px', color: '#7B7C70', marginBottom: '4px'}}>VALUE</div>
                    <div style={{fontSize: '12px', color: '#ECE0CC', fontFamily: 'JetBrains Mono', fontWeight: 'bold'}}>₹18.5L</div>
                  </div>
                  <div style={{flex: 1, background: '#172923', border: '1px solid #2D3C37', padding: '8px', borderRadius: '2px'}}>
                    <div style={{fontSize: '8px', color: '#7B7C70', marginBottom: '4px'}}>P&L</div>
                    <div style={{fontSize: '12px', color: '#6FAE8D', fontFamily: 'JetBrains Mono', fontWeight: 'bold'}}>+14.2%</div>
                  </div>
                </div>
                {/* Horizontal Bar */}
                <div style={{display: 'flex', height: '12px', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px'}}>
                  <div style={{width: '40%', background: '#C8B38E'}}></div>
                  <div style={{width: '35%', background: '#869FC4'}}></div>
                  <div style={{width: '25%', background: '#6FAE8D'}}></div>
                </div>
                {/* Sparklines */}
                <div style={{display: 'flex', gap: '8px'}}>
                  <div style={{flex: 1, height: '24px', border: '1px solid #2D3C37', borderRadius: '2px', position: 'relative'}}>
                    <svg width="100%" height="100%" preserveAspectRatio="none"><path d="M0 20 L20 10 L40 15 L60 5" stroke="#C8B38E" fill="none"/></svg>
                  </div>
                  <div style={{flex: 1, height: '24px', border: '1px solid #2D3C37', borderRadius: '2px', position: 'relative'}}>
                     <svg width="100%" height="100%" preserveAspectRatio="none"><path d="M0 20 L20 15 L40 5 L60 10" stroke="#6FAE8D" fill="none"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD B */}
        <div className="bento-card card-b animate-on-scroll" style={{transitionDelay: '80ms'}}>
          <div className="bento-header">| AI ADVISORY LAYER</div>
          <div className="card-b-quote">
            "Your concentration in Financials has drifted above your 35% target. Consider rebalancing before earnings season — volatility window opens in 6 days."
          </div>
          <div className="insight-pills">
            <span className="insight-pill warn">⚠ Concentration</span>
            <span className="insight-pill gain">↗ Rebalance signal</span>
          </div>
          <div className="animated-line"></div>
        </div>

        {/* CARD C */}
        <div className="bento-card card-c animate-on-scroll" style={{transitionDelay: '160ms'}}>
          <div className="bento-header">| PREMIUM IMPORT FLOW</div>
          <div className="card-c-desc">
            One-click imports: Zerodha, Groww, HDFC, ICICI, and 40+ others. Syncs every 30 seconds automatically.
          </div>
          <div className="broker-logos">
            <span className="broker-logo">ZERODHA</span>
            <span className="broker-logo">GROWW</span>
            <span className="broker-logo">HDFC SEC</span>
            <span className="broker-logo">ICICI</span>
            <span className="broker-logo">+40</span>
          </div>
        </div>

        {/* CARD D */}
        <div className="bento-card card-d animate-on-scroll" style={{transitionDelay: '240ms'}}>
          <div className="bento-header">| MARKET INTELLIGENCE</div>
          <div className="card-d-desc">
            Always-on feeds linked to your portfolio. Earnings alerts, ratings changes, and sentiment signals.
          </div>
          <div className="news-pill">
            <span className="news-pill-ticker">[NIFTY IT]</span>
            <span className="news-pill-text">4578 PT TARGET — Reuters 10m</span>
          </div>
          <div className="news-pill">
            <span className="news-pill-ticker">[HDFCBANK]</span>
            <span className="news-pill-text">Q3 EARNINGS BEAT — Bloomberg</span>
          </div>
        </div>

        {/* CARD E */}
        <div className="bento-card card-e animate-on-scroll" style={{transitionDelay: '320ms'}}>
          <div>
            <div className="card-e-text">More intelligence. Coming soon.</div>
            <div className="card-e-sub">ROADMAP · 2026</div>
          </div>
        </div>

        {/* CARD F */}
        <div className="bento-card card-f animate-on-scroll" style={{transitionDelay: '400ms'}}>
          <div className="card-f-header">
            <div className="bento-header" style={{margin: 0}}>| LIVE MARKET WATCH</div>
            <div className="market-watch-ticker">NIFTY 50  22,419.95  +1.24%</div>
          </div>
          <table className="market-table">
            <thead>
              <tr>
                <th style={{width: '30%'}}>NAME</th>
                <th style={{width: '20%'}}>PRICE</th>
                <th style={{width: '20%'}}>CHANGE</th>
                <th style={{width: '15%'}}>WEIGHT</th>
                <th style={{width: '15%'}}>P&L</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="mt-name">RELIANCE</td><td className="mt-val">₹2,945.80</td><td className="mt-val mt-val-gain">+1.24%</td><td className="mt-val">18.5%</td><td className="mt-val mt-val-gain">+₹2,840</td></tr>
              <tr><td className="mt-name">HDFCBANK</td><td className="mt-val">₹1,650.40</td><td className="mt-val mt-val-gain">+0.85%</td><td className="mt-val">15.2%</td><td className="mt-val mt-val-gain">+₹1,240</td></tr>
              <tr><td className="mt-name">INFY</td><td className="mt-val">₹1,425.20</td><td className="mt-val mt-val-gain">+2.18%</td><td className="mt-val">12.8%</td><td className="mt-val mt-val-gain">+₹3,640</td></tr>
              <tr><td className="mt-name">TCS</td><td className="mt-val">₹3,820.60</td><td className="mt-val mt-val-loss">-0.34%</td><td className="mt-val">11.3%</td><td className="mt-val mt-val-loss">-₹480</td></tr>
              <tr><td className="mt-name">ICICIBANK</td><td className="mt-val">₹1,168.30</td><td className="mt-val mt-val-gain">+0.56%</td><td className="mt-val">9.7%</td><td className="mt-val mt-val-gain">+₹610</td></tr>
            </tbody>
          </table>
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
        <span className="section-top-label animate-on-scroll">INSIDE THE TERMINAL</span>
        <h2 className="preview-heading animate-on-scroll">
          See exactly<br/>what you get.
        </h2>
        <p className="preview-subtitle animate-on-scroll">
          This is the actual Command Center. Not a mockup. Not a marketing slide. The real interface — yours after onboarding.
        </p>
      </div>

      <div className="browser-window animate-on-scroll">
        <div className="browser-chrome">
          <div className="browser-dots">
            <div className="b-dot r"></div>
            <div className="b-dot y"></div>
            <div className="b-dot g"></div>
          </div>
          <span className="browser-url">app.antigravity.in/terminal</span>
          <LockSimple size={12} color="#6FAE8D" style={{marginLeft: 'auto'}} />
        </div>
        <div className="dashboard-frame-wrapper">
          <div className="dashboard-scale-container">
            {/* Very detailed mockup of the full dashboard UI layout */}
            <div style={{display: 'flex', height: '600px', background: '#0A201F'}}>
              {/* Sidebar */}
              <div style={{width: '52px', borderRight: '1px solid #2D3C37', background: '#102321', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px'}}>
                <div style={{width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #C8B38E', marginBottom: '24px'}}></div>
                <div style={{width: '16px', height: '16px', background: '#2D3C37', borderRadius: '2px', marginBottom: '16px'}}></div>
                <div style={{width: '16px', height: '16px', background: '#2D3C37', borderRadius: '2px', marginBottom: '16px'}}></div>
                <div style={{width: '16px', height: '16px', background: '#2D3C37', borderRadius: '2px', marginBottom: '16px'}}></div>
              </div>
              
              <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                {/* Topbar */}
                <div style={{height: '44px', borderBottom: '1px solid #2D3C37', background: '#102321', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px'}}>
                  <div style={{fontFamily: 'Cinzel', fontSize: '11px', color: '#ECE0CC'}}>COMMAND CENTER</div>
                  <div className="db-status-pill"><div className="db-status-dot"></div>MARKETS OPEN</div>
                </div>
                
                {/* Ticker */}
                <div style={{height: '34px', borderBottom: '1px solid #2D3C37', display: 'flex', alignItems: 'center', padding: '0 24px'}}>
                  <span style={{fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ACA492'}}>NIFTY 50  <span style={{color: '#6FAE8D'}}>+0.42%</span></span>
                  <span style={{margin: '0 12px', color: '#2D3C37'}}>|</span>
                  <span style={{fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ACA492'}}>SENSEX  <span style={{color: '#6FAE8D'}}>+0.45%</span></span>
                </div>
                
                {/* Main Content Area */}
                <div style={{flex: 1, padding: '24px', overflow: 'hidden'}}>
                  <div className="db-kpi-grid" style={{padding: 0, marginBottom: '24px'}}>
                    <div className="db-kpi-card gold-border">
                      <div className="db-kpi-label">PORTFOLIO VALUE</div>
                      <div className="db-kpi-val">₹25,74,000</div>
                    </div>
                    <div className="db-kpi-card">
                      <div className="db-kpi-label">TOTAL P&L</div>
                      <div className="db-kpi-val" style={{color: '#6FAE8D'}}>+₹3,64,000</div>
                    </div>
                    <div className="db-kpi-card">
                      <div className="db-kpi-label">TODAY'S CHANGE</div>
                      <div className="db-kpi-val" style={{color: '#6FAE8D'}}>+2.34%</div>
                    </div>
                    <div className="db-kpi-card">
                      <div className="db-kpi-label">AI CONFIDENCE</div>
                      <div className="db-kpi-val">HIGH</div>
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', gap: '24px'}}>
                    {/* Left Column */}
                    <div style={{flex: 2, display: 'flex', flexDirection: 'column', gap: '24px'}}>
                      <div style={{background: '#172923', border: '1px solid #2D3C37', borderRadius: '4px', padding: '20px'}}>
                        <div className="db-section-title">AI ADVISORY BRIEF</div>
                        <div style={{fontFamily: 'EB Garamond', fontStyle: 'italic', color: '#ACA492', fontSize: '14px', lineHeight: 1.6}}>
                          Your portfolio showed resilient growth this week, with tech holdings leading gains at +3.2%. Consider rebalancing — your concentration in financials has drifted above your 35% target threshold.
                        </div>
                      </div>
                      <div style={{background: '#172923', border: '1px solid #2D3C37', borderRadius: '4px', padding: '20px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                         {/* Donut placeholder */}
                         <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="60" fill="none" stroke="#2D3C37" strokeWidth="20" />
                            <circle cx="70" cy="70" r="60" fill="none" stroke="#C8B38E" strokeWidth="20" strokeDasharray="376" strokeDashoffset="120" />
                         </svg>
                      </div>
                    </div>
                    {/* Right Column */}
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '24px'}}>
                      <div style={{background: '#172923', border: '1px solid #2D3C37', borderRadius: '4px', padding: '20px', flex: 1}}>
                         <div className="db-section-title">ACTIVITY</div>
                         <div className="db-feed-item"><span className="db-feed-pill buy">BUY</span><span className="db-feed-text">INFY</span></div>
                         <div className="db-feed-item"><span className="db-feed-pill sell">SELL</span><span className="db-feed-text">ITC</span></div>
                      </div>
                      <div style={{background: '#172923', border: '1px solid #2D3C37', borderRadius: '4px', padding: '20px', flex: 1}}>
                         <div className="db-section-title">WATCHLIST</div>
                         <div className="db-feed-item" style={{justifyContent: 'space-between'}}><span className="db-feed-text">BAJFINANCE</span><span style={{color: '#6FAE8D', fontFamily: 'JetBrains Mono', fontSize: '11px'}}>+2.3%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="preview-bottom-fade"></div>
        </div>
      </div>
    </section>
  );
};

// Section 06 — TESTIMONIALS
const Testimonials = () => {
  const testimonials = [
    {
      quote: "Finally, a terminal that thinks the way I do. The AI brief alone saved me from exiting my top performer app on a panic day.",
      author: "R.K.", title: "Private Investor · Mumbai", stat: "+₹4.2L in 3 months",
      hasStat: true
    },
    {
      quote: "The concentration alerts caught a drift in my Midcap allocation I had completely missed. Paid for itself in one week.",
      author: "A.M.", title: "Chartered Accountant · Bangalore",
      hasStat: false
    },
    {
      quote: "The import flow handled my ZERODHA export in under 2 minutes. Clean data, clean interface, clean thinking.",
      author: "S.T.", title: "Entrepreneur · New Delhi", stat: "₹1.8Cr managed",
      hasStat: true
    }
  ];

  return (
    <section className="testimonials-section">
      <span className="section-top-label animate-on-scroll">FROM THE TERMINAL</span>
      <h2 className="section-top-heading animate-on-scroll">
        Built for people who take<br/>their wealth seriously.
      </h2>

      <div className="testimonials-grid">
        {testimonials.map((t, idx) => (
          <div key={idx} className="t-card animate-on-scroll" style={{transitionDelay: `${idx * 100}ms`}}>
            <div className="t-stars">★★★★★</div>
            <span className="t-quote-mark">"</span>
            <div className="t-quote">{t.quote}</div>
            <div className="t-sep"></div>
            
            <div className="t-author-row">
              <div className="t-avatar">{t.author.replace('.', '')}</div>
              <div className="t-author-info">
                <span className="t-author-name">{t.author}</span>
                <span className="t-author-title">{t.title}</span>
              </div>
              <div className="t-verified">VERIFIED</div>
            </div>
            
            {t.hasStat && (
              <div className="t-stat">
                <span className="t-stat-label">Portfolio {idx === 0 ? 'P&L' : 'Value'}</span>
                <span className="t-stat-val">{t.stat}</span>
              </div>
            )}
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
      <span className="section-top-label animate-on-scroll">ONBOARDING</span>
      <h2 className="section-top-heading animate-on-scroll">
        Three steps. Then you're in.
      </h2>

      <div className="timeline-wrapper">
        <div className="timeline-track"></div>
        
        <div className="timeline-step animate-on-scroll">
          <div className="step-bubble">01</div>
          <div className="step-content">
            <h3 className="step-title">Import your holdings</h3>
            <p className="step-body">Upload a Zerodha, Groww, or HDFC statement, or connect via our live broker API. We parse and organize everything automatically. Setup takes under 3 minutes.</p>
            <div className="bento-chip-row" style={{paddingTop: 0}}>
              <span className="bento-chip">CSV Upload</span>
              <span className="bento-chip">Live API</span>
              <span className="bento-chip">40+ Brokers</span>
            </div>
          </div>
        </div>

        <div className="timeline-step animate-on-scroll">
          <div className="step-bubble">02</div>
          <div className="step-content">
            <h3 className="step-title">Set your preferences</h3>
            <p className="step-body">Define your target allocation, risk tolerance, notification thresholds, and sector limits. The system learns your style and calibrates alerts accordingly.</p>
            <div className="bento-chip-row" style={{paddingTop: 0}}>
              <span className="bento-chip">Risk Profile</span>
              <span className="bento-chip">Alert Rules</span>
              <span className="bento-chip">Sector Limits</span>
            </div>
          </div>
        </div>

        <div className="timeline-step animate-on-scroll">
          <div className="step-bubble">03</div>
          <div className="step-content">
            <h3 className="step-title">Open the terminal</h3>
            <p className="step-body">Your Command Center is ready. AI Briefs populate within seconds. Live data activates. Every holding tracked, every opportunity surfaced.</p>
            <div className="bento-chip-row" style={{paddingTop: 0}}>
              <span className="bento-chip">Live in &lt;5min</span>
              <span className="bento-chip">AI Ready</span>
              <span className="bento-chip">Zero Config</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

// Section 08 — SECURITY
const SecuritySection = () => {
  return (
    <section className="security-section" id="security">
      <div style={{textAlign: 'center', marginBottom: '56px'}}>
        <span className="section-top-label animate-on-scroll" style={{display: 'inline-block', marginBottom: '16px'}}>SECURITY</span>
        <h2 className="section-top-heading animate-on-scroll" style={{margin: '0 auto 16px auto', maxWidth: 'none'}}>
          Your data lives by your rules.
        </h2>
        <p className="preview-subtitle animate-on-scroll" style={{margin: '0 auto', maxWidth: '480px'}}>
          Antigravity is read-only by design. We see your portfolio. We never touch your capital.
        </p>
      </div>

      <div className="sec-grid">
        <div className="sec-card animate-on-scroll">
          <LockSimple size={20} className="sec-icon" weight="bold" />
          <h3 className="sec-title">Bank-grade encryption</h3>
          <p className="sec-body">Private endpoints with AES-256 encryption at rest and in transit. The same standard used by institutional financial infrastructure.</p>
          <div className="sec-badge"><span>AES-256 + TLS 1.3</span></div>
        </div>
        
        <div className="sec-card animate-on-scroll">
          <ShieldCheck size={20} className="sec-icon" weight="bold" />
          <h3 className="sec-title">No third-party data sharing</h3>
          <p className="sec-body">Your portfolio data never leaves our encrypted infrastructure. We do not sell, share, or license your financial information.</p>
          <div className="sec-badge"><span>Zero data resale</span></div>
        </div>
        
        <div className="sec-card animate-on-scroll">
          <EyeSlash size={20} className="sec-icon" weight="bold" />
          <h3 className="sec-title">Seamless secure backend</h3>
          <p className="sec-body">You authenticate once. Your data stays encrypted server-side. No credentials stored. No sensitive fields exposed in transit.</p>
          <div className="sec-badge"><span>OAuth 2.0 · Zero storage</span></div>
        </div>

        <div className="sec-card animate-on-scroll">
          <FileX size={20} className="sec-icon" weight="bold" />
          <h3 className="sec-title">No personal credentials stored</h3>
          <p className="sec-body">We connect via broker OAuth tokens — we never see your login password, OTP, or trading PIN at any point.</p>
          <div className="sec-badge"><span>Token-based only</span></div>
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
      <div style={{textAlign: 'center', marginBottom: '56px'}}>
        <span className="section-top-label animate-on-scroll" style={{display: 'inline-block', marginBottom: '16px'}}>PRICING</span>
        <h2 className="section-top-heading animate-on-scroll" style={{margin: '0 auto', maxWidth: 'none'}}>
          One product. Two ways in.
        </h2>
      </div>

      <div className="pricing-row">
        <div className="pricing-card animate-on-scroll">
          <div className="p-tier">OBSERVER</div>
          <div className="p-price-block">
            <span className="p-sym">₹</span>
            <span className="p-num">0</span>
            <span className="p-mo">/month</span>
          </div>
          <div className="p-sep"></div>
          
          <div className="p-feature"><Check size={14} className="p-icon" /><span className="p-text">Basic holdings dashboard</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" /><span className="p-text">Manual CSV import (monthly)</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" /><span className="p-text">Live market ticker</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" /><span className="p-text">5 watchlist stocks</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" /><span className="p-text">No AI advisory</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" /><span className="p-text">No automated sync</span></div>

          <button className="btn-pricing-ghost" onClick={() => navigate('/onboarding')}>Start Free</button>
        </div>

        <div className="pricing-card premium animate-on-scroll">
          <div className="p-tier">
            PRIVATE
            <span className="p-rec">RECOMMENDED</span>
          </div>
          <div className="p-price-block">
            <span className="p-sym">₹</span>
            <span className="p-num">499</span>
            <span className="p-mo">/month</span>
          </div>
          <div className="p-sep"></div>
          
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Complete institutional dashboard</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Live broker sync (30-second refresh)</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">AI Advisory Layer (daily briefs)</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Unlimited portfolio holdings</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Market intelligence feed</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Concentration & drift alerts</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Export reports (PDF, CSV)</span></div>
          <div className="p-feature"><Check size={14} className="p-icon" weight="bold" /><span className="p-text">Priority support</span></div>

          <button className="btn-pricing-gold" onClick={() => navigate('/onboarding')}>
            Take Private Access <span className="arrow">→</span>
          </button>
          <div style={{fontFamily: 'Inter', fontSize: '10px', color: '#7B7C70', textAlign: 'center', marginTop: '12px'}}>
            Cancel anytime. No contracts. No setup fees.
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
      <div className="meander-strip" style={{position: 'absolute', top: 0, opacity: 0.8}}></div>
      
      <div className="cta-content">
        <div className="section-top-label animate-on-scroll">GET STARTED</div>
        <h2 className="cta-heading animate-on-scroll">
          Your portfolio is<br/>waiting for<br/><span className="gold">intelligence.</span>
        </h2>
        <p className="cta-body animate-on-scroll">
          In 3 minutes: import your holdings, let AI brief your portfolio, and see your wealth the way institutional investors do.
        </p>
        
        <div className="hero-cta-row animate-on-scroll" style={{justifyContent: 'center'}}>
          <button className="btn-hero-primary" onClick={() => navigate('/onboarding')}>
            Open Terminal <span className="arrow">→</span>
          </button>
          <button className="btn-hero-secondary" onClick={() => navigate('/dashboard')}>
            View sample dashboard
          </button>
        </div>
        
        <div className="cta-sub animate-on-scroll">
          No credit card required for Observer tier.<br/>Private tier: ₹499/mo, cancel anytime.
        </div>
      </div>
    </section>
  );
};

// Section 11 — FOOTER
const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="f-top">
        <div className="f-left">
          <div className="f-brand">
            <svg width="22" height="22" viewBox="0 0 26 26" fill="none" stroke="#C8B38E">
              <circle cx="13" cy="13" r="12" strokeWidth="1"/>
              <circle cx="10" cy="11" r="2.5" strokeWidth="1"/>
              <circle cx="16" cy="11" r="2.5" strokeWidth="1"/>
              <circle cx="10" cy="11" r="1" fill="#C8B38E"/>
              <circle cx="16" cy="11" r="1" fill="#C8B38E"/>
              <path d="M9 16 Q13 19 17 16" strokeWidth="1" fill="none" strokeLinecap="round"/>
              <path d="M11 7 L9 5 M15 7 L17 5" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="f-brand-text">ANTIGRAVITY</span>
          </div>
          <div className="f-tagline">PRIVATE TERMINAL</div>
          <div className="f-desc">Institutional-grade wealth intelligence for serious private investors.</div>
        </div>
        
        <div className="f-right">
          <div className="f-col">
            <span className="f-col-header">PRODUCT</span>
            <span className="f-link">Features</span>
            <span className="f-link">Dashboard</span>
            <span className="f-link">Pricing</span>
            <span className="f-link">Changelog</span>
          </div>
          <div className="f-col">
            <span className="f-col-header">COMPANY</span>
            <span className="f-link">About</span>
            <span className="f-link">Blog</span>
            <span className="f-link">Careers</span>
            <span className="f-link">Press</span>
          </div>
          <div className="f-col">
            <span className="f-col-header">LEGAL</span>
            <span className="f-link">Privacy Policy</span>
            <span className="f-link">Terms of Service</span>
            <span className="f-link">Security</span>
          </div>
        </div>
      </div>
      
      <div className="f-socials">
        <div className="f-social-btn"><TwitterLogo size={14} weight="fill" /></div>
        <div className="f-social-btn"><LinkedinLogo size={14} weight="fill" /></div>
        <div className="f-social-btn"><GithubLogo size={14} weight="fill" /></div>
      </div>
      
      <div className="f-sep"></div>
      
      <div className="f-bottom">
        <span className="f-copy">© 2026 Antigravity Technologies Pvt. Ltd. · All rights reserved.</span>
        <div className="f-badges">
          <div className="f-badge"><CheckCircle size={10} color="#6FAE8D" weight="fill"/> SEBI Registered</div>
          <div className="f-badge"><CheckCircle size={10} color="#6FAE8D" weight="fill"/> BSE Certified</div>
          <div className="f-badge"><CheckCircle size={10} color="#6FAE8D" weight="fill"/> ISO 27001</div>
        </div>
      </div>
    </footer>
  );
};

// MAIN COMPONENT
export default function Landing() {
  useScrollAnimations();

  // Custom Cursor Logic
  useEffect(() => {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;

    const moveCursor = (e) => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };

    const addHover = () => cursor.classList.add('hovering');
    const removeHover = () => cursor.classList.remove('hovering');

    window.addEventListener('mousemove', moveCursor);

    // Add hovering effect to interactive elements
    const interactives = document.querySelectorAll('button, a, .t-card, .sec-card, .pricing-card, .bento-card');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  return (
    <div className="landing-page">
      <div id="custom-cursor" className="custom-cursor"></div>
      
      <Navbar />
      <HeroSection />
      <TrustBar />
      <ProblemStatement />
      <FeaturesSection />
      <ProductPreview />
      <Testimonials />
      <HowItWorks />
      <SecuritySection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
