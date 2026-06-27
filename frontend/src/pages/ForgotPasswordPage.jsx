import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react';
import AuthLayout from '../components/AuthLayout.jsx';
import { supabase } from '../lib/auth.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2);
  };

  const handleResend = async () => {
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
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
          <button className="auth-tab" role="tab" onClick={() => navigate('/login')}>Sign In</button>
          <button className="auth-tab" role="tab" onClick={() => navigate('/signup')}>Create Account</button>
          <button className="auth-tab active" role="tab">Forgot Password</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(182,106,106,0.06)', border: '1px solid rgba(182,106,106,0.60)', padding: '10px 12px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#B66A6A' }}>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendReset}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <EnvelopeSimple size={32} color="#7B7C70" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#ACA492', textAlign: 'center', maxWidth: 280, lineHeight: 1.55, margin: 0 }}>
                Enter your registered email address. We'll send you a secure reset link.
              </p>
            </div>

            <div className="auth-field">
              <div className="auth-input-wrap">
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'SENDING...' : 'SEND RESET LINK \u2192'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="auth-link" onClick={() => navigate('/login')}>
                &larr; Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle size={40} color="#6FAE8D" weight="fill" style={{ marginBottom: 14 }} />
            <h2 style={{ fontFamily: 'Cinzel', fontSize: 15, fontWeight: 700, color: '#ECE0CC', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              Check your inbox
            </h2>
            <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#ACA492', textAlign: 'center', lineHeight: 1.55, margin: 0 }}>
              A secure reset link has been sent to<br />{email}
            </p>
            <p style={{ fontFamily: 'Inter', fontSize: 10, color: '#7B7C70', textAlign: 'center', margin: '12px 0 0 0' }}>
              Link expires in 15 minutes. Check spam if not received.
            </p>
            
            <div className="auth-divider" style={{ width: '100%', margin: '16px 0' }} />
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="auth-btn-ghost" onClick={handleResend} disabled={loading}>
                {loading ? 'SENDING...' : 'RESEND EMAIL \u2192'}
              </button>
              <button type="button" className="auth-link" onClick={() => navigate('/login')} style={{ marginTop: 4 }}>
                &larr; Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
