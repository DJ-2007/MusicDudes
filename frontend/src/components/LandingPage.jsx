import React, { useState } from 'react';
import { FaMusic, FaArrowRight, FaPlusCircle, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LandingPage({ onJoin, onCreate, loading, error }) {
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event, mode) => {
    event.preventDefault();
    const payload = {
      roomName: roomName.trim(),
      password: password,
      username: username.trim(),
      mode,
    };
    if (mode === 'create') {
      onCreate(payload);
      return;
    }
    onJoin(payload);
  };

  return (
    <div className="landing-page fade-in">
      <div className="landing-blob landing-blob-left" />
      <div className="landing-blob landing-blob-right" />
      <form className="landing-card card" onSubmit={submit}>
        <div className="landing-brand">
          <span className="landing-brand-icon green-pulse">
            <FaMusic />
          </span>
          <div>
            <p className="eyebrow">Real-time listening</p>
            <h1>MusicDudes</h1>
          </div>
        </div>

        <label className="field-label" htmlFor="roomName">Room Name</label>
        <input
          id="roomName"
          className="spotify-input"
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          placeholder="Enter room name"
          autoComplete="off"
        />

        <label className="field-label" htmlFor="password">Room Password</label>
        <div className="password-input-wrap">
          <FaLock className="password-lock-icon" />
          <input
            id="password"
            className="spotify-input password-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter room password"
            autoComplete="off"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <label className="field-label" htmlFor="username">Username</label>
        <input
          id="username"
          className="spotify-input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Your name"
          autoComplete="nickname"
        />

        {error ? <div className="toast toast-error">{error}</div> : null}

        <div className="landing-actions">
          <button className="spotify-button landing-button" type="button" onClick={(event) => submit(event, 'join')} disabled={loading}>
            {loading ? 'Working...' : 'Join Room'}
            <FaArrowRight />
          </button>
          <button className="spotify-button landing-button landing-button-secondary" type="button" onClick={(event) => submit(event, 'create')} disabled={loading}>
            <FaPlusCircle />
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
}