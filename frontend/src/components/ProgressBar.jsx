import React from 'react';

export default function ProgressBar({ currentTime, duration, onSeek }) {
  const safeDuration = duration || 1;
  const percent = Math.max(0, Math.min(100, (currentTime / safeDuration) * 100));

  return (
    <div className="progress-wrap">
      <span className="progress-time">{formatTime(currentTime)}</span>
      <div className="progress-bar-container">
        <input
          className="range progress-range"
          type="range"
          min="0"
          max={safeDuration}
          step="0.1"
          value={Math.min(currentTime, safeDuration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          style={{ '--progress-percent': `${percent}%` }}
        />
      </div>
      <span className="progress-time">{formatTime(duration)}</span>
    </div>
  );
}

function formatTime(value) {
  const safe = Number.isFinite(value) ? value : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}