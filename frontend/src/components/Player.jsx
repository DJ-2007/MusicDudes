import React from 'react';
import { FaPlay, FaPause, FaForward, FaBackward, FaRandom, FaRedo } from 'react-icons/fa';
import ProgressBar from './ProgressBar';

/**
 * Extract just the song name from a YouTube-style title.
 * YouTube titles often look like: "Song Name | Movie | Artist1, Artist2, ..."
 * or "Song Name - Artist (Official Video)"
 * This grabs just the first segment before | or -
 */
function extractSongName(title) {
  if (!title) return 'Unknown Track';
  // Split by common separators: |, -, –, —
  const cleaned = title.split(/\s*[|–—]\s*/)[0].trim();
  // Also handle " - " as a secondary separator
  const dashSplit = cleaned.split(/\s+-\s+/)[0].trim();
  return dashSplit || cleaned || title;
}

export default function Player({
  song,
  isPlaying,
  currentTime,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  isShuffle,
  isRepeat,
}) {
  if (!song) {
    return (
      <section className="player-panel card">
        <div className="empty-state">
          <div className="empty-state-badge">Ready</div>
          <h2>No song is playing</h2>
          <p>Add a track URL or YouTube link to the queue to start the session.</p>
        </div>
      </section>
    );
  }

  const songName = extractSongName(song.title);

  return (
    <section className="player-panel card fade-in">
      <div className="player-cover-wrap">
        <div className="player-cover-overlay" />
        <img className="player-cover" src={song.thumbnail} alt={songName} />
      </div>

      <div className="player-info">
        <p className="eyebrow">Now Playing</p>
        <h2 className="player-song-title" title={song.title}>{songName}</h2>
        <p className="player-artist">{song.artist}</p>
      </div>

      <div className="player-controls">
        <button 
          type="button" 
          className={`control-mini spotify-button ${isShuffle ? 'active-green' : ''}`} 
          onClick={onToggleShuffle}
          style={isShuffle ? { color: '#1db954' } : {}}
          aria-label="Shuffle"
        >
          <FaRandom />
        </button>
        <button type="button" className="control-mini spotify-button" onClick={onPrevious} aria-label="Previous song">
          <FaBackward />
        </button>
        <button type="button" className="control-main spotify-button" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button type="button" className="control-mini spotify-button" onClick={onNext} aria-label="Next song">
          <FaForward />
        </button>
        <button 
          type="button" 
          className={`control-mini spotify-button ${isRepeat ? 'active-green' : ''}`} 
          onClick={onToggleRepeat}
          style={isRepeat ? { color: '#1db954' } : {}}
          aria-label="Repeat"
        >
          <FaRedo />
        </button>
      </div>

      <ProgressBar currentTime={currentTime} duration={song.duration} onSeek={onSeek} />
    </section>
  );
}