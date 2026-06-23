import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm.js';
import '../styles/login.css';

/* ─── Reusable Field ─────────────────────────────────────────── */
function Field({ label, name, type = 'text', value, onChange, error, placeholder = '', rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="ag-field">
      <label
        className={`ag-label${focused ? ' ag-label--active' : ''}`}
        htmlFor={`lp-${name}`}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={`lp-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={
            name === 'password'        ? 'current-password'
            : name === 'confirmPassword' ? 'new-password'
            : name === 'email'           ? 'email'
            : 'off'
          }
          className={`ag-input${rightSlot ? ' ag-input--password' : ''}${error ? ' ag-input--error' : ''}`}
          placeholder={placeholder}
        />
        {rightSlot}
      </div>
      {error && <span className="ag-error-msg">{error}</span>}
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
      className="ag-eye-btn"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

/* ─── Feature Grid Cell ──────────────────────────────────────── */
const FEATURES = [
  {
    pos: 'tl',
    title: 'Protected Routes',
    body: 'Session persistence and token sync',
  },
  {
    pos: 'tr',
    title: 'Email Verification',
    body: 'Secure signup and password reset',
  },
  {
    pos: 'bl',
    title: 'Portfolio Intelligence',
    body: 'Live holdings, allocation, and risk',
  },
  {
    pos: 'br',
    title: 'AI Advisor',
    body: 'Portfolio-aware financial analysis',
  },
];

/* ─── Diamond ornament SVG ───────────────────────────────────── */
function DiamondSVG() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="12" y="2"
        width="14" height="14"
        rx="0"
        transform="rotate(45 12 2)"
        fill="none"
        stroke="rgba(200,179,142,0.30)"
        strokeWidth="1"
      />
      <rect
        x="12" y="5"
        width="9"  height="9"
        rx="0"
        transform="rotate(45 12 5)"
        fill="none"
        stroke="rgba(200,179,142,0.15)"
        strokeWidth="0.75"
      />
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

  const buttonLabel =
    activeTab === 'signin' ? 'SIGN IN'
    : activeTab === 'create' ? 'CREATE ACCOUNT'
    : 'SEND RESET LINK';

  return (
    <div className="login-page-root">

      {/* ════════════════════════════════════════════════
          LEFT PANEL — 56%
      ════════════════════════════════════════════════ */}
      <div className="ag-left-panel">

        {/* Top label bar */}
        <div className="ag-left-label-bar">
          <div className="ag-left-label-bar__accent" />
          <span className="ag-left-label-bar__text">Private Wealth Terminal</span>
        </div>

        {/* Main content block — vertically centered */}
        <div className="ag-left-content">

          {/* Hero heading */}
          <div className="ag-hero-heading">
            <div>ARCA,</div>
            <div>REIMAGINED</div>
            <div>FOR ELITE</div>
            <div>
              INVESTORS<span className="ag-hero-heading__period">.</span>
            </div>
          </div>

          {/* Feature grid */}
          <div className="ag-feature-grid">
            {FEATURES.map(f => (
              <div
                key={f.pos}
                className={`ag-feature-cell ag-feature-cell--${f.pos}`}
              >
                <div className="ag-feature-cell__title">{f.title}</div>
                <div className="ag-feature-cell__body">{f.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer metadata line */}
        <div className="ag-left-footer">
          ANTIGRAVITY · PRIVATE TERMINAL · 2026
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PANEL DIVIDER
      ════════════════════════════════════════════════ */}
      <div className="ag-divider-line">
        <div className="ag-divider-ornament">
          <DiamondSVG />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT PANEL — 44%
      ════════════════════════════════════════════════ */}
      <div className="ag-right-panel">

        {/* Mobile branding (≤640px only) */}
        <div className="ag-mobile-branding">
          <div style={{ width: '2px', height: '14px', background: 'var(--gold)', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>
            Private Wealth Terminal
          </span>
        </div>

        {/* ── Fixed 360px form column ──────────────────── */}
        <div className="ag-form-wrapper">

          {/* Access Terminal header */}
          <div className="ag-terminal-header">
            <div className="ag-terminal-icon">
              <ShieldCheck size={20} color="var(--gold)" strokeWidth={1.5} />
            </div>
            <div>
              <div className="ag-terminal-title">Access Terminal</div>
              <div className="ag-terminal-subtitle">Your private financial command center.</div>
            </div>
          </div>

          {/* Tab group */}
          <div className="ag-tab-group">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'create', label: 'Create Account' },
              { id: 'forgot', label: 'Forgot Password' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`ag-tab-btn${activeTab === tab.id ? ' ag-tab-btn--active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Display name — create only */}
            {activeTab === 'create' && (
              <Field
                label="Display Name"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                error={errors.displayName}
                placeholder="Your name"
              />
            )}

            {/* Email — all tabs */}
            <Field
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
            />

            {/* Password — signin + create */}
            {(activeTab === 'signin' || activeTab === 'create') && (
              <Field
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                rightSlot={
                  <EyeBtn show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                }
              />
            )}

            {/* Confirm password — create only */}
            {activeTab === 'create' && (
              <Field
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="••••••••"
                rightSlot={
                  <EyeBtn
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
            )}

            {/* Forgot success / submit button */}
            {activeTab === 'forgot' && forgotSent ? (
              <div className="ag-forgot-success">
                Reset link sent. Check your inbox.
              </div>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`ag-btn-primary${isSuccess ? ' ag-btn-primary--success' : ''}${isLoading ? ' ag-btn-primary--loading' : ''}`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle size={16} color="var(--ag-success)" />
                    <span style={{ color: 'var(--ag-success)', fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.20em' }}>
                      AUTHENTICATED
                    </span>
                  </>
                ) : isLoading ? (
                  <span style={{ letterSpacing: '0.20em', color: '#0A201F' }}>···</span>
                ) : (
                  <>
                    <span>{buttonLabel}</span>
                    <ArrowRight size={16} color="#0A201F" />
                  </>
                )}
              </button>
            )}

            {/* General API error */}
            {errors.general && (
              <div className="ag-general-error">{errors.general}</div>
            )}
          </form>

          {/* Secondary links */}
          <div className="ag-secondary-links">
            {activeTab === 'signin' && (
              <>
                <button
                  type="button"
                  className="ag-link-muted"
                  onClick={() => handleTabChange('forgot')}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="ag-link-gold"
                  onClick={() => handleTabChange('create')}
                >
                  Need an account?
                </button>
              </>
            )}
            {activeTab === 'create' && (
              <button
                type="button"
                className="ag-link-muted"
                onClick={() => handleTabChange('signin')}
              >
                Already have an account?
              </button>
            )}
            {activeTab === 'forgot' && (
              <button
                type="button"
                className="ag-link-gold"
                onClick={() => handleTabChange('signin')}
                style={{ marginLeft: 'auto' }}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Trust footer */}
        <div className="ag-trust-footer">
          256-bit encrypted · SOC 2 aligned · No data sold
        </div>
      </div>
    </div>
  );
}
