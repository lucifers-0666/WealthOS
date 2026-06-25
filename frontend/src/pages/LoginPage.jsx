import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm.js';
import '../styles/login.css';

/* ─── Reusable Field ─────────────────────────────────────────── */
function Field({ label, name, type = 'text', value, onChange, error, placeholder = '', rightSlot }) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={`lp-${name}`}>
        {label}
      </label>
      <div className="auth-input-wrap">
        <input
          id={`lp-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={
            name === 'password'        ? 'current-password'
            : name === 'confirmPassword' ? 'new-password'
            : name === 'email'           ? 'email'
            : 'off'
          }
          className={`auth-input${rightSlot ? ' password-field' : ''}`}
          placeholder={placeholder}
          style={error ? { borderColor: '#B66A6A' } : {}}
        />
        {rightSlot}
      </div>
      {error && <p className="auth-error" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#B66A6A', marginTop: '6px', marginBottom: 0 }}>{error}</p>}
    </div>
  );
}

/* ─── Eye Toggle ─────────────────────────────────────────────── */
function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="eye-toggle"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

/* ─── Feature Grid Cell ──────────────────────────────────────── */
const FEATURES = [
  { pos: 'tl', title: 'Protected Routes', body: 'Session persistence and token sync' },
  { pos: 'tr', title: 'Email Verification', body: 'Secure signup and password reset' },
  { pos: 'bl', title: 'Portfolio Intelligence', body: 'Live holdings, allocation, and risk' },
  { pos: 'br', title: 'AI Advisor', body: 'Portfolio-aware financial analysis' },
];

/* ─── Diamond ornament SVG ───────────────────────────────────── */
function DiamondSVG() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="2" width="14" height="14" rx="0" transform="rotate(45 12 2)" fill="none" stroke="rgba(200,179,142,0.30)" strokeWidth="1" />
      <rect x="12" y="5" width="9"  height="9" rx="0" transform="rotate(45 12 5)" fill="none" stroke="rgba(200,179,142,0.15)" strokeWidth="0.75" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const {
    activeTab,
    handleTabChange,
    formData,
    handleChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    errors,
    isSuccess,
    forgotSent,
    handleSubmit,
  } = useLoginForm();

  // Autofill fix
  useEffect(() => {
    const handleAnimationStart = (e) => {
      if (e.animationName === 'onAutoFillStart') {
        e.target.classList.add('autofilled');
      }
    };
    const inputs = document.querySelectorAll('.auth-input');
    inputs.forEach(input => input.addEventListener('animationstart', handleAnimationStart));
    return () => {
      inputs.forEach(input => input.removeEventListener('animationstart', handleAnimationStart));
    };
  }, [activeTab]);

  const buttonLabel =
    activeTab === 'signin' ? 'SIGN IN'
    : activeTab === 'create' ? 'CREATE ACCOUNT'
    : 'SEND RESET LINK';

  return (
    <div className="login-page-root">
      {/* LEFT PANEL */}
      <div className="ag-left-panel">
        <div className="ag-left-label-bar">
          <div className="ag-left-label-bar__accent" />
          <span className="ag-left-label-bar__text">Private Wealth Terminal</span>
        </div>
        <div className="ag-left-content">
          <div className="ag-hero-heading">
            <div>ARCA,</div>
            <div>REIMAGINED</div>
            <div>FOR ELITE</div>
            <div>
              INVESTORS<span className="ag-hero-heading__period">.</span>
            </div>
          </div>
          <div className="ag-feature-grid">
            {FEATURES.map(f => (
              <div key={f.pos} className={`ag-feature-cell ag-feature-cell--${f.pos}`}>
                <div className="ag-feature-cell__title">{f.title}</div>
                <div className="ag-feature-cell__body">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="ag-left-footer">ANTIGRAVITY · PRIVATE TERMINAL · 2026</div>
      </div>

      <div className="ag-divider-line">
        <div className="ag-divider-ornament">
          <DiamondSVG />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ag-right-panel">
        <div className="ag-mobile-branding">
          <div style={{ width: '2px', height: '14px', background: 'var(--gold)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Private Wealth Terminal
          </span>
        </div>

        {/* AUTH CARD */}
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-icon-wrap">
              <ShieldCheck size={22} color="#C8B38E" strokeWidth={1.5} />
            </div>
            <div className="auth-brand-text">
              <h1>Access Terminal</h1>
              <p>Your private financial command center.</p>
            </div>
          </div>

          <div className="auth-tabs">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'create', label: 'Create Account' },
              { id: 'forgot', label: 'Forgot Password' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`auth-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {activeTab === 'create' && (
              <Field label="Display Name" name="displayName" value={formData.displayName} onChange={handleChange} error={errors.displayName} placeholder="Your name" />
            )}
            <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" />
            
            {(activeTab === 'signin' || activeTab === 'create') && (
              <Field label="Password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} error={errors.password} placeholder="••••••••" rightSlot={<EyeBtn show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
            )}
            
            {activeTab === 'create' && (
              <Field label="Confirm Password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="••••••••" rightSlot={<EyeBtn show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />} />
            )}

            {activeTab === 'forgot' && forgotSent ? (
              <div className="ag-forgot-success" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7B7C70', textAlign: 'center', padding: '16px 0 8px' }}>
                Reset link sent. Check your inbox.
              </div>
            ) : (
              <button
                id="btn-sign-in"
                type="submit"
                className={`btn-auth-primary ${isSuccess ? 'state-success' : ''} ${isLoading ? 'state-loading' : ''}`}
                disabled={isLoading || isSuccess}
                aria-label="Sign in to Antigravity"
              >
                {isSuccess ? (
                  <>
                    <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="btn-label">AUTHENTICATED</span>
                  </>
                ) : (
                  <>
                    <span className="btn-label">{isLoading ? 'VERIFYING...' : buttonLabel}</span>
                    {!isLoading && <span className="btn-arrow">→</span>}
                  </>
                )}
              </button>
            )}

            {errors.general && (
              <p className="auth-error" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#B66A6A', marginTop: '10px', marginBottom: 0, textAlign: 'center' }}>
                {errors.general}
              </p>
            )}
          </form>

          <div className="auth-footer-links">
            {activeTab === 'signin' && (
              <>
                <button type="button" className="auth-link-forgot" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} onClick={() => handleTabChange('forgot')}>Forgot password?</button>
                <button type="button" className="auth-link-create" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} onClick={() => handleTabChange('create')}>Need an account?</button>
              </>
            )}
            {activeTab === 'create' && (
              <button type="button" className="auth-link-forgot" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} onClick={() => handleTabChange('signin')}>Already have an account?</button>
            )}
            {activeTab === 'forgot' && (
              <button type="button" className="auth-link-create" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 'auto' }} onClick={() => handleTabChange('signin')}>Back to sign in</button>
            )}
          </div>
        </div>

        <div className="ag-trust-footer">
          256-bit encrypted · SOC 2 aligned · No data sold
        </div>
      </div>
    </div>
  );
}
