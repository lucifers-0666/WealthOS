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
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: 18 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', minHeight: 'calc(100dvh - 36px)', display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 18, alignItems: 'stretch' }}>
        <div style={{ ...panelStyle({ padding: 34, position: 'relative', overflow: 'hidden' }) }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 999, border: `1px solid var(--border-subtle)`, color: 'var(--greek-gold)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 24 }}>
            <Shield size={12} /> Secure access
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.6rem, 5vw, 5rem)', letterSpacing: '-0.06em', lineHeight: 0.95, margin: '0 0 18px', maxWidth: 10 }}>
            Arca, reimagined for elite investors.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 640, marginBottom: 26, fontFamily: 'var(--font-sans)' }}>
            Sign in to enter a premium financial command environment with portfolio intelligence, AI analysis, and market context.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, maxWidth: 700 }}>
            {[
              ['Protected routes', 'Session persistence and token sync'],
              ['Email verification', 'Secure signup and password reset'],
              ['Portfolio intelligence', 'Live holdings, allocation, and risk'],
              ['AI advisor', 'Portfolio-aware financial analysis'],
            ].map(([title, text]) => (
              <div key={title} style={{ padding: 18, borderRadius: 12, border: `1px solid var(--border)`, background: 'rgba(212,160,23,0.02)' }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-serif)' }}>{title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...panelStyle({ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(212,160,23,0.12)', color: 'var(--greek-gold)' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-serif)' }}>Access terminal</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sign in, create your account, or reset your password.</div>
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
                  border: `1px solid ${mode === value ? 'var(--border)' : 'var(--border-subtle)'}`,
                  background: mode === value ? 'rgba(212,160,23,0.08)' : 'transparent',
                  color: mode === value ? 'var(--text-primary)' : 'var(--text-secondary)',
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
                <label htmlFor="name" style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>Full name</label>
                <div style={{ position: 'relative' }}>
                  <UserRound size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 14 }} />
                  <input id="name" type="text" placeholder="Zaid Amreliya" value={name} onChange={(e) => setName(e.target.value)} required={mode === 'signup'} autoComplete="name" style={{ ...fieldStyle({ paddingLeft: 36 }) }} />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 14 }} />
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={{ ...fieldStyle({ paddingLeft: 36 }) }} />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: 14 }} />
                  <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} style={{ ...fieldStyle({ paddingLeft: 36 }) }} />
                </div>
              </div>
            )}

            {error && <div style={{ color: 'var(--terracotta)', fontSize: 13, lineHeight: 1.5 }}>{error}</div>}
            {info && <div style={{ color: 'var(--aegean-green)', fontSize: 13, lineHeight: 1.5 }}>{info}</div>}

            <button type="submit" disabled={loading} style={{ border: '1px solid rgba(212,160,23,0.5)', borderRadius: 12, minHeight: 46, background: 'linear-gradient(180deg, #f0e6c8, #d4a017)', color: '#1a1206', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'reset' ? 'Send reset link' : 'Create account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setMode('reset')} style={{ border: 0, background: 'transparent', color: 'var(--greek-gold)', cursor: 'pointer', padding: 0 }}>
              Forgot password?
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ border: 0, background: 'transparent', color: 'var(--greek-gold)', cursor: 'pointer', padding: 0 }}>
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
