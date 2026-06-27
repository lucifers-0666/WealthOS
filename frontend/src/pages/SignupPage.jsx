import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/auth.js';
import { 
  ShieldCheck, Eye, EyeSlash, CaretDown, Check, WarningCircle, CheckSquare, Square
} from '@phosphor-icons/react';
import AuthLayout from '../components/AuthLayout.jsx';
import '../styles/auth.css';

const defaultStep1 = { full_name: '', email: '', password: '', confirm_password: '', phone: '', referral_code: '' };
const defaultStep2 = { date_of_birth: '', gender: 'prefer_not_to_say', country: 'India', city: '', occupation: '', annual_income: '', experience_years: 'BEGINNER' };
const defaultStep3 = { risk_profile: 'BALANCED', investment_goal: '', investment_horizon: 'MEDIUM', terms_accepted: false, privacy_accepted: false };

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [step1, setStep1] = useState({ ...defaultStep1 });
  const [step2, setStep2] = useState({ ...defaultStep2 });
  const [step3, setStep3] = useState({ ...defaultStep3 });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRefCode, setShowRefCode] = useState(false);

  const getPasswordScore = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*]/.test(pwd)) score++;
    return score;
  };
  const pwdScore = getPasswordScore(step1.password);
  const getScoreColor = (sc) => sc <= 1 ? '#B66A6A' : sc === 2 ? '#D2A76D' : sc === 3 ? '#869FC4' : '#6FAE8D';
  const getScoreLabel = (sc) => sc <= 1 ? 'Weak' : sc === 2 ? 'Fair' : sc === 3 ? 'Good' : 'Strong';

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);

    if (step1.password !== step1.confirm_password) {
      setError('Passwords do not match'); setLoading(false); return;
    }
    if (step1.password.length < 8) {
      setError('Password must be at least 8 characters'); setLoading(false); return;
    }
    if (!step1.full_name || !step1.email || !step1.phone) {
      setError('Please fill all required fields'); setLoading(false); return;
    }

    if (step1.referral_code) {
      const { data: refData, error: refErr } = await supabase.from('referral_codes').select('code').eq('code', step1.referral_code).single();
      if (refErr || !refData) {
        setError('Invalid referral code'); setLoading(false); return;
      }
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: step1.email,
      password: step1.password,
      options: { data: { full_name: step1.full_name, phone: step1.phone } }
    });

    if (signUpError) {
      setError(signUpError.message); setLoading(false); return;
    }
    const uid = authData.user?.id;
    if (!uid) {
      setError('Signup failed. Try again.'); setLoading(false); return;
    }
    setUserId(uid);

    await supabase.from('profiles').update({
      phone: step1.phone,
      referral_code: step1.referral_code || null,
      onboarding_step: 2
    }).eq('id', uid);

    setLoading(false);
    setStep(2);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);

    if (!step2.city || !step2.occupation || !step2.annual_income) {
      setError('Please fill all fields'); setLoading(false); return;
    }

    const { error: updateError } = await supabase.from('profiles').update({
      city: step2.city,
      occupation: step2.occupation,
      annual_income: step2.annual_income,
      experience_years: step2.experience_years,
      onboarding_step: 3
    }).eq('id', userId);

    if (updateError) {
      setError(updateError.message); setLoading(false); return;
    }

    setLoading(false);
    setStep(3);
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);

    if (!step3.investment_goal) {
      setError('Please select an investment goal'); setLoading(false); return;
    }
    if (!step3.terms_accepted || !step3.privacy_accepted) {
      setError('You must accept the Terms and Privacy Policy to continue.'); setLoading(false); return;
    }

    const { error: updateError } = await supabase.from('profiles').update({
      risk_profile: step3.risk_profile,
      investment_goal: step3.investment_goal,
      experience_years: step3.investment_horizon, // mapping horizon to unused db field for now
      terms_accepted: true,
      onboarding_done: true,
      onboarding_step: 3
    }).eq('id', userId);

    if (updateError) {
      setError(updateError.message); setLoading(false); return;
    }

    setLoading(false);
    navigate('/dashboard');
  };

  const renderStepIndicator = () => (
    <div className="auth-steps">
      <div className="auth-step-connector">
        <div className="auth-step-connector-fill" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
      </div>
      {[
        { num: 1, label: 'CREDENTIALS' },
        { num: 2, label: 'PROFILE' },
        { num: 3, label: 'STRATEGY' }
      ].map(s => {
        const isActive = step === s.num;
        const isCompleted = step > s.num;
        const isUpcoming = step < s.num;
        return (
          <div key={s.num} className="auth-step-node">
            <div className={`auth-step-circle ${isActive ? 'active' : isCompleted ? 'completed' : 'inactive'}`}>
              {isCompleted ? <Check size={10} color="#0A201F" weight="bold" /> : <span className="auth-step-num">{s.num}</span>}
            </div>
            <div className={`auth-step-label ${isActive ? 'active' : ''}`}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );

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

        <div className="auth-page-header">
          <h2 className="auth-page-title">Create Account</h2>
          <p className="auth-page-desc">Begin your Antigravity journey.</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div style={{ backgroundColor: 'rgba(182,106,106,0.06)', border: '1px solid rgba(182,106,106,0.60)', padding: '10px 12px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <WarningCircle size={14} color="#B66A6A" weight="fill" />
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#B66A6A' }}>{error}</span>
          </div>
        )}

        <form onSubmit={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleStep3}>
          {step === 1 && (
            <>
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <div className="auth-input-wrap">
                  <input className="auth-input" type="text" value={step1.full_name} onChange={e => setStep1({...step1, full_name: e.target.value})} placeholder="Your full name" required />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <input className="auth-input" type="email" value={step1.email} onChange={e => setStep1({...step1, email: e.target.value})} placeholder="you@example.com" required />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Phone Number</label>
                <div className="auth-phone-row">
                  <div className="auth-phone-prefix">
                    +91 <CaretDown size={12} color="#7B7C70" />
                  </div>
                  <input className="auth-input auth-phone-input" type="tel" value={step1.phone} onChange={e => setStep1({...step1, phone: e.target.value})} placeholder="98765 43210" required />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input className="auth-input" type={showPassword ? "text" : "password"} value={step1.password} onChange={e => setStep1({...step1, password: e.target.value})} placeholder="••••••••" required />
                  <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {step1.password && (
                  <div className="pwd-meter">
                    <div className="pwd-bars">
                      {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="pwd-segment" style={{ background: pwdScore >= idx ? getScoreColor(pwdScore) : '#1E3530' }} />
                      ))}
                    </div>
                    <div className="pwd-label" style={{ color: getScoreColor(pwdScore) }}>{getScoreLabel(pwdScore)}</div>
                  </div>
                )}
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input className="auth-input" type={showConfirm ? "text" : "password"} value={step1.confirm_password} onChange={e => setStep1({...step1, confirm_password: e.target.value})} placeholder="••••••••" required />
                  <button type="button" className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!showRefCode && (
                <button type="button" onClick={() => setShowRefCode(true)} className="auth-link auth-link-accent" style={{ marginTop: 10 }}>
                  Have a referral code? &rarr;
                </button>
              )}
              {showRefCode && (
                <div className="auth-field" style={{ marginTop: 14 }}>
                  <label className="auth-label">Referral Code (Optional)</label>
                  <div className="auth-input-wrap">
                    <input className="auth-input" type="text" value={step1.referral_code} onChange={e => setStep1({...step1, referral_code: e.target.value})} placeholder="Enter code" />
                  </div>
                </div>
              )}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'PROCESSING...' : 'CREATE ACCOUNT \u2192'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#7B7C70' }}>Already have an account? </span>
                <button type="button" className="auth-link auth-link-accent" onClick={() => navigate('/login')}>Sign In</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#ACA492', margin: '0 0 16px 0' }}>
                Tell us about your investment background.
              </p>
              
              <div className="auth-field">
                <label className="auth-label">Occupation</label>
                <div className="auth-select-wrap">
                  <select className="auth-input auth-select" value={step2.occupation} onChange={e => setStep2({...step2, occupation: e.target.value})} required>
                    <option value="" disabled>Select your occupation</option>
                    <option value="Business Owner">Business Owner</option>
                    <option value="Salaried Professional">Salaried Professional</option>
                    <option value="Self Employed">Self Employed</option>
                    <option value="Retired">Retired</option>
                    <option value="Other">Other</option>
                  </select>
                  <CaretDown size={14} className="auth-select-icon" />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Annual Income Range</label>
                <div className="auth-select-wrap">
                  <select className="auth-input auth-select" value={step2.annual_income} onChange={e => setStep2({...step2, annual_income: e.target.value})} required>
                    <option value="" disabled>Select income range</option>
                    <option value="Below ₹10L">Below ₹10L</option>
                    <option value="₹10L – ₹25L">₹10L – ₹25L</option>
                    <option value="₹25L – ₹50L">₹25L – ₹50L</option>
                    <option value="₹50L – ₹1Cr">₹50L – ₹1Cr</option>
                    <option value="Above ₹1Cr">Above ₹1Cr</option>
                  </select>
                  <CaretDown size={14} className="auth-select-icon" />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Investment Experience</label>
                <div className="segmented-control">
                  {['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED'].map(level => (
                    <button type="button" key={level} className={`segmented-btn ${step2.experience_years === level ? 'active' : ''}`} onClick={() => setStep2({...step2, experience_years: level})}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">City</label>
                <div className="auth-input-wrap">
                  <input className="auth-input" type="text" value={step2.city} onChange={e => setStep2({...step2, city: e.target.value})} placeholder="Mumbai, Delhi, Bangalore..." required />
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'PROCESSING...' : 'CONTINUE \u2192'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button type="button" className="auth-link" onClick={() => { setStep(1); setError(null); }}>
                  &larr; Back to Credentials
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#ACA492', margin: '0 0 16px 0' }}>
                Define your investment strategy preferences.
              </p>

              <div className="auth-field">
                <label className="auth-label">Risk Appetite</label>
                <div className="tile-selector">
                  {[
                    { id: 'CONSERVATIVE', title: 'CONSERVATIVE', sub: 'Preserve capital, low risk' },
                    { id: 'BALANCED', title: 'BALANCED', sub: 'Growth with stability' },
                    { id: 'AGGRESSIVE', title: 'AGGRESSIVE', sub: 'Maximum growth, high risk' }
                  ].map(t => (
                    <div key={t.id} className={`risk-tile ${step3.risk_profile === t.id ? 'active' : ''}`} onClick={() => setStep3({...step3, risk_profile: t.id})}>
                      <div className="risk-tile-title">{t.title}</div>
                      <div className="risk-tile-sub">{t.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Primary Goal</label>
                <div className="auth-select-wrap">
                  <select className="auth-input auth-select" value={step3.investment_goal} onChange={e => setStep3({...step3, investment_goal: e.target.value})} required>
                    <option value="" disabled>Select your primary goal</option>
                    <option value="Wealth Preservation">Wealth Preservation</option>
                    <option value="Steady Income">Steady Income</option>
                    <option value="Capital Growth">Capital Growth</option>
                    <option value="Retirement Planning">Retirement Planning</option>
                    <option value="Child's Education">Child's Education</option>
                    <option value="Tax Optimization">Tax Optimization</option>
                  </select>
                  <CaretDown size={14} className="auth-select-icon" />
                </div>
              </div>

              <div className="auth-field" style={{ marginBottom: 24 }}>
                <label className="auth-label">Investment Horizon</label>
                <div className="segmented-control">
                  {['SHORT', 'MEDIUM', 'LONG'].map(h => (
                    <button type="button" key={h} className={`segmented-btn ${step3.investment_horizon === h ? 'active' : ''}`} onClick={() => setStep3({...step3, investment_horizon: h})}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="auth-checkbox-row">
                  <input type="checkbox" checked={step3.terms_accepted} onChange={e => setStep3({...step3, terms_accepted: e.target.checked})} />
                  <div className="auth-checkbox-box">{step3.terms_accepted && <Check size={10} color="#0A201F" weight="bold" />}</div>
                  <span className="auth-checkbox-label">
                    I agree to the <a href="#">Terms of Service</a>
                  </span>
                </label>
                <label className="auth-checkbox-row">
                  <input type="checkbox" checked={step3.privacy_accepted} onChange={e => setStep3({...step3, privacy_accepted: e.target.checked})} />
                  <div className="auth-checkbox-box">{step3.privacy_accepted && <Check size={10} color="#0A201F" weight="bold" />}</div>
                  <span className="auth-checkbox-label">
                    I agree to the <a href="#">Privacy Policy</a>
                  </span>
                </label>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'INITIALIZING...' : 'LAUNCH TERMINAL \u2192'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button type="button" className="auth-link" onClick={() => { setStep(2); setError(null); }}>
                  &larr; Back to Profile
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </AuthLayout>
  );
}
