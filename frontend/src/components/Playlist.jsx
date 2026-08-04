import React, { useState } from 'react';
import { FaClock, FaTrash, FaPlay, FaPause, FaMusic, FaHeart, FaUser, FaEdit, FaChevronLeft, FaCheckCircle, FaEllipsisV } from 'react-icons/fa';
import { POPULAR_START_LISTENING, POPULAR_PLAYLISTS } from '../data/popularPlaylists';

export default function Playlist({
  queue = [],
  playlist = [],
  playlists = [],
  activePlaylistName = 'Liked Songs',
  currentSong,
  isPlaying,
  onTogglePlay,
  onRemoveSong,
  onPlayFromPlaylist,
  onPlayFromQueue,
  onSelectPlaylist,
  onUpdatePlaylistCover,
  showQueue,
  roomId = 'Room',
  usersCount = 1,
  onBackToLibrary,
  recentlyPlayed = [],
  onAddSong,
  onToggleLike
}) {
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  // Calculate total playlist duration
  const totalDuration = (playlist || []).reduce((acc, song) => acc + (song.duration || 0), 0);
  const totalQueueDuration = (queue || []).reduce((acc, song) => acc + (song.duration || 0), 0) + (currentSong?.duration || 0);

  const formatTotalTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  const currentPlaylistObj = (playlists || []).find(p => (typeof p === 'string' ? p : p.name) === activePlaylistName);
  const customCover = typeof currentPlaylistObj === 'object' ? currentPlaylistObj?.cover : null;

  const handleSaveCover = (e) => {
    e.preventDefault();
    if (coverUrl.trim() && onUpdatePlaylistCover) {
      onUpdatePlaylistCover(activePlaylistName, coverUrl.trim());
    }
    setShowCoverInput(false);
    setCoverUrl('');
  };

  if (showQueue) {
    // RENDER QUEUE VIEW
    return (
      <div className="spotify-main-panel fade-in">
        {/* Mobile Navigation Back Button */}
        {onBackToLibrary && (
          <button 
            type="button"
            className="mobile-playlist-back-btn" 
            onClick={onBackToLibrary}
            style={{ display: 'none', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#1db954', fontWeight: 700, fontSize: '0.9rem', padding: '12px 16px', cursor: 'pointer' }}
          >
            <FaChevronLeft size={14} /> Your Library
          </button>
        )}

        <div className="queue-header-section">
          <h1 className="queue-title-main">Play Queue</h1>
        </div>

        <div className="queue-content">
          {/* Now Playing section */}
          <div className="queue-section">
            <h2 className="queue-section-title">Now playing</h2>
            {currentSong ? (
              <div className="spotify-track-table">
                <SongRow
                  song={currentSong}
                  index={1}
                  isPlayingSong={true}
                  isCurrentlyActive={true}
                  onSelect={onPlayFromPlaylist}
                  onRemove={onRemoveSong}
                  isPlaying={isPlaying}
                  onTogglePlay={onTogglePlay}
                />
              </div>
            ) : (
              <div className="empty-queue-state">No track is currently playing.</div>
            )}
          </div>

          {/* Next Up section */}
          <div className="queue-section" style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <h2 className="queue-section-title" style={{ margin: 0 }}>Next in queue</h2>
              {queue.length > 0 && (
                <span className="queue-meta-text">{queue.length} track{queue.length !== 1 ? 's' : ''} • {formatTotalTime(totalQueueDuration - (currentSong?.duration || 0))}</span>
              )}
            </div>

            {queue.length > 0 ? (
              <div className="spotify-track-table">
                {queue.map((song, index) => (
                  <SongRow
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index + 2}
                    isPlayingSong={currentSong?.id === song.id}
                    onSelect={onPlayFromQueue || onPlayFromPlaylist}
                    onRemove={onRemoveSong}
                    isPlaying={isPlaying}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-queue-state">
                <FaMusic style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }} />
                <p>Queue is empty. Search for songs to add to your session!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER PLAYLIST VIEW (Liked Songs or Custom Playlists)
  const headerCover = customCover || (playlist.length > 0 ? playlist[0].thumbnail : null);
  const isLikedSongs = activePlaylistName === 'Liked Songs';

  return (
    <div className="spotify-main-panel fade-in">
      {/* Mobile Back Button matching Screenshot 3 */}
      {onBackToLibrary && (
        <button 
          type="button"
          className="mobile-playlist-back-btn" 
          onClick={onBackToLibrary}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#1db954', fontWeight: 700, fontSize: '0.95rem', padding: '12px 16px 4px 16px', cursor: 'pointer' }}
        >
          <FaChevronLeft size={14} /> Back to Library
        </button>
      )}

      {/* Spotify Playlist Banner */}
      <div className={`playlist-header-banner ${isLikedSongs ? 'liked-songs-banner' : ''}`}>
        <div className="playlist-cover-art" style={{ position: 'relative', cursor: !isLikedSongs ? 'pointer' : 'default' }} onClick={() => !isLikedSongs && setShowCoverInput(!showCoverInput)}>
          {isLikedSongs ? (
            /* Styled Liked Songs poster */
            <div className="liked-songs-cover">
              <div className="liked-songs-cover-notes">
                <span className="lsc-note lsc-note-1">♪</span>
                <span className="lsc-note lsc-note-2">♫</span>
                <span className="lsc-note lsc-note-3">♩</span>
                <span className="lsc-note lsc-note-4">♬</span>
              </div>
              <FaHeart className="liked-songs-cover-heart" />
            </div>
          ) : headerCover ? (
            <img src={headerCover} alt={activePlaylistName} />
          ) : (
            <div className="fallback-playlist-art">
              <FaMusic size={48} />
            </div>
          )}

          {!isLikedSongs && (
            <div className="cover-edit-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
              <FaEdit size={22} style={{ marginBottom: '4px' }} />
              Choose Photo
            </div>
          )}
        </div>

        <div className="playlist-header-meta">
          <span className="playlist-badge">PLAYLIST</span>
          <h1 className="playlist-title-main">{activePlaylistName}</h1>
          <div className="playlist-creator-row">
            <span className="creator-details">{playlist.length} song{playlist.length !== 1 ? 's' : ''}, about {formatTotalTime(totalDuration)}</span>
          </div>

          {!isLikedSongs && showCoverInput && (
            <form onSubmit={handleSaveCover} style={{ marginTop: '12px', display: 'flex', gap: '8px', maxWidth: '400px' }}>
              <input
                type="url"
                required
                placeholder="Enter image URL (https://...)"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#1db954',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Save Photo
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Playlist Controls bar */}
      <div className="playlist-action-bar">
        <button 
          className="playlist-play-button"
          onClick={() => {
            if (playlist.length === 0) return;
            const isPlayingThisPlaylist = playlist.some(s => s.id === currentSong?.id || s.videoId === currentSong?.videoId);
            if (isPlayingThisPlaylist) {
              onTogglePlay && onTogglePlay();
            } else {
              onPlayFromPlaylist && onPlayFromPlaylist(playlist[0]);
            }
          }}
          title={isPlaying && playlist.some(s => s.id === currentSong?.id || s.videoId === currentSong?.videoId) ? 'Pause' : 'Play'}
          disabled={playlist.length === 0}
        >
          {isPlaying && playlist.some(s => s.id === currentSong?.id || s.videoId === currentSong?.videoId) ? <FaPause size={20} /> : <FaPlay size={20} style={{ marginLeft: '4px' }} />}
        </button>
        {activePlaylistName === 'Liked Songs' && (
          <FaHeart size={28} style={{ color: '#1db954', cursor: 'pointer' }} />
        )}
      </div>

      {/* Tracklist Table */}
      <div className="spotify-track-table-container">
        {playlist.length > 0 ? (
          <div className="spotify-track-table">
            {/* Table Header */}
            <div className="track-table-header">
              <div className="col-index">#</div>
              <div className="col-title">Title</div>
              <div className="col-added-by">Added By</div>
              <div className="col-duration"><FaClock /></div>
              <div className="col-actions"></div>
            </div>

            <div className="track-table-divider"></div>

            {/* Table Body */}
            {playlist.map((song, index) => (
              <SongRow
                key={song.id || index}
                song={song}
                index={index + 1}
                isPlayingSong={currentSong?.id === song.id || currentSong?.videoId === song.videoId}
                isCurrentlyActive={currentSong?.id === song.id || currentSong?.videoId === song.videoId}
                onSelect={onPlayFromPlaylist}
                onRemove={onRemoveSong}
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
              />
            ))}
          </div>
        ) : (
          <div className="empty-playlist-state" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <FaMusic style={{ fontSize: '2.5rem', color: '#1db954', marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Your "{activePlaylistName}" is waiting for songs!</h2>
            <p style={{ color: '#a7a7a7', fontSize: '0.9rem', maxWidth: '400px', margin: '8px auto 24px auto' }}>Search for your favorite tracks in the search bar or pick from the popular suggestions below.</p>
          </div>
        )}

        {/* 🌟 SPOTIFY SCREENSHOT 1: "Start listening - Jump into a session based on your tastes" */}
        <div className="spotify-start-listening-section" style={{ marginTop: '36px', padding: '0 8px 36px 8px' }}>
          
          {/* Featured Advertisement / Trending Banner matching Screenshot 1 */}
          <div 
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(60, 60, 60, 0.6) 0%, rgba(20, 20, 20, 0.95) 100%)',
              padding: '20px',
              marginBottom: '28px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <span style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
              Trending Now
            </span>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>Hit Songs English & Global Top 50</h2>
              <p style={{ color: '#b3b3b3', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Ariana Grande, Elton John, Dua Lipa, The Weeknd</p>
            </div>
            <button
              onClick={() => onSelectPlaylist && onSelectPlaylist('Hit Songs English')}
              style={{
                alignSelf: 'flex-end',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 22px',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
            >
              Listen now
            </button>
          </div>

          {/* Recently Played / Played Regularly Section matching User Request 3 */}
          {recentlyPlayed.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>Recently & Regularly Played</h2>
              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '12px' }} className="hide-scrollbar">
                {recentlyPlayed.map((song, i) => (
                  <div
                    key={`${song.id}-${i}`}
                    onClick={() => onPlayFromPlaylist && onPlayFromPlaylist(song)}
                    style={{
                      width: '130px',
                      minWidth: '130px',
                      background: '#181818',
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <img src={song.thumbnail} alt={song.title} style={{ width: '110px', height: '110px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ marginTop: '8px', color: '#fff', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div style={{ color: '#a7a7a7', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jump into a session based on your tastes matching Screenshot 1 */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ color: '#a7a7a7', fontSize: '0.85rem', fontWeight: 600 }}>Jump into a session based on your tastes</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '2px 0 16px 0' }}>Start listening</h2>
          </div>

          {/* 3-Row List matching Screenshot 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {POPULAR_START_LISTENING.map((item) => (
              <div
                key={item.id}
                onClick={() => onPlayFromPlaylist && onPlayFromPlaylist(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 12px',
                  background: '#181818',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <img src={item.thumbnail} alt={item.title} style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                  <div style={{ color: '#a7a7a7', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.artist}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b3b3b3' }}>
                  {item.liked && <FaCheckCircle size={18} color="#1ed760" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSong && onAddSong(item, activePlaylistName);
                    }}
                    style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px' }}
                    title="Options"
                  >
                    <FaEllipsisV size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

function SongRow({ 
  song, 
  index, 
  isPlayingSong, 
  isCurrentlyActive = false,
  onSelect, 
  onRemove, 
  isPlaying,
  onTogglePlay 
}) {
  const formatTime = (value) => {
    const safe = Number.isFinite(value) ? value : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = Math.floor(safe % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleRowClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (isCurrentlyActive && onTogglePlay) {
      onTogglePlay();
    } else if (onSelect) {
      onSelect(song);
    }
  };

  return (
    <div 
      className={`track-row ${isPlayingSong ? 'active-song' : ''}`}
      onClick={(e) => handleRowClick(e)}
      style={{ cursor: 'pointer' }}
    >
      {/* Index Column / Play Button */}
      <div className="col-index">
        <span className="row-number-text">{index}</span>
        <button 
          className="row-play-btn" 
          onClick={(e) => handleRowClick(e)}
          aria-label="Play song"
        >
          {isPlayingSong && isPlaying ? <FaPause size={10} /> : <FaPlay size={10} style={{ marginLeft: '1px' }} />}
        </button>
      </div>

      {/* Title Column (Thumbnail + Title + Artist) */}
      <div className="col-title">
        <img className="track-thumbnail" src={song.thumbnail} alt="" />
        <div className="track-details-block">
          <div className="track-name-text" title={song.title}>
            {song.title}
          </div>
          <div className="track-artist-text">
            {song.artist || 'Unknown Artist'}
          </div>
        </div>
      </div>

      {/* Added By Column */}
      <div className="col-added-by">
        {song.requestedBy !== '🤖 Autoplay' && (
          <span className="added-by-username">
            <FaUser size={10} style={{ marginRight: '6px', opacity: 0.6 }} />
            {song.requestedBy || 'Guest'}
          </span>
        )}
      </div>

      {/* Duration Column */}
      <div className="col-duration">
        {formatTime(song.duration)}
      </div>

      {/* Actions (Delete button) */}
      <div className="col-actions">
        {onRemove && (
          <button 
            className="track-delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onRemove(song.id);
            }}
            title="Remove from playlist"
          >
            <FaTrash size={12} />
          </button>
        )}
      </div>
    </div>
  );
}