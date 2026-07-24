import React, { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaPlus, FaTimes, FaEllipsisH, FaMusic, FaExpandAlt } from 'react-icons/fa';

export default function NowPlayingPanel({
  song,
  playlists = [],
  onToggleLike,
  onAddToPlaylist,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Extract playlist names
  const playlistNames = (playlists || []).map(p => typeof p === 'string' ? p : p.name);

  // Check if current song is liked
  const likedVideoIds = new Set(
    ((playlists || []).find(p => (typeof p === 'string' ? p : p.name) === 'Liked Songs')?.songs || [])
      .map(s => s.videoId || s.id)
  );
  const targetId = song?.videoId || song?.id;
  const isLiked = targetId ? likedVideoIds.has(targetId) : false;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!song) {
    return (
      <div className="now-playing-panel">
        <div className="npp-empty">
          <FaMusic size={48} style={{ color: '#282828', marginBottom: '16px' }} />
          <p className="npp-empty-text">No song is playing</p>
          <p className="npp-empty-sub">Search for a song to start listening</p>
        </div>
      </div>
    );
  }

  return (
    <div className="now-playing-panel">
      {/* Header */}
      <div className="npp-header">
        <span className="npp-header-title">{song.title}</span>
        <div className="npp-header-actions">
          <button
            className="npp-icon-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="More options"
          >
            <FaEllipsisH size={14} />
          </button>
        </div>
      </div>

      {/* Large Album Art */}
      <div className="npp-artwork-container">
        <img
          className="npp-artwork"
          src={song.thumbnail}
          alt={song.title}
        />
      </div>

      {/* Song Info + Actions */}
      <div className="npp-song-info">
        <div className="npp-song-details">
          <h3 className="npp-song-title">{song.title}</h3>
          <p className="npp-song-artist">{song.artist || 'Unknown Artist'}</p>
        </div>
        <div className="npp-song-actions">
          <button
            className={`npp-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => onToggleLike && onToggleLike(song)}
            title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
          </button>
          <button
            className="npp-add-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="Add to playlist"
          >
            <FaPlus size={16} />
          </button>
        </div>
      </div>

      {/* "Add to playlist" dropdown menu */}
      {showMenu && (
        <div className="npp-playlist-menu" ref={menuRef}>
          <div className="npp-menu-header">
            <span>Add to playlist</span>
            <button className="npp-menu-close" onClick={() => setShowMenu(false)}>
              <FaTimes size={11} />
            </button>
          </div>
          <div className="npp-menu-list hide-scrollbar">
            {playlistNames.map(name => (
              <button
                key={name}
                className="npp-menu-item"
                onClick={() => {
                  onAddToPlaylist && onAddToPlaylist(song, name);
                  setShowMenu(false);
                }}
              >
                {name === 'Liked Songs' && <FaHeart size={11} style={{ color: '#1db954', marginRight: '8px', flexShrink: 0 }} />}
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extra metadata */}
      {song.requestedBy && (
        <div className="npp-meta-section">
          <span className="npp-meta-label">Requested by</span>
          <span className="npp-meta-value">{song.requestedBy}</span>
        </div>
      )}
    </div>
  );
}
