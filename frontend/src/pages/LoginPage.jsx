import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/auth.js';
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrap">
            <ShieldCheck size={28} weight="fill" color="#C8B38E" />
          </div>
          <p className="auth-brand-title">Access Terminal</p>
          <p className="auth-brand-sub">Your private financial command center.</p>
        </div>

        <div className="auth-divider" />

        <div className="auth-tabs" role="tablist">
          <button className="auth-tab active" role="tab">Sign In</button>
          <button className="auth-tab" role="tab" onClick={() => navigate('/signup')}>Create Account</button>
          <button className="auth-tab" role="tab" onClick={() => navigate('/forgot-password')}>Forgot Password</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(182,106,106,0.06)', border: '1px solid rgba(182,106,106,0.60)', padding: '10px 12px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <WarningCircle size={14} color="#B66A6A" weight="fill" />
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#B66A6A' }}>{error}</span>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <button type="button" className="auth-link" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
          <button type="button" className="auth-link" onClick={() => navigate('/signup')}>Need an account?</button>
        </div>
      </div>
    </AuthLayout>
  );
}
