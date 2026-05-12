import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Sparkles, Shield, UserRound } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../lib/auth.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/app/dashboard');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setInfo('Password reset link sent. Check your inbox to finish the secure reset flow.');
      } else {
        await signUp(email, password, name);
        setInfo('Account created — check your email to verify your account, then sign in to continue.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #081817 0%, #0A201F 52%, #081716 100%)', color: theme.colors.text, padding: 18 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', minHeight: 'calc(100dvh - 36px)', display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 18, alignItems: 'stretch' }}>
        <div style={{ ...panelStyle({ padding: 34, position: 'relative', overflow: 'hidden' }) }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 999, border: `1px solid ${theme.colors.border}`, color: theme.colors.gold, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 24 }}>
            <Shield size={12} /> Secure access
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(2.6rem, 5vw, 5rem)', letterSpacing: '-0.06em', lineHeight: 0.95, margin: '0 0 18px', maxWidth: 10 }}>
            WealthOS, reimagined for elite investors.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: theme.colors.textSoft, maxWidth: 640, marginBottom: 26 }}>
            Sign in to enter a premium financial command environment with portfolio intelligence, AI analysis, and market context.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, maxWidth: 700 }}>
            {[
              ['Protected routes', 'Session persistence and token sync'],
              ['Email verification', 'Secure signup and password reset'],
              ['Portfolio intelligence', 'Live holdings, allocation, and risk'],
              ['AI advisor', 'Portfolio-aware financial analysis'],
            ].map(([title, text]) => (
              <div key={title} style={{ padding: 18, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
                <div style={{ color: theme.colors.textSoft, fontSize: 13, lineHeight: 1.55 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...panelStyle({ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(200,179,142,0.12)', color: theme.colors.gold }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Access terminal</div>
              <div style={{ color: theme.colors.textSoft, fontSize: 13 }}>Sign in, create your account, or reset your password.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, margin: '18px 0 20px' }}>
            {[
              ['login', 'Sign in'],
              ['signup', 'Create account'],
              ['reset', 'Forgot password'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setMode(value); setError(null); setInfo(null); }}
                style={{
                  flex: 1,
                  border: `1px solid ${mode === value ? theme.colors.gold : theme.colors.border}`,
                  background: mode === value ? 'rgba(200,179,142,0.08)' : 'transparent',
                  color: mode === value ? theme.colors.text : theme.colors.textSoft,
                  borderRadius: 12,
                  padding: '11px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 8 }}>Full name</label>
                <div style={{ position: 'relative' }}>
                  <UserRound size={14} color={theme.colors.textMuted} style={{ position: 'absolute', left: 12, top: 14 }} />
                  <input id="name" type="text" placeholder="Zaid Amreliya" value={name} onChange={(e) => setName(e.target.value)} required={mode === 'signup'} autoComplete="name" style={{ ...fieldStyle({ paddingLeft: 36 }) }} />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color={theme.colors.textMuted} style={{ position: 'absolute', left: 12, top: 14 }} />
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={{ ...fieldStyle({ paddingLeft: 36 }) }} />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color={theme.colors.textMuted} style={{ position: 'absolute', left: 12, top: 14 }} />
                  <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} style={{ ...fieldStyle({ paddingLeft: 36 }) }} />
                </div>
              </div>
            )}

            {error && <div style={{ color: theme.colors.error, fontSize: 13, lineHeight: 1.5 }}>{error}</div>}
            {info && <div style={{ color: theme.colors.success, fontSize: 13, lineHeight: 1.5 }}>{info}</div>}

            <button type="submit" disabled={loading} style={{ border: '0', borderRadius: 12, minHeight: 46, background: theme.colors.text, color: '#0A201F', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'reset' ? 'Send reset link' : 'Create account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 13, color: theme.colors.textSoft, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setMode('reset')} style={{ border: 0, background: 'transparent', color: theme.colors.gold, cursor: 'pointer', padding: 0 }}>
              Forgot password?
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ border: 0, background: 'transparent', color: theme.colors.gold, cursor: 'pointer', padding: 0 }}>
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
