import React from 'react';
import { ShieldCheck, EnvelopeSimple, ChartPieSlice, Brain } from '@phosphor-icons/react';
import '../styles/auth.css';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      {/* Mobile Header */}
      <div className="auth-mobile-header">
        <div className="auth-mobile-header-left">
          {/* Minimal SVG Owl-laurel logo mark */}
          <svg width="24" height="24" viewBox="0 0 256 256" fill="none">
            <path d="M128 24L40 56v56c0 52.4 37.6 101.3 88 116 50.4-14.7 88-63.6 88-116V56L128 24z" stroke="var(--color-gold)" strokeWidth="16" strokeLinejoin="round"/>
            <polyline points="96,128 112,144 160,96" stroke="var(--color-gold)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="auth-mobile-header-title">ANTIGRAVITY</span>
        </div>
        <span className="auth-mobile-header-subtitle">PRIVATE TERMINAL</span>
      </div>

      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-logo-row">
          <svg width="24" height="24" viewBox="0 0 256 256" fill="none">
            <path d="M128 24L40 56v56c0 52.4 37.6 101.3 88 116 50.4-14.7 88-63.6 88-116V56L128 24z" stroke="var(--color-gold)" strokeWidth="16" strokeLinejoin="round"/>
            <polyline points="96,128 112,144 160,96" stroke="var(--color-gold)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="auth-logo-text">Antigravity</span>
        </div>
        
        <h1 className="auth-headline">
          <span>ARCA,</span>
          <span>REIMAGINED</span>
          <span>FOR ELITE</span>
          <span>INVESTORS.</span>
        </h1>

        <div className="auth-headline-sub">Private wealth intelligence. Minimum ₹10 Lakh.</div>
        <div className="auth-headline-rule" />

        <div className="auth-features-list">
          <div className="auth-feature-row">
            <ShieldCheck size={18} color="var(--color-gold)" weight="regular" className="auth-feature-icon" />
            <div>
              <div className="auth-feature-title">Protected Routes</div>
              <div className="auth-feature-desc">Session persistence and token sync</div>
            </div>
          </div>
          <div className="auth-feature-row">
            <EnvelopeSimple size={18} color="var(--color-gold)" weight="regular" className="auth-feature-icon" />
            <div>
              <div className="auth-feature-title">Email Verification</div>
              <div className="auth-feature-desc">Secure signup with verified email</div>
            </div>
          </div>
          <div className="auth-feature-row">
            <ChartPieSlice size={18} color="var(--color-gold)" weight="regular" className="auth-feature-icon" />
            <div>
              <div className="auth-feature-title">Portfolio Intelligence</div>
              <div className="auth-feature-desc">Live holdings, allocation, and risk</div>
            </div>
          </div>
          <div className="auth-feature-row">
            <Brain size={18} color="var(--color-gold)" weight="regular" className="auth-feature-icon" />
            <div>
              <div className="auth-feature-title">AI Advisor</div>
              <div className="auth-feature-desc">Portfolio-aware financial analysis</div>
            </div>
          </div>
        </div>

        <div className="auth-footer-left">
          <div>ANTIGRAVITY · PRIVATE TERMINAL · 2026</div>
          <div className="auth-footer-left-sub">256-BIT ENCRYPTED · SOC 2 ALIGNED · NO DATA SOLD</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        {children}
      </div>
    </div>
  );
}
