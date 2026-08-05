import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaSearch,
  FaHeart,
  FaRegHeart,
  FaPlay,
  FaPlus,
  FaTimes,
  FaHistory,
  FaFolder,
  FaCog,
  FaSignOutAlt,
  FaSignOutAlt as FaDoorOpen,
  FaUser,
  FaUsers
} from 'react-icons/fa';

const HISTORY_KEY = 'mwd_search_history';
const MAX_HISTORY = 30;

function loadHistory(roomId) {
  if (!roomId) return [];
  const key = `${HISTORY_KEY}_${roomId}`;
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function saveHistory(roomId, items) {
  if (!roomId) return;
  const key = `${HISTORY_KEY}_${roomId}`;
  try { localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_HISTORY))); }
  catch {}
}

export default function TopBar({
  roomId,
  usersCount = 1,
  onAddSong,
  onToggleLike,
  onAddToPlaylist,
  playlists = [],
  username,
  userSession,
  onRequestCreateRoom,
  onExitRoom,
  onOpenSettings,
  onSignOut
}) {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => loadHistory(roomId));
  const [showHistory, setShowHistory] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [playlistPopover, setPlaylistPopover] = useState({ open: false, track: null });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const popoverRef = useRef(null);
  const profileMenuRef = useRef(null);

  const isCapacitor = typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.location.origin.includes('capacitor') || !!window.Capacitor);
  const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !isCapacitor;
  const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? `${window.location.protocol}//${window.location.hostname}:4000` : 'https://musicdudes.onrender.com');

  const playlistNames = (playlists || []).map(p => typeof p === 'string' ? p : p.name);

  const likedVideoIds = new Set(
    ((playlists || []).find(p => (typeof p === 'string' ? p : p.name) === 'Liked Songs')?.songs || [])
      .map(s => s.videoId || s.id)
  );

  const isSongLiked = useCallback((track) => {
    if (!track) return false;
    const targetId = track.videoId || track.id;
    return targetId ? likedVideoIds.has(targetId) : false;
  }, [likedVideoIds]);

  useEffect(() => {
    setSearchHistory(loadHistory(roomId));
  }, [roomId]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults, showHistory, searchValue]);

  // Global Ctrl+L / Cmd+L shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
        setShowHistory(false);
        setIsSearchFocused(false);
      }
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPlaylistPopover({ open: false, track: null });
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = searchValue.trim();
    if (!trimmed || trimmed.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setShowHistory(false);

    const isDirectLink = /youtu(?:\.be|be\.com)/i.test(trimmed) ||
      /^[A-Za-z0-9_-]{11}$/.test(trimmed) ||
      trimmed.startsWith('http:') || trimmed.startsWith('https:');
    if (isDirectLink) { setSearchResults([]); setIsSearching(false); return; }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.tracks || []);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchValue]);

  // History helpers
  const addToHistory = (track) => {
    const updated = [track, ...searchHistory.filter(h => h.videoId !== track.videoId)].slice(0, MAX_HISTORY);
    setSearchHistory(updated);
    saveHistory(roomId, updated);
  };
  const removeFromHistory = (videoId) => {
    const updated = searchHistory.filter(h => h.videoId !== videoId);
    setSearchHistory(updated);
    saveHistory(roomId, updated);
  };
  const clearHistory = () => { setSearchHistory([]); saveHistory(roomId, []); };

  // Handlers — INSTANT 1-CLICK PLAYBACK
  const handlePlayTrack = (track) => {
    onAddSong(track, '__queue_only__');
    addToHistory(track);
    setSearchValue('');
    setSearchResults([]);
    setShowHistory(false);
    setIsSearchFocused(false);
  };

  const handleLikeTrack = (track, e) => {
    e.stopPropagation();
    if (onToggleLike) onToggleLike(track);
  };

  const handleAddToPlaylistClick = (track, e) => {
    e.stopPropagation();
    setPlaylistPopover({ open: true, track });
  };

  const handlePlaylistSelect = (playlistName) => {
    if (playlistPopover.track && onAddToPlaylist) {
      onAddToPlaylist(playlistPopover.track, playlistName);
    }
    setPlaylistPopover({ open: false, track: null });
  };

  const getActiveItems = () => {
    if (searchResults.length > 0) return searchResults;
    if (showHistory && searchHistory.length > 0) return searchHistory;
    return [];
  };

  const handleInputKeyDown = (e) => {
    const activeItems = getActiveItems();
    if (activeItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < activeItems.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : activeItems.length - 1));
        return;
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < activeItems.length) {
        e.preventDefault();
        handlePlayTrack(activeItems[selectedIndex]);
        return;
      }
    }
    if (e.key === 'Escape') {
      setSearchResults([]);
      setShowHistory(false);
      setSelectedIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const activeItems = getActiveItems();
    if (selectedIndex >= 0 && selectedIndex < activeItems.length) {
      handlePlayTrack(activeItems[selectedIndex]);
      return;
    }
    if (!searchValue.trim()) return;
    onAddSong(searchValue.trim(), '__queue_only__');
    setSearchValue('');
    setSearchResults([]);
    setShowHistory(false);
    setIsSearchFocused(false);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsSearchFocused(true);
    if (!searchValue.trim() && searchResults.length === 0 && searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
    if (!e.target.value.trim()) {
      setShowHistory(searchHistory.length > 0);
    } else {
      setShowHistory(false);
    }
  };

  const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const isPersonalRoom = !roomId || roomId.startsWith('user_');

  const renderTrackRow = (track, itemIndex, isHistoryItem = false) => {
    const liked = isSongLiked(track);
    const isSelected = itemIndex === selectedIndex;
    return (
      <div
        key={track.videoId || `${track.title}-${track.artist}`}
        className={`tb-search-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handlePlayTrack(track)}
        style={{ cursor: 'pointer' }}
      >
        <img src={track.thumbnail} alt="" className="tb-search-thumb" />
        <div className="tb-search-meta">
          <span className="tb-search-title">{track.title}</span>
          <span className="tb-search-artist">
            <span className="tb-type-badge">Song</span> • {track.artist}
          </span>
        </div>
        <div className="tb-search-actions">
          <button
            className={`tb-action-btn ${liked ? 'liked' : ''}`}
            onClick={(e) => handleLikeTrack(track, e)}
            title={liked ? 'Unlike' : 'Like'}
          >
            {liked ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
          </button>
          <button
            className="tb-action-btn"
            onClick={(e) => handleAddToPlaylistClick(track, e)}
            title="Add to playlist"
          >
            <FaPlus size={12} />
          </button>
          <button
            className="tb-action-btn tb-play-action"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayTrack(track);
            }}
            title="Play"
          >
            <FaPlay size={10} style={{ marginLeft: '1px' }} />
          </button>
          {isHistoryItem && (
            <button
              className="tb-action-btn tb-remove-action"
              onClick={(e) => {
                e.stopPropagation();
                removeFromHistory(track.videoId);
              }}
              title="Remove from history"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>
        <span className="tb-search-duration">{formatDuration(track.duration)}</span>
      </div>
    );
  };

  const initialLetter = (username || userSession?.username || userSession?.email || 'U')[0].toUpperCase();

  return (
    <header className="spotify-topbar" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '12px 24px' }}>
      
      {/* Left: Branding / Logo */}
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '800' }}>
            MD
          </div>
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
            MusicDudes
          </span>
        </div>
      </div>

      {/* Center: Centered Search Bar */}
      <div className="topbar-center" ref={searchContainerRef} style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="topbar-search-form">
          <div className={`topbar-search-wrap ${isSearchFocused ? 'focused' : ''}`}>
            <FaSearch className="topbar-search-icon" size={16} />
            <input
              ref={searchInputRef}
              className="topbar-search-input"
              value={searchValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder="What do you want to play?"
              spellCheck={false}
            />
            {searchValue ? (
              <button
                type="button"
                className="topbar-search-clear"
                onClick={() => {
                  setSearchValue('');
                  setSearchResults([]);
                  setShowHistory(false);
                  setSelectedIndex(-1);
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                <FaTimes size={13} />
              </button>
            ) : (
              <div className="topbar-search-shortcut" title="Press Ctrl+L to search">
                <kbd className="key-badge">Ctrl</kbd>
                <kbd className="key-badge">L</kbd>
              </div>
            )}
          </div>
        </form>

        {/* Search results dropdown */}
        {(searchResults.length > 0 || (showHistory && searchHistory.length > 0)) && (
          <div className="topbar-search-dropdown hide-scrollbar">
            {showHistory && searchResults.length === 0 && !isSearching && searchHistory.length > 0 && (
              <>
                <div className="tb-dropdown-header">
                  <span><FaHistory size={12} style={{ marginRight: '8px', opacity: 0.7 }} />Recent searches</span>
                  <button className="tb-clear-btn" onClick={clearHistory} type="button">Clear all</button>
                </div>
                {searchHistory.map((track, idx) => renderTrackRow(track, idx, true))}
              </>
            )}
            {searchResults.length > 0 && (
              <>
                <div className="tb-dropdown-header">
                  <span>Search results</span>
                </div>
                {searchResults.map((track, idx) => renderTrackRow(track, idx, false))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Room Actions & Profile / Settings Menu */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Shared Room Display & Exit Room button */}
        {!isPersonalRoom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(29,185,84,0.12)', border: '1px solid rgba(29,185,84,0.3)', padding: '4px 12px', borderRadius: '20px' }}>
            <span className="room-status-indicator online"></span>
            <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: '700' }}>Room: {roomId}</span>
            <span style={{ color: '#b3b3b3', fontSize: '0.78rem' }}>({usersCount} <FaUsers size={11} style={{ display: 'inline', marginLeft: '2px' }} />)</span>
            
            <button
              onClick={onExitRoom}
              style={{
                background: 'rgba(255, 77, 77, 0.2)',
                border: 'none',
                color: '#ff4d4d',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                marginLeft: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Exit Room"
            >
              Exit Room
            </button>
          </div>
        )}

        {/* Create/Join Room button */}
        {onRequestCreateRoom && (
          <button
            className="topbar-create-room-btn"
            onClick={onRequestCreateRoom}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            title="Create or Join Room"
          >
            <FaPlus size={10} /> Create Room
          </button>
        )}

        {/* User Profile Avatar & Dropdown Menu */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1db954, #1ed760)',
              color: '#000',
              fontWeight: '800',
              fontSize: '0.95rem',
              border: '2px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease'
            }}
            title="Account & Settings"
          >
            {initialLetter}
          </button>

          {profileMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '210px',
                background: '#181818',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {username || userSession?.username || 'User'}
                </div>
                {!isPersonalRoom && (
                  <div style={{ color: '#1db954', fontSize: '0.75rem', marginTop: '2px' }}>In Room: {roomId}</div>
                )}
              </div>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#282828'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <FaCog size={14} color="#b3b3b3" /> Settings
              </button>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onSignOut) onSignOut();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4d4d',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <FaSignOutAlt size={14} color="#ff4d4d" /> Sign Out
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Playlist popover */}
      {playlistPopover.open && (
        <div className="playlist-popover-overlay" onClick={() => setPlaylistPopover({ open: false, track: null })}>
          <div className="playlist-popover" ref={popoverRef} onClick={e => e.stopPropagation()}>
            <div className="popover-header">
              <span>Add to playlist</span>
              <button className="popover-close-btn" onClick={() => setPlaylistPopover({ open: false, track: null })}>
                <FaTimes size={12} />
              </button>
            </div>
            <div className="popover-list hide-scrollbar">
              {playlistNames.map(name => (
                <button key={name} className="popover-playlist-btn" onClick={() => handlePlaylistSelect(name)}>
                  {name === 'Liked Songs' ? <FaHeart size={12} style={{ color: '#1db954', marginRight: '8px' }} /> : null}
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
