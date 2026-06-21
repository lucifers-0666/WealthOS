import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm.js';
import '../styles/login.css';

/* ─── Reusable Field Component ───────────────────────────────── */
function Field({ label, name, type = 'text', value, onChange, error, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '16px' }}>
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
            name === 'password' ? 'current-password'
            : name === 'confirmPassword' ? 'new-password'
            : name === 'email' ? 'email'
            : 'off'
          }
          className={`ag-input${rightSlot ? ' ag-input--password' : ''}${error ? ' ag-input--error' : ''}`}
          placeholder=""
        />
        {rightSlot}
      </div>
      {error && (
        <span style={{
          display: 'block',
          marginTop: '5px',
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          fontSize: '11px',
          color: 'rgba(224, 82, 82, 0.90)',
        }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ─── Eye Toggle Button ──────────────────────────────────────── */
function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      style={{
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: 'rgba(212, 160, 23, 0.55)',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212, 160, 23, 0.90)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212, 160, 23, 0.55)')}
    >
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}

/* ─── Main Page Component ────────────────────────────────────── */
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

  function tabClass(tab) {
    const isActive = activeTab === tab;
    return {
      flex: 1,
      padding: '10px 0',
      fontFamily: "'Cinzel', 'Georgia', serif",
      fontSize: '12px',
      fontWeight: 500,
      textAlign: 'center',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: isActive ? '#F9F3E6' : 'rgba(249, 243, 230, 0.40)',
      transition: 'color 150ms ease',
      position: 'relative',
    };
  }

  const buttonLabel =
    activeTab === 'signin' ? 'SIGN IN'
    : activeTab === 'create' ? 'CREATE ACCOUNT'
    : 'SEND RESET LINK';

  return (
    <div
      className="login-page-root"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        background: '#0B1F12',
        position: 'relative',
      }}
    >
      {/* ── Panel Divider (desktop only) ─────────────────────── */}
      <div
        className="ag-divider-line"
        style={{
          position: 'absolute',
          top: 0,
          left: '55%',
          width: '1px',
          height: '100%',
          background: 'rgba(212, 160, 23, 0.20)',
          zIndex: 10,
        }}
      />

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — 55%
      ══════════════════════════════════════════════════════ */}
      <div
        className="ag-left-panel"
        style={{
          width: '55%',
          height: '100vh',
          background: '#071A0E',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'none',
        }}
      >
        {/* ── Top Zone ──────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: '48px', left: '48px', right: '48px' }}>
          {/* Branding Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{ width: '3px', height: '13px', background: '#D4A017', flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              color: '#D4A017',
              textTransform: 'uppercase',
            }}>
              PRIVATE WEALTH TERMINAL
            </span>
          </div>

          {/* Hero Headline */}
          <div style={{
            fontFamily: "'Cinzel', 'Georgia', serif",
            fontSize: '68px',
            fontWeight: 700,
            lineHeight: 1.05,
            color: '#F9F3E6',
            marginTop: '0',
            marginBottom: '0',
          }}>
            <div>ARCA,</div>
            <div>REIMAGINED</div>
            <div>FOR</div>
            <div>ELITE</div>
            <div>
              <span style={{ color: '#F9F3E6' }}>INVESTORS</span>
              <span style={{
                color: '#D4A017',
                fontFamily: "'Cinzel', 'Georgia', serif",
                fontSize: '76px',
                fontWeight: 700,
                lineHeight: 1.05,
                display: 'inline',
                position: 'relative',
                top: '2px',
              }}>.</span>
            </div>
          </div>

          {/* Subtitle */}
          <p style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: '15px',
            fontWeight: 400,
            color: 'rgba(249, 243, 230, 0.62)',
            lineHeight: 1.65,
            maxWidth: '440px',
            margin: '32px 0 0 0',
          }}>
            Sign in to enter a premium financial command environment with portfolio intelligence,{' '}
            AI analysis, and market context.
          </p>
        </div>

        {/* ── Bottom Zone ───────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: '48px', left: '48px', right: '48px' }}>
          {/* Feature Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            background: 'rgba(212, 160, 23, 0.15)',
          }}>
            {[
              { title: 'Protected Routes',     body: 'Session persistence and token sync' },
              { title: 'Email Verification',   body: 'Secure signup and password reset' },
              { title: 'Portfolio Intelligence', body: 'Live holdings, allocation, and risk' },
              { title: 'AI Advisor',            body: 'Portfolio-aware financial analysis' },
            ].map(card => (
              <div
                key={card.title}
                style={{
                  background: '#071A0E',
                  padding: '16px 20px',
                  borderLeft: '2px solid rgba(212, 160, 23, 0.50)',
                }}
              >
                <div className="login-card-title">{card.title}</div>
                <div style={{
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: 'rgba(249, 243, 230, 0.50)',
                }}>
                  {card.body}
                </div>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div style={{
            marginTop: '18px',
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: '9px',
            fontWeight: 400,
            letterSpacing: '0.18em',
            color: 'rgba(249, 243, 230, 0.28)',
            textTransform: 'uppercase',
          }}>
            ANTIGRAVITY · PRIVATE TERMINAL · 2026
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — 45%
      ══════════════════════════════════════════════════════ */}
      <div
        className="ag-right-panel"
        style={{
          flex: 1,
          height: '100vh',
          background: '#0F2518',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── Mobile Branding (< 768px) ──────────────────────── */}
        <div
          className="ag-mobile-branding"
          style={{
            display: 'none',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
            width: '100%',
            padding: '0 32px',
          }}
        >
          <div style={{ width: '3px', height: '13px', background: '#D4A017', flexShrink: 0 }} />
          <span style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.24em',
            color: '#D4A017',
            textTransform: 'uppercase',
          }}>
            PRIVATE WEALTH TERMINAL
          </span>
        </div>

        {/* ── Form Block ─────────────────────────────────────── */}
        <div
          id="login-form-block"
          style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}
        >
          {/* Access Terminal Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(20, 43, 25, 0.90)',
              border: '1px solid rgba(212, 160, 23, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={20} color="rgba(212, 160, 23, 0.80)" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.22em',
                color: '#F9F3E6',
                textTransform: 'uppercase',
              }}>
                ACCESS TERMINAL
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 400,
                color: 'rgba(249, 243, 230, 0.42)',
                marginTop: '3px',
              }}>
                Your private financial command center.
              </div>
            </div>
          </div>

          {/* Tab Row */}
          <div style={{
            display: 'flex',
            width: '100%',
            marginTop: '28px',
            borderBottom: '1px solid rgba(212, 160, 23, 0.15)',
          }}>
            {[
              { id: 'signin', label: 'Sign in' },
              { id: 'create', label: 'Create account' },
              { id: 'forgot', label: 'Forgot password' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                style={tabClass(tab.id)}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'rgba(249, 243, 230, 0.75)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'rgba(249, 243, 230, 0.40)';
                  }
                }}
              >
                <span className={activeTab === tab.id ? 'login-tab-active-underline' : ''}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* ── FORM ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate style={{ marginTop: '28px' }}>
            {/* Create account: Display Name */}
            {activeTab === 'create' && (
              <Field
                label="DISPLAY NAME"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                error={errors.displayName}
              />
            )}

            {/* Email — all tabs */}
            <Field
              label="EMAIL"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            {/* Password — sign in + create */}
            {(activeTab === 'signin' || activeTab === 'create') && (
              <Field
                label="PASSWORD"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                rightSlot={
                  <EyeBtn show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                }
              />
            )}

            {/* Confirm Password — create only */}
            {activeTab === 'create' && (
              <Field
                label="CONFIRM PASSWORD"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                rightSlot={
                  <EyeBtn
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
            )}

            {/* Forgot password success state */}
            {activeTab === 'forgot' && forgotSent ? (
              <div style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: '14px',
                color: 'rgba(249, 243, 230, 0.70)',
                textAlign: 'center',
                marginTop: '12px',
                marginBottom: '8px',
              }}>
                Reset link sent. Check your inbox.
              </div>
            ) : (
              /* Submit Button */
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`ag-btn-primary${isSuccess ? ' ag-btn-primary--success' : ''}${isLoading ? ' ag-btn-primary--loading' : ''}`}
                style={{ marginTop: '18px' }}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle size={16} color="var(--ag-success-text)" />
                    <span style={{ color: 'var(--ag-success-text)' }}>AUTHENTICATED</span>
                  </>
                ) : isLoading ? (
                  <span style={{ color: '#1C1508', letterSpacing: '0.20em' }}>...</span>
                ) : (
                  <>
                    <span>{buttonLabel}</span>
                    <ArrowRight size={16} color="#1C1508" />
                  </>
                )}
              </button>
            )}

            {/* General API error */}
            {errors.general && (
              <div style={{
                marginTop: '10px',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: '11px',
                color: 'rgba(224, 82, 82, 0.90)',
                textAlign: 'center',
              }}>
                {errors.general}
              </div>
            )}
          </form>

          {/* ── Below-Button Links ──────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
          }}>
            {activeTab === 'signin' && (
              <>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabChange('forgot')}
                  onKeyDown={e => e.key === 'Enter' && handleTabChange('forgot')}
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: 'rgba(249, 243, 230, 0.45)',
                    transition: 'color 150ms ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(249, 243, 230, 0.80)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(249, 243, 230, 0.45)')}
                >
                  Forgot password?
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabChange('create')}
                  onKeyDown={e => e.key === 'Enter' && handleTabChange('create')}
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: 'rgba(212, 160, 23, 0.80)',
                    transition: 'color 150ms ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212, 160, 23, 1.00)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212, 160, 23, 0.80)')}
                >
                  Need an account?
                </span>
              </>
            )}
            {activeTab === 'create' && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange('signin')}
                onKeyDown={e => e.key === 'Enter' && handleTabChange('signin')}
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: 'rgba(249, 243, 230, 0.45)',
                  transition: 'color 150ms ease',
                  userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(249, 243, 230, 0.80)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(249, 243, 230, 0.45)')}
              >
                Already have an account?
              </span>
            )}
            {activeTab === 'forgot' && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange('signin')}
                onKeyDown={e => e.key === 'Enter' && handleTabChange('signin')}
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: 'rgba(212, 160, 23, 0.80)',
                  transition: 'color 150ms ease',
                  userSelect: 'none',
                  marginLeft: 'auto',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212, 160, 23, 1.00)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212, 160, 23, 0.80)')}
              >
                Back to sign in
              </span>
            )}
          </div>
        </div>

        {/* ── Security Line ──────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          left: 0,
          right: 0,
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: '10px',
            fontWeight: 400,
            letterSpacing: '0.10em',
            color: 'rgba(249, 243, 230, 0.22)',
          }}>
            256-bit encrypted · SOC 2 aligned · No data sold
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RESPONSIVE STYLES (injected via <style>)
      ══════════════════════════════════════════════════════ */}
      <style>{`
        @media (min-width: 768px) {
          .ag-left-panel {
            display: block !important;
          }
          .ag-mobile-branding {
            display: none !important;
          }
          .ag-divider-line {
            display: block !important;
          }
        }
        @media (max-width: 767px) {
          .ag-left-panel {
            display: none !important;
          }
          .ag-right-panel {
            justify-content: flex-start !important;
            padding-top: 48px !important;
          }
          .ag-mobile-branding {
            display: flex !important;
          }
          .ag-divider-line {
            display: none !important;
          }
          #login-form-block {
            max-width: 100% !important;
          }
          .ag-right-panel > div[style*="position: absolute"][style*="bottom: 28px"] {
            position: static !important;
            margin-top: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
