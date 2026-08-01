import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaSearch, FaMusic, FaPlus, FaTrash, FaHeart, FaTimes, FaListUl, FaArrowRight } from 'react-icons/fa';

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
              placeholder="My Awesome Playlist"
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
  onHomeClick,
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

  const handleConfirm = (name) => {
    setModalOpen(false);
    onCreatePlaylist && onCreatePlaylist(name);
  };

  return (
    <>
      <aside className="spotify-sidebar">
        {/* Navigation Panel (Hidden on mobile) */}
        <div className="sidebar-section-card nav-section">
          <button
            className={`sidebar-nav-button ${activePlaylistName === 'Home' ? 'active' : ''}`}
            type="button"
            onClick={onHomeClick}
          >
            <FaHome size={20} />
            <span className="sidebar-button-label">Home</span>
          </button>
        </div>

        {/* Library Panel */}
        <div className="sidebar-section-card library-section">
          <div className="library-header">
            <div className="library-title-group" onClick={onLibraryClick}>
              <span className="library-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z"></path></svg>
                Your Library
              </span>
            </div>
            <div className="library-header-actions" style={{ display: 'flex', gap: '16px', color: '#b3b3b3' }}>
              <button className="library-add-btn" onClick={() => setModalOpen(true)} title="Create playlist" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <FaPlus size={16} />
              </button>
              <button title="Show more" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <FaArrowRight size={16} style={{ transform: 'rotate(-45deg)' }} />
              </button>
            </div>
          </div>

          <div className="universal-filter-chips" style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
            <span className="filter-chip active" style={{ background: '#333', color: '#fff', borderRadius: '16px', padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>Playlists</span>
            <span className="filter-chip" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>Podcasts</span>
            <span className="filter-chip" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>Artists</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', color: '#b3b3b3', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              {searchOpen ? (
                <input
                  type="text"
                  placeholder="Search in playlists"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    width: '100%',
                    outline: 'none',
                  }}
                  autoFocus
                />
              ) : (
                <button onClick={() => setSearchOpen(true)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px' }}>
                  <FaSearch size={16} />
                </button>
              )}
            </div>
            {!searchOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                  Recents
                </span>
                <span style={{ cursor: 'pointer' }}>
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zm2.25.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm2.25.75a.75.75 0 0 0 .75-.75h6a.75.75 0 0 0 0 1.5h-6a.75.75 0 0 0-.75-.75zM3.25 7a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm2.25.75a.75.75 0 0 0 .75-.75h6a.75.75 0 0 0 0 1.5h-6a.75.75 0 0 0-.75-.75zM3.25 11.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm2.25.75a.75.75 0 0 0 .75-.75h6a.75.75 0 0 0 0 1.5h-6a.75.75 0 0 0-.75-.75z" />
                  </svg>
                </span>
              </div>
            )}
          </div>

          <div className="library-playlists-list hide-scrollbar">
            {modalOpen && (
              <div className="sidebar-inline-create">
                <div className="cp-modal-header">
                  <div className="cp-modal-icon" style={{ width: '36px', height: '36px' }}>
                    <FaMusic size={14} />
                  </div>
                  <div>
                    <h2 className="cp-modal-title" style={{ fontSize: '0.95rem', margin: '0 0 2px 0' }}>Create Playlist</h2>
                    <p className="cp-modal-subtitle" style={{ fontSize: '0.7rem' }}>Give it a name</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const val = e.target.elements.playlistName.value;
                  if (val.trim()) handleConfirm(val.trim());
                }} className="cp-modal-form" style={{ marginTop: '12px', gap: '12px' }}>
                  <div className="cp-input-wrap">
                    <input
                      autoFocus
                      name="playlistName"
                      className="cp-input"
                      style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                      type="text"
                      placeholder="My Awesome Playlist"
                      maxLength={50}
                      autoComplete="off"
                      spellCheck={false}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setModalOpen(false);
                      }}
                    />
                  </div>
                  <div className="cp-modal-actions" style={{ gap: '8px' }}>
                    <button type="button" className="cp-btn-cancel" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="cp-btn-create" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                      <FaPlus size={10} style={{ marginRight: '4px' }} /> Create
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Default/Liked Songs Playlist first */}
            <div
              className={`library-playlist-item mobile-playlist-row ${activePlaylistName === 'Liked Songs' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer', borderRadius: '6px' }}
              onClick={() => onSelectPlaylist && onSelectPlaylist('Liked Songs')}
            >
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  minWidth: '48px', 
                  maxWidth: '48px', 
                  minHeight: '48px',
                  maxHeight: '48px',
                  borderRadius: '4px', 
                  flexShrink: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #450af5 0%, #8e8ee5 50%, #c4efd9 100%)'
                }}
              >
                <FaHeart size={18} fill="#fff" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Liked Songs</span>
                <span style={{ color: '#a7a7a7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#1ed760', fontSize: '0.75rem' }}>📌</span> Playlist • DJ
                </span>
              </div>
            </div>

            {/* User Playlists */}
            {playlists
              .map(p => typeof p === 'string' ? p : p.name)
              .filter(name => name !== 'Liked Songs')
              .filter(name => name.toLowerCase().includes(filterText.toLowerCase()))
              .map(name => (
                <div
                  key={name}
                  className={`library-playlist-item mobile-playlist-row ${activePlaylistName === name ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer', borderRadius: '6px' }}
                  onClick={() => onSelectPlaylist && onSelectPlaylist(name)}
                >
                  <div 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      minWidth: '48px', 
                      maxWidth: '48px', 
                      minHeight: '48px',
                      maxHeight: '48px',
                      borderRadius: '4px', 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#282828'
                    }}
                  >
                    <FaMusic size={18} fill="#b3b3b3" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                    <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                    <span style={{ color: '#a7a7a7', fontSize: '0.8rem' }}>
                      Playlist • DJ
                    </span>
                  </div>
                  <button
                    type="button"
                    className="playlist-delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist && onDeletePlaylist(name);
                    }}
                    title={`Delete ${name}`}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </aside>
    </>
  );
}