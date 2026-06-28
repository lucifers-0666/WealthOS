import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth.js';
import { ShieldCheck, Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import AuthLayout from '../components/AuthLayout.jsx';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-inner-container">
        <div className="auth-card-header">
          <div className="auth-icon-wrap">
            <ShieldCheck size={28} weight="fill" color="var(--color-gold)" />
          </div>
          <p className="auth-brand-title">Access Terminal</p>
          <p className="auth-brand-sub">Your private financial command center.</p>
        </div>

        <div className="auth-divider" />

        <div className="auth-page-header">
          <h2 className="auth-page-title">Sign In</h2>
          <p className="auth-page-desc">Access your private wealth terminal.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(182,106,106,0.06)', border: '1px solid rgba(182,106,106,0.60)', padding: '10px 12px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <WarningCircle size={14} color="var(--color-loss)" weight="fill" />
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--color-loss)' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <input 
                type="email" 
                className="auth-input" 
                placeholder="you@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                className="auth-input" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'SIGN IN \u2192'}
          </button>
        </form>

        <div className="auth-bottom-links">
          <button type="button" className="auth-link" onClick={() => navigate('/forgot-password')}>
            Forgot password?
          </button>
          <button type="button" className="auth-link auth-link-accent" onClick={() => navigate('/signup')}>
            Create account &rarr;
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
