import React, { useState } from 'react';
import { 
  FaChevronDown, 
  FaPlay, 
  FaPause, 
  FaStepBackward, 
  FaStepForward, 
  FaRandom, 
  FaRedo, 
  FaHeart, 
  FaRegHeart,
  FaEllipsisV
} from 'react-icons/fa';
import ProgressBar from './ProgressBar';

export default function MobileNowPlaying({
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
  onClose,
  onToggleLike
}) {
  const [touchStartY, setTouchStartY] = useState(null);

  if (!song) return null;

  // Check if liked
  const likedVideoIds = new Set(
    ((playlists || []).find(p => (typeof p === 'string' ? p : p.name) === 'Liked Songs')?.songs || [])
      .map(s => s.videoId || s.id)
  );
  const targetId = song.videoId || song.id;
  const isLiked = targetId ? likedVideoIds.has(targetId) : false;

  const handleTouchStart = (e) => setTouchStartY(e.touches[0].clientY);
  const handleTouchMove = (e) => {
    if (!touchStartY) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 80) { // Swipe down threshold
      onClose();
      setTouchStartY(null);
    }
  };

  return (
    <div 
      className="mobile-now-playing-full fade-in"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="mnp-drag-pill" />
      <div className="mnp-header">
        <button className="mnp-icon-btn" onClick={onClose}>
          <FaChevronDown size={20} />
        </button>
        <span className="mnp-header-title">Now Playing</span>
        <div style={{ width: '20px' }} />
      </div>

      <div className="mnp-artwork-container">
        <img src={song.thumbnail} alt={song.title} className="mnp-artwork" />
      </div>

      <div className="mnp-info-controls">
        <div className="mnp-meta-row">
          <div className="mnp-meta">
            <h2 className="mnp-title">{song.title}</h2>
            <p className="mnp-artist">{song.artist || 'Unknown Artist'}</p>
          </div>
          <div className="mnp-actions">
            <button className={`mnp-action-btn ${isLiked ? 'liked' : ''}`} onClick={() => onToggleLike && onToggleLike(song)}>
              {isLiked ? <FaHeart size={24} style={{color: '#1db954'}} /> : <FaRegHeart size={24} />}
            </button>
          </div>
        </div>

        <div className="mnp-progress-wrapper">
          <ProgressBar currentTime={currentTime} duration={song.duration || 0} onSeek={onSeek} />
        </div>

        <div className="mnp-controls">
          <button className={`mnp-control-btn secondary ${isShuffle ? 'active-green' : ''}`} onClick={onToggleShuffle}>
            <FaRandom size={24} />
          </button>
          <button className="mnp-control-btn" onClick={onPrevious}>
            <FaStepBackward size={36} />
          </button>
          <button className="mnp-play-btn" onClick={onTogglePlay}>
            {isPlaying ? <FaPause size={28} /> : <FaPlay size={28} style={{marginLeft: '4px'}} />}
          </button>
          <button className="mnp-control-btn" onClick={onNext}>
            <FaStepForward size={36} />
          </button>
          <button className={`mnp-control-btn secondary ${isRepeat ? 'active-green' : ''}`} onClick={onToggleRepeat}>
            <FaRedo size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
