import React, { useState } from 'react';
import { FaTimes, FaPlus, FaSignInAlt, FaLock, FaUsers } from 'react-icons/fa';

export default function RoomModal({ isOpen, onClose, onCreateRoom, onJoinRoom, currentRoomId }) {
  const [tab, setTab] = useState('create');
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    if (tab === 'create') {
      onCreateRoom({ roomName: roomName.trim(), password });
    } else {
      onJoinRoom({ roomName: roomName.trim(), password });
    }
    setRoomName('');
    setPassword('');
    onClose();
  };

  return (
    <div className="cp-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%', padding: '24px' }}>
        <div className="cp-modal-header" style={{ marginBottom: '16px' }}>
          <div className="cp-modal-icon" style={{ width: '40px', height: '40px', background: '#1db954', color: '#000' }}>
            <FaUsers size={18} />
          </div>
          <div>
            <h2 className="cp-modal-title" style={{ fontSize: '1.1rem' }}>Rooms & Listening Groups</h2>
            <p className="cp-modal-subtitle">Current Room: <strong style={{ color: '#1db954' }}>{currentRoomId || 'Main'}</strong></p>
          </div>
          <button className="cp-modal-close" onClick={onClose} title="Close">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#242424', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setTab('create')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'create' ? '#1db954' : 'transparent',
              color: tab === 'create' ? '#000' : '#b3b3b3',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FaPlus size={12} /> Create Room
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'join' ? '#1db954' : 'transparent',
              color: tab === 'join' ? '#000' : '#b3b3b3',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FaSignInAlt size={12} /> Join Room
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Room Name / ID *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={tab === 'create' ? 'e.g. Chill-Vibes' : 'Enter existing room name'}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="cp-input"
              style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Room Password (Optional)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaLock style={{ position: 'absolute', left: '12px', color: '#777', fontSize: '12px' }} />
              <input
                type="password"
                placeholder="Optional password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cp-input"
                style={{ width: '100%', padding: '10px 12px 10px 34px', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="cp-btn-cancel" onClick={onClose} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="cp-btn-create" disabled={!roomName.trim()} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              {tab === 'create' ? 'Create & Switch' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
