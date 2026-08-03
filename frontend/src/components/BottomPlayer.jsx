import React from 'react';
import {
  FaPause,
  FaPlay,
  FaStepForward,
  FaStepBackward,
  FaVolumeUp,
  FaVolumeMute,
  FaListUl,
  FaHeart,
  FaRegHeart,
  FaRandom,
  FaRedo
} from 'react-icons/fa';
import ProgressBar from './ProgressBar';

export default function BottomPlayer({
  song,
  playlists = [],
  isPlaying,
  currentTime,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  isShuffle,
  isRepeat,
  onSeek,
  volume,
  onVolumeChange,
  onEnableAudio,
  audioBlocked,
  showQueue,
  onToggleQueue,
  activePlaylistName = 'Liked Songs',
  onToggleLike,
}) {
  const isMuted = volume === 0;

  // Check if current song is liked
  const likedVideoIds = new Set(
    ((playlists || []).find(p => (typeof p === 'string' ? p : p.name) === 'Liked Songs')?.songs || [])
      .map(s => s.videoId || s.id)
  );
  const targetId = song?.videoId || song?.id;
  const isLiked = targetId ? likedVideoIds.has(targetId) : false;

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(0.5);
    } else {
      onVolumeChange(0);
    }
  };

  return (
    <footer className="spotify-bottom-player">
      {/* Left Column: Song Meta Info */}
      <div className="bottom-left-section">
        {song ? (
          <>
            <img
              className="bottom-album-cover"
              src={song.thumbnail}
              alt={song.title}
            />
            <div className="bottom-song-details">
              <div className="bottom-song-title" title={song.title}>
                {song.title}
              </div>
              <div className="bottom-song-artist">
                {song.artist || 'Unknown Artist'}
              </div>
            </div>
            {/* Desktop Like Button */}
            <button
              className={`bottom-like-btn desktop-only-like ${isLiked ? 'liked' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(song); }}
              title={isLiked ? 'Saved' : 'Save to Liked Songs'}
            >
              {isLiked
                ? <svg viewBox="0 0 24 24" width="20" height="20" fill="#1db954"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707 7.707l-5.5 5.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L10.5 13.086l4.793-4.793a1 1 0 011.414 1.414z"></path></svg>
                : <FaRegHeart style={{ color: '#b3b3b3' }} />
              }
            </button>

            {/* Mobile Mini Player Actions (ONLY Like & Play/Pause) */}
            <div className="mobile-pill-actions">
              <button
                className={`bottom-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(song); }}
                title={isLiked ? 'Saved' : 'Save to Liked Songs'}
              >
                {isLiked
                  ? <svg viewBox="0 0 24 24" width="20" height="20" fill="#1db954"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707 7.707l-5.5 5.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L10.5 13.086l4.793-4.793a1 1 0 011.414 1.414z"></path></svg>
                  : <FaRegHeart style={{ color: '#b3b3b3' }} />
                }
              </button>
              <button
                className="mobile-pill-play-btn"
                onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              >
                {isPlaying ? <FaPause size={14} fill="#fff" /> : <FaPlay size={14} fill="#fff" style={{ marginLeft: '2px' }} />}
              </button>
            </div>
          </>
        ) : (
          <div className="bottom-no-song">
            <div className="bottom-song-title">No track playing</div>
            <div className="bottom-song-artist">Choose a song to start listening</div>
          </div>
        )}
        {audioBlocked && (
          <button type="button" className="spotify-unlock-audio-btn" onClick={onEnableAudio}>
            Enable audio
          </button>
        )}
      </div>

      {/* Center Column: Player Controls & Progress Bar */}
      <div className="bottom-center-section">
        <div className="bottom-player-buttons">
          <button
            className={`bottom-control-btn secondary ${isShuffle ? 'active-green' : ''}`}
            onClick={onToggleShuffle}
            title="Shuffle"
            style={isShuffle ? { color: '#1db954' } : {}}
          >
            <FaRandom />
          </button>
          <button
            className="bottom-control-btn btn-prev"
            onClick={onPrevious}
            title="Previous (Backspace)"
          >
            <FaStepBackward />
          </button>
          <button
            className="bottom-play-pause-btn"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            disabled={!song}
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} style={{ marginLeft: '2px' }} />}
          </button>
          <button
            className="bottom-control-btn btn-next"
            onClick={onNext}
            title="Next (Arrow Right)"
          >
            <FaStepForward />
          </button>
          <button 
            className={`bottom-control-btn secondary ${isRepeat ? 'active-green' : ''}`}
            onClick={onToggleRepeat}
            title="Repeat"
            style={isRepeat ? { color: '#1db954' } : {}}
          >
            <FaRedo />
          </button>
        </div>

        {/* Seek Progress Bar */}
        <div className="bottom-seek-bar-wrapper">
          <ProgressBar
            currentTime={currentTime}
            duration={song?.duration || 0}
            onSeek={onSeek}
          />
        </div>
      </div>

      {/* Right Column: Volume & Utilities */}
      <div className="bottom-right-section">
        <button
          className={`bottom-utility-btn ${showQueue ? 'active' : ''}`}
          onClick={onToggleQueue}
          title="Queue"
        >
          <FaListUl />
        </button>

        <div className="bottom-volume-control">
          <button className="bottom-volume-btn" onClick={handleMuteToggle}>
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            className="spotify-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #1db954 ${volume * 100}%, #4d4d4d ${volume * 100}%)`
            }}
          />
        </div>
      </div>
    </footer>
  );
}