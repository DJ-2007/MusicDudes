import React, { useState } from 'react';
import { FaTimes, FaCog, FaSignOutAlt, FaVolumeUp, FaShieldAlt, FaUser, FaSlidersH } from 'react-icons/fa';

export default function SettingsModal({ isOpen, onClose, userSession, onSignOut, volume, onVolumeChange }) {
  const [audioQuality, setAudioQuality] = useState('high');
  const [autoPlayRecommendations, setAutoPlayRecommendations] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="cp-modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div 
        className="cp-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px', width: '92%', padding: '28px', background: '#181818', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="cp-modal-header" style={{ marginBottom: '20px' }}>
          <div className="cp-modal-icon" style={{ width: '42px', height: '42px', background: '#1db954', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaCog size={20} />
          </div>
          <div>
            <h2 className="cp-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>App Settings</h2>
            <p className="cp-modal-subtitle" style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>Customize your MusicDudes listening experience</p>
          </div>
          <button className="cp-modal-close" onClick={onClose} title="Close">
            <FaTimes size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Account Profile Card */}
          <div style={{ background: '#242424', padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #1db954, #1ed760)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#000', fontSize: '1rem' }}>
                {(userSession?.username || userSession?.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{userSession?.username || 'Music Dude'}</div>
                <div style={{ color: '#b3b3b3', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userSession?.email || userSession?.phone || 'Logged In'}</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              style={{
                background: 'rgba(255, 77, 77, 0.15)',
                border: '1px solid rgba(255, 77, 77, 0.3)',
                color: '#ff4d4d',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <FaSignOutAlt size={12} /> Sign Out
            </button>
          </div>

          {/* Audio & Playback */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaVolumeUp size={14} color="#1db954" /> Audio & Playback
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#242424', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Default Volume</div>
                  <div style={{ color: '#b3b3b3', fontSize: '0.75rem' }}>Set initial playback volume</div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  style={{ width: '100px', accentColor: '#1db954' }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Streaming Audio Quality</div>
                  <div style={{ color: '#b3b3b3', fontSize: '0.75rem' }}>Optimizes audio streaming bandwidth</div>
                </div>
                <select 
                  value={audioQuality} 
                  onChange={(e) => setAudioQuality(e.target.value)}
                  style={{ background: '#181818', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="high">High (320 kbps)</option>
                  <option value="normal">Normal (160 kbps)</option>
                  <option value="data-saver">Data Saver (96 kbps)</option>
                </select>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Autoplay Similar Songs</div>
                  <div style={{ color: '#b3b3b3', fontSize: '0.75rem' }}>Keep music going when queue ends</div>
                </div>
                <input 
                  type="checkbox"
                  checked={autoPlayRecommendations}
                  onChange={(e) => setAutoPlayRecommendations(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#1db954', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div style={{ textAlign: 'center', color: '#777', fontSize: '0.75rem', marginTop: '4px' }}>
            MusicDudes v2.4 • Spotify-Inspired Clean Edition
          </div>
        </div>
      </div>
    </div>
  );
}
