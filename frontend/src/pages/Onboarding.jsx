import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Upload } from 'lucide-react';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';

const steps = [
  'Confirm profile and risk appetite',
  'Import holdings or connect a broker export',
  'Set target allocation and watchlists',
  'Enter the command dashboard',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [risk, setRisk] = useState('Balanced');
  const [goal, setGoal] = useState('Long-term capital growth');

  return (
    <div style={{ minHeight: '100dvh', padding: 22, background: 'linear-gradient(180deg, #081817 0%, #0A201F 48%, #081716 100%)', color: theme.colors.text }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Secure onboarding</div>
            <h1 style={{ margin: '8px 0 0', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(2rem, 4vw, 3.4rem)', letterSpacing: '-0.05em' }}>Set up your institutional workspace.</h1>
          </div>
          <button onClick={() => navigate('/app/dashboard')} style={{ border: '0', borderRadius: 12, padding: '11px 16px', background: theme.colors.gold, color: '#0A201F', fontWeight: 700, cursor: 'pointer' }}>
            Skip for now
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, alignItems: 'start' }}>
          <aside style={{ ...panelStyle({ padding: 24 }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(134,159,196,0.12)', color: theme.colors.gold }}><Lock size={15} /></div>
              <div>
                <div style={{ fontWeight: 700 }}>Onboarding checklist</div>
                <div style={{ fontSize: 13, color: theme.colors.textSoft }}>A calm path to first value.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {steps.map((step, index) => (
                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, border: `1px solid ${theme.colors.border}`, display: 'grid', placeItems: 'center', color: theme.colors.gold, flexShrink: 0, marginTop: 1 }}>{index + 1}</div>
                  <div style={{ color: theme.colors.textSoft, lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
            </div>
          </aside>

          <section style={{ ...panelStyle({ padding: 26 }) }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 8 }}>Risk profile</div>
                <select value={risk} onChange={(e) => setRisk(e.target.value)} style={fieldStyle()}>
                  {['Conservative', 'Balanced', 'Growth', 'Aggressive'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 8 }}>Primary goal</div>
                <input value={goal} onChange={(e) => setGoal(e.target.value)} style={fieldStyle()} placeholder="Long-term wealth building" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
              {[
                ['Session security', 'Protected routes and token sync'],
                ['Data import', 'CSV, XLSX, screenshot OCR'],
                ['Command layer', 'Advisor, signals, and allocation'],
              ].map(([title, text]) => (
                <div key={title} style={{ padding: 16, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: theme.colors.textSoft }}>{text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Upload portfolio snapshot</div>
                  <div style={{ fontSize: 13, color: theme.colors.textSoft }}>Bring in holdings to unlock richer analytics.</div>
                </div>
                <Upload size={18} color={theme.colors.gold} />
              </div>
              <button onClick={() => navigate('/app/upload')} style={{ border: '0', borderRadius: 12, padding: '13px 16px', background: theme.colors.text, color: '#0A201F', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
                Continue to import <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/app/dashboard')} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '13px 16px', background: 'transparent', color: theme.colors.text, fontWeight: 600, cursor: 'pointer' }}>
                Enter dashboard without setup
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.textMuted, fontSize: 12 }}>
                <CheckCircle2 size={15} color={theme.colors.success} />
                All onboarding actions are optional and reversible.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
