import React from 'react';
import { FaClock, FaTrash, FaPlay, FaPause, FaMusic, FaHeart, FaUser } from 'react-icons/fa';

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
  showQueue,
  roomId = 'Room',
  usersCount = 1,
}) {
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

  const formatTime = (value) => {
    const safe = Number.isFinite(value) ? value : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = Math.floor(safe % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  if (showQueue) {
    // RENDER QUEUE VIEW
    return (
      <div className="spotify-main-panel fade-in">
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
                <p>Queue is empty. Add songs using the search bar on the right to build up your session!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER HOME VIEW
  if (activePlaylistName === 'Home') {
    let allPlaylists = Array.isArray(playlists)
      ? playlists.map(p => typeof p === 'string' ? { name: p, songs: [] } : { name: p.name, songs: p.songs || [] })
      : [];
      
    if (!allPlaylists.find(p => p.name === 'Liked Songs')) {
      allPlaylists = [{ name: 'Liked Songs', songs: [] }, ...allPlaylists];
    }

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <div className="spotify-main-panel fade-in" style={{ padding: '24px 32px' }}>
        <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px' }}>
          {greeting}
        </h1>
        
        <div className="home-playlists-grid">
          {allPlaylists.map((p) => {
            const firstSong = p.songs && p.songs.length > 0 ? p.songs[0] : null;
            const isLiked = p.name === 'Liked Songs';
            return (
              <div 
                key={p.name} 
                className="home-playlist-card"
                onClick={() => onSelectPlaylist && onSelectPlaylist(p.name)}
              >
                <div className="home-playlist-card-img">
                  {isLiked ? (
                     <div style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <FaHeart size={24} color="#fff" />
                     </div>
                  ) : firstSong ? (
                    <img src={firstSong.thumbnail} alt={p.name} />
                  ) : (
                    <FaMusic size={24} color="#b3b3b3" />
                  )}
                </div>
                <div className="home-playlist-card-title">{p.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RENDER PLAYLIST VIEW (default page)
  const headerCover = playlist.length > 0 ? playlist[0].thumbnail : null;
  const isLikedSongs = activePlaylistName === 'Liked Songs';

  return (
    <div className="spotify-main-panel fade-in">
      {/* Spotify Playlist Banner */}
      <div className={`playlist-header-banner ${isLikedSongs ? 'liked-songs-banner' : ''}`}>
        <div className="playlist-cover-art">
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
        </div>
        <div className="playlist-header-meta">
          <span className="playlist-badge">PLAYLIST</span>
          <h1 className="playlist-title-main">{activePlaylistName}</h1>
          <div className="playlist-creator-row">
            <span className="creator-name">🎵 {roomId}</span>
            <span className="bullet-separator">•</span>
            <span className="creator-details">{playlist.length} song{playlist.length !== 1 ? 's' : ''}, about {formatTotalTime(totalDuration)}</span>
          </div>
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
              <div className="col-added-by">Requested By</div>
              <div className="col-duration"><FaClock /></div>
              <div className="col-actions"></div>
            </div>

            <div className="track-table-divider"></div>

            {/* Table Body */}
            {playlist.map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                index={index + 1}
                isPlayingSong={currentSong?.id === song.id}
                isCurrentlyActive={currentSong?.id === song.id}
                onSelect={onPlayFromPlaylist}
                onRemove={onRemoveSong}
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
              />
            ))}
          </div>
        ) : (
          <div className="empty-playlist-state">
            <FaMusic style={{ fontSize: '3rem', color: '#1db954', marginBottom: '16px' }} />
            <h2>Add some music to start the party!</h2>
            <p>Use the "Add a Song" panel on the right sidebar to search and save your favorite tracks to this playlist.</p>
          </div>
        )}
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

  const handleRowClick = () => {
    if (isCurrentlyActive && onTogglePlay) {
      onTogglePlay();
    } else if (onSelect) {
      onSelect(song);
    }
  };

  return (
    <div 
      className={`track-row ${isPlayingSong ? 'active-song' : ''}`}
      onDoubleClick={handleRowClick}
      onClick={() => { if (window.innerWidth <= 768) handleRowClick() }}
    >
      {/* Index Column / Play Button Hover state */}
      <div className="col-index">
        <span className="row-number-text">{index}</span>
        <button 
          className="row-play-btn" 
          onClick={handleRowClick}
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