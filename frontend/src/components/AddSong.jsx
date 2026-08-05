import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaFolderPlus, FaListUl, FaChevronDown, FaSearch, FaFileImport, FaHeart, FaRegHeart, FaPlay, FaTimes, FaHistory, FaTrash } from 'react-icons/fa';

const HISTORY_KEY = 'mwd_search_history';
const MAX_HISTORY = 30;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {}
}

export default function AddSong({
  onAddSong,
  disabled,
  playlists = [],
  activePlaylistName = 'Liked Songs',
  onToggleLike,
  onAddToPlaylist,
  username,
}) {
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'
  const [value, setValue] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Search states
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProvider, setSearchProvider] = useState('youtube');
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Search history
  const [searchHistory, setSearchHistory] = useState(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  // Bulk import states
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  // "Add to playlist" popover state
  const [playlistPopover, setPlaylistPopover] = useState({ open: false, track: null });
  const popoverRef = useRef(null);

  const isCapacitor = typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.location.origin.includes('capacitor') || !!window.Capacitor);
  const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !isCapacitor;
  const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? `${window.location.protocol}//${window.location.hostname}:4000` : 'https://musicdudes.onrender.com');

  // Extract playlist names
  const playlistNames = (playlists || []).map(p => typeof p === 'string' ? p : p.name);

  // Get liked song videoIds for quick lookup
  const likedVideoIds = new Set(
    ((playlists || []).find(p => (typeof p === 'string' ? p : p.name) === 'Liked Songs')?.songs || [])
      .map(s => s.videoId || s.id)
  );

  const isSongLiked = useCallback((track) => {
    if (!track) return false;
    const targetId = track.videoId || track.id;
    return targetId ? likedVideoIds.has(targetId) : false;
  }, [likedVideoIds]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
        setShowHistory(false);
      }
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPlaylistPopover({ open: false, track: null });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setShowHistory(false);

    const isDirectLink = /youtu(?:\.be|be\.com)/i.test(trimmed) ||
                         /^[A-Za-z0-9_-]{11}$/.test(trimmed) ||
                         trimmed.startsWith('http:') ||
                         trimmed.startsWith('https:');

    if (isDirectLink) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

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

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [value]);

  // --- History helpers ---
  const addToHistory = (track) => {
    const updated = [track, ...searchHistory.filter(h => h.videoId !== track.videoId)].slice(0, MAX_HISTORY);
    setSearchHistory(updated);
    saveHistory(updated);
  };

  const removeFromHistory = (videoId) => {
    const updated = searchHistory.filter(h => h.videoId !== videoId);
    setSearchHistory(updated);
    saveHistory(updated);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    saveHistory([]);
  };

  // --- Handlers ---
  const handlePlayTrack = (track) => {
    // Queue-only: just play, don't add to any playlist
    onAddSong(track, '__queue_only__');
    addToHistory(track);
    setValue('');
    setSearchResults([]);
    setShowHistory(false);
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

  // Submit URL directly (for the text input form submit)
  const submit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onAddSong(value.trim(), '__queue_only__');
    setValue('');
    setSearchResults([]);
    setShowHistory(false);
  };

  const submitBulk = async (event) => {
    event.preventDefault();
    const lines = bulkValue
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    setIsImporting(true);

    let successCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      setImportProgress(`Searching & importing ${i + 1}/${lines.length}...`);

      const isYouTubeLink = /youtu(?:\.be|be\.com)/i.test(line) || /^[A-Za-z0-9_-]{11}$/.test(line);
      const isDirectUrl = (() => {
        try {
          const parsed = new URL(line);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch { return false; }
      })();

      if (isYouTubeLink || isDirectUrl) {
        onAddSong(line, '__queue_only__');
        successCount++;
      } else {
        try {
          const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(line)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.tracks && data.tracks.length > 0) {
              onAddSong(data.tracks[0], '__queue_only__');
              successCount++;
            }
          }
        } catch (err) {
          console.error(`Bulk search failed for line: ${line}`, err);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    setIsImporting(false);
    setBulkValue('');
    setImportProgress('');
  };

  const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults, showHistory, value]);

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
    }
  };

  const handleInputFocus = () => {
    if (!value.trim() && searchResults.length === 0 && searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
    if (!e.target.value.trim()) {
      setShowHistory(searchHistory.length > 0);
    } else {
      setShowHistory(false);
    }
  };

  // --- Render helper for a track row (shared between search results & history) ---
  const renderTrackRow = (track, itemIndex, isHistoryItem = false) => {
    const liked = isSongLiked(track);
    const isSelected = itemIndex === selectedIndex;
    return (
      <div
        key={track.videoId || `${track.title}-${track.artist}`}
        className={`search-result-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handlePlayTrack(track)}
        style={{ cursor: 'pointer' }}
      >
        <img src={track.thumbnail} alt={track.title} className="search-result-thumb" />
        <div className="search-result-meta" style={{ flex: 1 }}>
          <span className="search-result-title">{track.title}</span>
          <span className="search-result-artist">{track.artist}</span>
        </div>
        <div className="search-result-actions">
          {/* Like button */}
          <button
            className={`sr-action-btn ${liked ? 'liked' : ''}`}
            onClick={(e) => handleLikeTrack(track, e)}
            title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          >
            {liked ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
          </button>

          {/* Add to playlist */}
          <button
            className="sr-action-btn"
            onClick={(e) => handleAddToPlaylistClick(track, e)}
            title="Add to playlist"
          >
            <FaPlus size={11} />
          </button>

          {/* Play button */}
          <button
            className="sr-action-btn sr-play-btn"
            onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}
            title="Play now"
          >
            <FaPlay size={10} />
          </button>

          {/* Remove from history */}
          {isHistoryItem && (
            <button
              className="sr-action-btn sr-delete-btn"
              onClick={(e) => { e.stopPropagation(); removeFromHistory(track.videoId); }}
              title="Remove from history"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>
        <div className="search-result-duration">
          {formatDuration(track.duration)}
        </div>
      </div>
    );
  };

  return (
    <section className="add-song card fade-in">
      <div className="add-song-header-tabs">
        <button
          type="button"
          className={`add-song-header-tab-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => !isImporting && setActiveTab('single')}
          disabled={isImporting}
        >
          <FaSearch size={12} style={{ marginRight: '6px' }} />
          Search
        </button>
        <button
          type="button"
          className={`add-song-header-tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => !isImporting && setActiveTab('bulk')}
          disabled={isImporting}
        >
          <FaFileImport size={12} style={{ marginRight: '6px' }} />
          Import
        </button>
      </div>

      {activeTab === 'single' ? (
        <form onSubmit={submit} className="add-song-form" style={{ marginTop: '14px' }}>
          <div className="form-group" ref={searchContainerRef} style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              className="spotify-input"
              value={value}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder="What do you want to play?"
              disabled={disabled}
            />

            {isSearching && (
              <div style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#1db954', fontSize: '0.8rem', display: 'flex', alignItems: 'center',
                gap: '6px', pointerEvents: 'none'
              }}>
                <span className="spinner-mini"></span>
              </div>
            )}

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="search-results-list hide-scrollbar">
                {searchResults.map((track, idx) => renderTrackRow(track, idx, false))}
              </div>
            )}

            {/* Search history dropdown */}
            {showHistory && searchResults.length === 0 && !isSearching && searchHistory.length > 0 && (
              <div className="search-results-list hide-scrollbar">
                <div className="search-history-header">
                  <span><FaHistory size={11} style={{ marginRight: '6px', opacity: 0.6 }} /> Recent searches</span>
                  <button className="clear-history-btn" onClick={clearHistory} type="button">
                    Clear all
                  </button>
                </div>
                {searchHistory.map((track, idx) => renderTrackRow(track, idx, true))}
              </div>
            )}
          </div>
        </form>
      ) : (
        // BULK IMPORT
        <form onSubmit={submitBulk} className="add-song-form" style={{ marginTop: '14px' }}>
          <div className="form-group">
            <textarea
              className="spotify-input hide-scrollbar"
              value={bulkValue}
              onChange={(event) => setBulkValue(event.target.value)}
              placeholder={"Paste song names or YouTube links (one per line)\n\nExample:\nDaft Punk - One More Time\nhttps://youtube.com/watch?...\nColdplay - Yellow"}
              disabled={disabled || isImporting}
              required
              rows={6}
              style={{ resize: 'none', height: '140px', fontFamily: 'inherit', lineHeight: '1.5' }}
            />
          </div>

          {isImporting && (
            <div className="import-progress-status" style={{
              margin: '12px 0 4px', fontSize: '0.8rem', color: '#1db954',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500'
            }}>
              <span className="spinner-mini"></span>
              {importProgress}
            </div>
          )}

          <button
            className="spotify-button add-song-button"
            type="submit"
            disabled={disabled || isImporting}
            style={{
              marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center',
              alignItems: 'center', gap: '8px',
              background: isImporting ? '#333' : '#1db954',
              color: isImporting ? '#727272' : '#000000'
            }}
          >
            <FaFileImport /> {isImporting ? 'Importing...' : 'Import & Play'}
          </button>
        </form>
      )}

      {/* Floating playlist popover */}
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
                <button
                  key={name}
                  className="popover-playlist-btn"
                  onClick={() => handlePlaylistSelect(name)}
                >
                  {name === 'Liked Songs' ? <FaHeart size={12} style={{ color: '#1db954', marginRight: '8px' }} /> : null}
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}