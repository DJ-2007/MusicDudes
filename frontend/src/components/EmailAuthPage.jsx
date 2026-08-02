import React, { useState } from 'react';
import { FaMusic, FaEnvelope, FaUser, FaArrowRight } from 'react-icons/fa';

export default function EmailAuthPage({ onSignIn, loading, error }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    const username = displayName.trim() || email.split('@')[0];
    onSignIn({ email: email.trim(), username });
  };

  return (
    <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="landing-card" style={{ maxWidth: '420px', width: '100%', padding: '36px 28px', background: '#121212', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #1db954, #1ed760)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(29,185,84,0.4)' }}>
            <FaMusic size={26} color="#000" />
          </div>
        </div>

        <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px', tracking: '-0.5px' }}>
          Welcome to MusicDudes
        </h1>
        <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '28px', lineHeight: '1.4' }}>
          Sign in with your email to start listening and creating custom playlists.
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 77, 77, 0.15)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              Display Name (Optional)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaUser style={{ position: 'absolute', left: '14px', color: '#777', fontSize: '14px' }} />
              <input
                type="text"
                placeholder="e.g. Music Fan"
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
            disabled={loading || !email.includes('@')}
            style={{
              marginTop: '12px',
              padding: '14px',
              background: '#1db954',
              border: 'none',
              borderRadius: '50px',
              color: '#000',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: loading || !email.includes('@') ? 'not-allowed' : 'pointer',
              opacity: loading || !email.includes('@') ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Signing in...' : <>Continue to MusicDudes <FaArrowRight size={14} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
