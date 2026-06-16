import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Upload, Bot, Newspaper, LayoutDashboard } from 'lucide-react';
import { theme, panelStyle } from '../lib/theme.js';
import { useAuth } from '../lib/useAuth.js';
import { GreekStar, IonicColumn, Pediment, OrnamentDivider } from '../components/GreekOrnaments.jsx';

const features = [
  { title: 'Institutional dashboard', icon: LayoutDashboard, text: 'Command-centre views for portfolio, risk, and live intelligence.' },
  { title: 'AI advisory layer', icon: Bot, text: 'Portfolio-aware analysis with contextual prompts and reasoning.' },
  { title: 'Premium import flow', icon: Upload, text: 'Fast broker exports, OCR ingestion, and secure onboarding.' },
  { title: 'Market intelligence', icon: Newspaper, text: 'Editorial news feeds linked to holdings and sentiment.' },
];

const stack = [
  { name: 'React + Vite', detail: 'Frontend' },
  { name: 'FastAPI + Supabase', detail: 'Backend / DB' },
  { name: 'Framer Motion', detail: 'Animations' },
  { name: 'Lucide Icons', detail: 'Icon system' },
  { name: 'Dark editorial system', detail: 'Design language' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100dvh', color: theme.colors.text, background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 22px 42px' }}>
        {/* ── Nav ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', ...panelStyle({ padding: 0 }) }}>
              <TrendingUp size={18} color="var(--greek-gold)" />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--greek-gold)' }}>WealthOS</div>
              <div style={{ fontSize: 13, color: theme.colors.textSoft, fontFamily: 'var(--font-serif)' }}>Institutional Private Terminal</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" style={{ ...panelStyle({ padding: '10px 14px', color: theme.colors.textSoft, textDecoration: 'none' }) }}>Sign in</Link>
            <button
              onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
              style={{
                border: '1px solid rgba(212,160,23,0.5)',
                borderRadius: 12,
                padding: '11px 16px',
                background: 'linear-gradient(180deg, #f0e6c8, #d4a017)',
                color: '#1a1206',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open terminal
            </button>
          </div>
        </div>

        {/* ── Hero grid ── */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18, alignItems: 'stretch' }}>
          <div style={{ ...panelStyle({ padding: 34, minHeight: 560, position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                borderRadius: 999, border: `1px solid var(--border-subtle)`,
                color: 'var(--greek-gold)', fontSize: 11, letterSpacing: '0.16em',
                textTransform: 'uppercase', marginBottom: 22, fontFamily: 'var(--font-serif)',
              }}>
                <GreekStar size={12} /> Secure. Calm. Institutional.
              </div>

              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
                lineHeight: 1.1,
                letterSpacing: '0.02em',
                margin: '0 0 20px',
                maxWidth: '14ch',
                color: 'var(--parchment)',
              }}>
                Intelligence for Private Wealth.
              </h1>

              <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--cream)', maxWidth: 560, marginBottom: 24, fontFamily: 'var(--font-sans)' }}>
                WealthOS turns broker exports, live market data, and AI reasoning into a premium operating system for serious investors.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                <button
                  onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
                  style={{ border: '1px solid rgba(212,160,23,0.5)', borderRadius: 12, padding: '13px 18px', background: 'linear-gradient(180deg, #f0e6c8, #d4a017)', color: '#1a1206', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  Enter dashboard <ArrowRight size={16} />
                </button>
                <Link to="/onboarding" style={{ ...panelStyle({ padding: '13px 18px', textDecoration: 'none', color: 'var(--parchment)', fontFamily: 'var(--font-serif)' }) }}>
                  Start onboarding
                </Link>
              </div>

              {/* KPI chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, maxWidth: 760 }}>
                {[
                  ['Live portfolio value', '₹24.8L', '+12.4%'],
                  ['AI confidence', 'High', 'Portfolio-aware'],
                  ['Market posture', 'Active', 'NSE + global'],
                ].map(([label, value, sub]) => (
                  <div key={label} style={panelStyle({ padding: 18 })}>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: 12 }}>{label}</div>
                    <div style={{ fontSize: 28, fontFamily: 'var(--font-serif)', marginBottom: 6, color: 'var(--greek-gold)' }}>{value}</div>
                    <div style={{ color: 'var(--cream)', fontSize: 13 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ ...panelStyle({ padding: 22 }) }}>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 10 }}>What it does</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {features.map(({ title, icon: Icon, text }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 12, border: `1px solid var(--border-subtle)`, background: 'rgba(212,160,23,0.01)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(212,160,23,0.12)', color: 'var(--greek-gold)', flexShrink: 0 }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-serif)' }}>{title}</div>
                      <div style={{ color: 'var(--cream)', fontSize: 13, lineHeight: 1.55 }}>{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...panelStyle({ padding: 22 }) }}>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 10 }}>Operational stack</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {stack.map(({ name, detail }) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft }}>
                    <span>{name}</span>
                    <span style={{ fontSize: 11, color: theme.colors.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{detail}</span>
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
