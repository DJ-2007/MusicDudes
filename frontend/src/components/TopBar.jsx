import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaHome,
  FaSearch,
  FaHeart,
  FaRegHeart,
  FaPlay,
  FaPlus,
  FaTimes,
  FaHistory,
  FaFolder,
  FaChevronLeft,
  FaChevronRight,
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
  usersCount,
  onAddSong,
  onToggleLike,
  onAddToPlaylist,
  playlists = [],
  onHomeClick,
  username,
  onRequestCreateRoom,
}) {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProvider, setSearchProvider] = useState('youtube');
  const [searchHistory, setSearchHistory] = useState(() => loadHistory(roomId));
  const [showHistory, setShowHistory] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setSearchHistory(loadHistory(roomId));
  }, [roomId]);
  const [playlistPopover, setPlaylistPopover] = useState({ open: false, track: null });
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const popoverRef = useRef(null);

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
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

  // Global Ctrl+L / Cmd+L shortcut to focus search
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
          setSearchProvider(data.provider || 'youtube');
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

  // Handlers
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    onAddSong(searchValue.trim(), '__queue_only__');
    setSearchValue('');
    setSearchResults([]);
    setShowHistory(false);
    setIsSearchFocused(false);
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

  const renderTrackRow = (track, isHistoryItem = false) => {
    const liked = isSongLiked(track);
    return (
      <div
        key={track.videoId || `${track.title}-${track.artist}`}
        className="tb-search-item"
        onClick={() => handlePlayTrack(track)}
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

  return (
    <header className="spotify-topbar">
      {/* Left: Home + Navigation */}
      <div className="topbar-left">
        <button className="topbar-home-btn" onClick={onHomeClick} title="Home">
          <FaHome size={20} />
        </button>
        <div className="topbar-navigation-chevrons">
          <button className="chevron-btn" disabled title="Go back">
            <FaChevronLeft size={13} />
          </button>
          <button className="chevron-btn" disabled title="Go forward">
            <FaChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="topbar-center" ref={searchContainerRef}>
        <form onSubmit={handleSubmit} className="topbar-search-form">
          <div className={`topbar-search-wrap ${isSearchFocused ? 'focused' : ''}`}>
            <FaSearch className="topbar-search-icon" size={16} />
            <input
              ref={searchInputRef}
              className="topbar-search-input"
              value={searchValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
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
            <div className="topbar-search-divider"></div>
            <button type="button" className="topbar-browse-btn" title="Browse">
              <FaFolder size={15} />
            </button>
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
                {searchHistory.map(track => renderTrackRow(track, true))}
              </>
            )}
            {searchResults.length > 0 && (
              <>
                <div className="tb-dropdown-header">
                  <span>Search results</span>
                </div>
                {searchResults.map(track => renderTrackRow(track, false))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Room info & Actions */}
      <div className="topbar-right">
        {onRequestCreateRoom && (
          <button
            className="topbar-create-room-btn"
            onClick={onRequestCreateRoom}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: '#fff',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: '8px',
              transition: 'background 0.2s ease',
            }}
            title="Create or Join a Room"
          >
            <FaPlus size={10} /> Create Room
          </button>
        )}
        <div className="room-name-badge">
          <span className="room-status-indicator online"></span>
          {roomId || 'Room'}
        </div>
        <span className="room-user-count">{usersCount} listener{usersCount !== 1 ? 's' : ''}</span>
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
