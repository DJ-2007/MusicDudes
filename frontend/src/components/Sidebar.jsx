import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaSearch, FaMusic, FaPlus, FaTrash, FaHeart, FaTimes, FaListUl } from 'react-icons/fa';

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
        {/* Navigation Panel */}
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

              <span className="library-label">Your Library</span>
            </div>
            <button
              className="library-add-btn"
              onClick={() => setModalOpen(true)}
              title="Create playlist"
            >
              <FaPlus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', color: '#b3b3b3', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                title="Search in playlists"
              >
                <FaSearch size={14} />
              </button>
              {searchOpen && (
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
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    width: '120px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              )}
            </div>
            {!searchOpen && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                Recents <FaListUl size={12} />
              </span>
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
              className={`library-playlist-item ${activePlaylistName === 'Liked Songs' ? 'active' : ''}`}
              onClick={() => onSelectPlaylist && onSelectPlaylist('Liked Songs')}
            >
              <div className="playlist-icon-wrap liked-songs">
                <FaHeart size={14} fill="#fff" />
              </div>
              <div className="playlist-meta">
                <span className="playlist-name">Liked Songs</span>
                <span className="playlist-info">Playlist • Auto-saves</span>
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
                  className={`library-playlist-item ${activePlaylistName === name ? 'active' : ''}`}
                  onClick={() => onSelectPlaylist && onSelectPlaylist(name)}
                >
                  <div className="playlist-icon-wrap regular-playlist">
                    <FaMusic size={14} fill="#b3b3b3" />
                  </div>
                  <div className="playlist-meta">
                    <span className="playlist-name">{name}</span>
                    <span className="playlist-info">Playlist • Room Music</span>
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