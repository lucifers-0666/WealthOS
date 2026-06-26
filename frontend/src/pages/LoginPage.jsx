import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm.js';
import '../styles/login.css';

function Field({ label, name, type = 'text', value, onChange, error, placeholder = '', rightSlot }) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={name}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={
            name === 'password' ? 'current-password' :
            name === 'confirmPassword' ? 'new-password' :
            name === 'email' ? 'email' : 'off'
          }
          className={`auth-input${error ? ' auth-input-error' : ''}`}
          placeholder={placeholder}
          style={error ? { borderColor: '#B66A6A' } : {}}
        />
        {rightSlot}
      </div>
      {error && <p className="auth-error" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#B66A6A', marginTop: '6px', marginBottom: 0 }}>{error}</p>}
    </div>
  );
}

function EyeBtn({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} tabIndex={-1} className="eye-toggle" aria-label={show ? 'Hide password' : 'Show password'}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

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

  const buttonLabel = activeTab === 'signin' ? 'Sign In' : activeTab === 'create' ? 'Create Account' : 'Send Reset Link';

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-divider" aria-hidden="true"></div>

        <div className="login-left">
          <div className="login-eyebrow">
            <span className="login-eyebrow-text">Private Wealth Terminal</span>
          </div>

          <h1 className="login-headline">
            Arca,<br />
            Reimagined<br />
            for Elite<br />
            Investors<span className="period">.</span>
          </h1>

          <div className="login-features">
            <div className="login-feature">
              <p className="login-feature-title">Protected Routes</p>
              <p className="login-feature-desc">Session persistence and token sync</p>
            </div>
            <div className="login-feature">
              <p className="login-feature-title">Email Verification</p>
              <p className="login-feature-desc">Secure signup and password reset</p>
            </div>
            <div className="login-feature">
              <p className="login-feature-title">Portfolio Intelligence</p>
              <p className="login-feature-desc">Live holdings, allocation, and risk</p>
            </div>
            <div className="login-feature">
              <p className="login-feature-title">AI Advisor</p>
              <p className="login-feature-desc">Portfolio-aware financial analysis</p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 256 256" fill="none">
                  <path d="M128 24L40 56v56c0 52.4 37.6 101.3 88 116 50.4-14.7 88-63.6 88-116V56L128 24z" 
                        stroke="#C8B38E" strokeWidth="16" strokeLinejoin="round"/>
                  <polyline points="96,128 112,144 160,96" 
                            stroke="#C8B38E" strokeWidth="16" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="auth-brand-title">Access Terminal</p>
                <p className="auth-brand-sub">Your private financial command center.</p>
              </div>
            </div>

            <div className="auth-tabs" role="tablist">
              <button className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`} role="tab" onClick={() => handleTabChange('signin')}>Sign In</button>
              <button className={`auth-tab ${activeTab === 'create' ? 'active' : ''}`} role="tab" onClick={() => handleTabChange('create')}>Create Account</button>
              <button className={`auth-tab ${activeTab === 'forgot' ? 'active' : ''}`} role="tab" onClick={() => handleTabChange('forgot')}>Forgot Password</button>
            </div>

            <form id="auth-form" onSubmit={handleSubmit} noValidate>
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
        </div>
      </main>

      <footer className="login-footer">
        <span className="login-footer-left">Antigravity · Private Terminal · 2026</span>
        <span className="login-footer-right">256-bit encrypted · SOC 2 aligned · No data sold</span>
      </footer>
    </div>
  );
}
