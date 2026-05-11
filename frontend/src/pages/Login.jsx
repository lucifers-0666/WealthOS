import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
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
        navigate('/dashboard');
      } else {
        await signUp(email, password, name);
        setInfo('Account created — check your email to confirm, then log in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* Ambient background */}
      <div className="login-ambient" aria-hidden="true" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-label="WealthOS">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="#7DD3FC" strokeWidth="1.5"/>
            <path d="M8 22L13 12L18 18L22 10" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="10" r="2" fill="#A78BFA"/>
          </svg>
          <span className="login-logo-text">WealthOS</span>
        </div>

        <p className="login-tagline">Your AI-powered financial intelligence terminal</p>

        {/* Mode tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setInfo(null); }}
          >Sign In</button>
          <button
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
          >Create Account</button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name" type="text" placeholder="Zaid Amreliya"
                value={name} onChange={(e) => setName(e.target.value)}
                required={mode === 'signup'}
                autoComplete="name"
              />
            </div>
          )}
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="form-error">{error}</div>}
          {info && <div className="form-info">{info}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="login-footer">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="login-switch" onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null); setInfo(null);
          }}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
