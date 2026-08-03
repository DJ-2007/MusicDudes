import React, { useState } from 'react';
import { FaMusic, FaEnvelope, FaLock, FaUser, FaPhoneAlt, FaGoogle, FaArrowRight, FaKey } from 'react-icons/fa';

export default function EmailAuthPage({ onSignIn, loading, error }) {
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone' | 'google'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSentToast, setOtpSentToast] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !password) return;
    const username = displayName.trim() || email.split('@')[0];
    onSignIn({ email: email.trim(), password, username, type: 'email' });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 7) return;
    setOtpSentToast(`OTP sent to ${phone}! (Use code: 123456)`);
    setOtpStep(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return;
    const fakeEmail = `${phone.replace(/\D/g, '')}@phone.musicdudes.com`;
    const username = displayName.trim() || `User_${phone.slice(-4)}`;
    onSignIn({ email: fakeEmail, phone, username, type: 'phone' });
  };

  const handleGoogleSignIn = () => {
    // Simulated Google OAuth Flow
    const googleUser = {
      email: 'user_google@gmail.com',
      username: 'Google User',
      type: 'google'
    };
    onSignIn(googleUser);
  };

  return (
    <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: '#090909' }}>
      <div className="landing-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 28px', background: '#121212', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.8)', textAlign: 'center' }}>
        
        {/* Brand Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #1db954, #1ed760)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 28px rgba(29,185,84,0.4)' }}>
            <FaMusic size={28} color="#000" />
          </div>
        </div>

        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>
          MusicDudes
        </h1>
        <p style={{ color: '#b3b3b3', fontSize: '0.88rem', marginBottom: '24px', lineHeight: '1.4' }}>
          Sign in to your account to access your saved playlists, liked songs, and synced rooms.
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 77, 77, 0.15)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {otpSentToast && (
          <div style={{ background: 'rgba(29, 185, 84, 0.15)', border: '1px solid #1db954', color: '#1db954', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {otpSentToast}
          </div>
        )}

        {/* Auth Method Selector Pills */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '22px', background: '#1e1e1e', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setOtpStep(false); setOtpSentToast(''); }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: authMethod === 'email' ? '#1db954' : 'transparent',
              color: authMethod === 'email' ? '#000' : '#b3b3b3',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaEnvelope size={12} /> Email
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setOtpStep(false); setOtpSentToast(''); }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: authMethod === 'phone' ? '#1db954' : 'transparent',
              color: authMethod === 'phone' ? '#000' : '#b3b3b3',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaPhoneAlt size={12} /> Phone
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('google'); setOtpStep(false); setOtpSentToast(''); }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: authMethod === 'google' ? '#1db954' : 'transparent',
              color: authMethod === 'google' ? '#000' : '#b3b3b3',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaGoogle size={12} /> Google
          </button>
        </div>

        {/* 1. EMAIL + PASSWORD FORM */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FaEnvelope style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    background: '#242424',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Password *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FaLock style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    background: '#242424',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Display Name (Optional)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FaUser style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    background: '#242424',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.includes('@') || !password}
              style={{
                marginTop: '10px',
                padding: '14px',
                background: '#1db954',
                border: 'none',
                borderRadius: '50px',
                color: '#000',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: loading || !email.includes('@') || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !email.includes('@') || !password ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Signing in...' : <>Sign In / Sign Up <FaArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {/* 2. PHONE NUMBER & OTP FORM */}
        {authMethod === 'phone' && (
          <div>
            {!otpStep ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    Phone Number *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FaPhoneAlt style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
                    <input
                      type="tel"
                      required
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        background: '#242424',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    Display Name (Optional)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FaUser style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
                    <input
                      type="text"
                      placeholder="e.g. Phone Dude"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        background: '#242424',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 7}
                  style={{
                    marginTop: '10px',
                    padding: '14px',
                    background: '#1db954',
                    border: 'none',
                    borderRadius: '50px',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: loading || phone.length < 7 ? 'not-allowed' : 'pointer',
                    opacity: loading || phone.length < 7 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Send OTP Code <FaArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    Enter 6-Digit OTP Code *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FaKey style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        background: '#242424',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1.1rem',
                        letterSpacing: '4px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  style={{
                    marginTop: '10px',
                    padding: '14px',
                    background: '#1db954',
                    border: 'none',
                    borderRadius: '50px',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: loading || otp.length < 4 ? 'not-allowed' : 'pointer',
                    opacity: loading || otp.length < 4 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Verify & Log In <FaArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. GOOGLE SIGN IN */}
        {authMethod === 'google' && (
          <div style={{ padding: '20px 0' }}>
            <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' }}>
              Fast and secure login using your Google Account.
            </p>
            <button
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                border: 'none',
                borderRadius: '50px',
                color: '#000',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <FaGoogle color="#ea4335" size={18} /> Continue with Google
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
