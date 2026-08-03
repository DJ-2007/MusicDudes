import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaMusic, FaPlus, FaTrash, FaHeart, FaTimes } from 'react-icons/fa';

function CreatePlaylistModal({ isOpen, onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
      setName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="cp-modal-overlay" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cp-modal-header">
          <div className="cp-modal-icon">
            <FaMusic size={18} />
          </div>
          <div>
            <h2 className="cp-modal-title">Create Playlist</h2>
            <p className="cp-modal-subtitle">Give your new playlist a name</p>
          </div>
          <button className="cp-modal-close" onClick={onCancel} title="Close">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="cp-modal-form">
          <div className="cp-input-wrap">
            <input
              ref={inputRef}
              id="playlist-name-input"
              className="cp-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Playlist"
              maxLength={50}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="cp-char-count">{name.length}/50</span>
          </div>

          <div className="cp-modal-actions">
            <button type="button" className="cp-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="cp-btn-create" disabled={!name.trim()}>
              <FaPlus size={12} />
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Sidebar({
  onLibraryClick,
  playlists = [],
  activePlaylistName = 'Liked Songs',
  onSelectPlaylist,
  onDeletePlaylist,
  onCreatePlaylist,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleConfirm = (name) => {
    setModalOpen(false);
    setNewPlaylistName('');
    if (name && name.trim()) {
      onCreatePlaylist && onCreatePlaylist(name.trim());
    }
  };

  return (
    <>
      <aside className="spotify-sidebar">
        {/* Clean Spotify Library Section */}
        <div className="sidebar-section-card library-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="library-header mobile-library-header" style={{ padding: '16px 20px 12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="library-title-group" onClick={onLibraryClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <FaMusic size={22} color="#1db954" />
              <span className="library-label" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                Your Library
              </span>
            </div>
            <div className="library-header-actions" style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#b3b3b3' }}>
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                title="Search library" 
                style={{ background: 'none', border: 'none', color: searchOpen ? '#1db954' : 'inherit', cursor: 'pointer', padding: '4px' }}
              >
                <FaSearch size={18} />
              </button>
              <button 
                className="library-add-btn" 
                onClick={() => setModalOpen(true)} 
                title="Create playlist" 
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
              >
                <FaPlus size={18} />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div style={{ padding: '0 16px 12px 16px' }}>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter playlists..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#242424',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Playlist items container */}
          <div className="library-playlists-list hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
            {modalOpen && (
              <div className="sidebar-inline-create" style={{ margin: '8px 8px 16px 8px', padding: '12px', background: '#242424', borderRadius: '8px' }}>
                <div className="cp-modal-header" style={{ marginBottom: '8px' }}>
                  <div className="cp-modal-icon" style={{ width: '32px', height: '32px', background: '#1db954', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaMusic size={14} />
                  </div>
                  <div>
                    <h2 className="cp-modal-title" style={{ fontSize: '0.9rem', margin: 0, color: '#fff' }}>Create Playlist</h2>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newPlaylistName.trim()) handleConfirm(newPlaylistName.trim());
                }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    autoFocus
                    className="cp-input"
                    style={{ padding: '8px 10px', fontSize: '0.85rem', background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Playlist"
                    maxLength={50}
                    autoComplete="off"
                    spellCheck={false}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setModalOpen(false);
                        setNewPlaylistName('');
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button type="button" className="cp-btn-cancel" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => { setModalOpen(false); setNewPlaylistName(''); }}>
                      Cancel
                    </button>
                    <button type="submit" className="cp-btn-create" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#1db954', color: '#000', border: 'none', borderRadius: '20px', fontWeight: '700' }} disabled={!newPlaylistName.trim()}>
                      Create
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Liked Songs Playlist */}
            <div
              className={`library-playlist-item mobile-playlist-row ${activePlaylistName === 'Liked Songs' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s ease' }}
              onClick={() => onSelectPlaylist && onSelectPlaylist('Liked Songs')}
            >
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  minWidth: '48px', 
                  borderRadius: '6px', 
                  flexShrink: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #450af5 0%, #8e8ee5 50%, #c4efd9 100%)'
                }}
              >
                <FaHeart size={20} fill="#fff" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Liked Songs</span>
                <span style={{ color: '#a7a7a7', fontSize: '0.8rem' }}>
                  Playlist • Favorite Tracks
                </span>
              </div>
            </div>

            {/* Custom User Playlists */}
            {playlists
              .map(p => typeof p === 'string' ? { name: p, cover: null } : { name: p.name, cover: p.cover || null })
              .filter(p => p.name !== 'Liked Songs')
              .filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()))
              .map(p => (
                <div
                  key={p.name}
                  className={`library-playlist-item mobile-playlist-row ${activePlaylistName === p.name ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s ease' }}
                  onClick={() => onSelectPlaylist && onSelectPlaylist(p.name)}
                >
                  <div 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      minWidth: '48px', 
                      borderRadius: '6px', 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: p.cover ? `url(${p.cover}) center/cover` : '#282828'
                    }}
                  >
                    {!p.cover && <FaMusic size={18} fill="#b3b3b3" />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                    <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span style={{ color: '#a7a7a7', fontSize: '0.8rem' }}>
                      Playlist
                    </span>
                  </div>
                  <button
                    type="button"
                    className="playlist-delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist && onDeletePlaylist(p.name);
                    }}
                    title={`Delete ${p.name}`}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={modalOpen}
        onConfirm={handleConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}