import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Upload, Bot, Newspaper, LayoutDashboard } from 'lucide-react';
import { theme, panelStyle } from '../lib/theme.js';
import { useAuth } from '../lib/useAuth.js';

const features = [
  { title: 'Institutional dashboard', icon: LayoutDashboard, text: 'Command-centre views for portfolio, risk, and live intelligence.' },
  { title: 'AI advisory layer', icon: Bot, text: 'Portfolio-aware analysis with contextual prompts and reasoning.' },
  { title: 'Premium import flow', icon: Upload, text: 'Fast broker exports, OCR ingestion, and secure onboarding.' },
  { title: 'Market intelligence', icon: Newspaper, text: 'Editorial news feeds linked to holdings and sentiment.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100dvh', color: theme.colors.text, background: 'linear-gradient(180deg, #081817 0%, #0A201F 48%, #081716 100%)' }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 22px 42px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', ...panelStyle({ padding: 0 }) }}>
              <TrendingUp size={18} color={theme.colors.gold} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: theme.colors.textMuted }}>WealthOS</div>
              <div style={{ fontSize: 13, color: theme.colors.textSoft }}>Luxury financial intelligence operating system</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" style={{ ...panelStyle({ padding: '10px 14px', color: theme.colors.textSoft, textDecoration: 'none' }) }}>Sign in</Link>
            <button
              onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
              style={{
                border: '0',
                borderRadius: 12,
                padding: '11px 16px',
                background: theme.colors.gold,
                color: '#0A201F',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Open terminal
            </button>
          </div>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18, alignItems: 'stretch' }}>
          <div style={{ ...panelStyle({ padding: 34, minHeight: 560, position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: theme.colors.gold, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 22 }}>
                <Shield size={12} /> Secure. Calm. Institutional.
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(3rem, 6vw, 5.6rem)', lineHeight: 0.95, letterSpacing: '-0.06em', margin: '0 0 20px', maxWidth: 12 }}>
                Financial intelligence with terminal-grade clarity.
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: theme.colors.textSoft, maxWidth: 640, marginBottom: 24 }}>
                WealthOS turns broker exports, live market data, and AI reasoning into a premium operating system for serious investors.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                <button
                  onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
                  style={{ border: '0', borderRadius: 12, padding: '13px 18px', background: theme.colors.text, color: '#0A201F', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  Enter dashboard <ArrowRight size={16} />
                </button>
                <Link to="/onboarding" style={{ ...panelStyle({ padding: '13px 18px', textDecoration: 'none', color: theme.colors.text }) }}>
                  Start onboarding
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, maxWidth: 760 }}>
                {[
                  ['Live portfolio value', '₹24.8L', '+12.4%'],
                  ['AI confidence', 'High', 'Portfolio-aware'],
                  ['Market posture', 'Active', 'NSE + global'],
                ].map(([label, value, sub]) => (
                  <div key={label} style={panelStyle({ padding: 18 })}>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 12 }}>{label}</div>
                    <div style={{ fontSize: 28, fontFamily: 'Space Grotesk, Inter, sans-serif', marginBottom: 6 }}>{value}</div>
                    <div style={{ color: theme.colors.textSoft, fontSize: 13 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ ...panelStyle({ padding: 22 }) }}>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 10 }}>What it does</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {features.map(({ title, icon: Icon, text }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(134,159,196,0.12)', color: theme.colors.gold, flexShrink: 0 }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
                      <div style={{ color: theme.colors.textSoft, fontSize: 13, lineHeight: 1.55 }}>{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...panelStyle({ padding: 22 }) }}>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 10 }}>Operational stack</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {['React + Vite', 'FastAPI + Supabase', 'Framer Motion', 'Lucide Icons', 'Dark editorial system'].map((item) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft }}>
                    <span>{item}</span>
                    <span style={{ color: theme.colors.gold }}>Ready</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
