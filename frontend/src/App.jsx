import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Playlist from './components/Playlist';
import NowPlayingPanel from './components/NowPlayingPanel';
import BottomPlayer from './components/BottomPlayer';
import MobileNav from './components/MobileNav';
import ConfirmDialog from './components/ConfirmDialog';
import './components/styles/App.css';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocalhost ? `${window.location.protocol}//${window.location.hostname}:4000` : 'https://musicdudes.onrender.com');
const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? `${window.location.protocol}//${window.location.hostname}:4000` : 'https://musicdudes.onrender.com');

const defaultState = {
  roomId: '',
  currentSong: null,
  queue: [],
  playlist: [],
  playlists: [],
  activePlaylistName: 'Liked Songs',
  users: [],
  isPlaying: false,
  currentTime: 0,
};

let socketSingleton;

function getSocket() {
  if (!socketSingleton) {
    socketSingleton = io(SOCKET_URL, { autoConnect: false, transports: ['websocket', 'polling'] });
  }
  return socketSingleton;
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState(defaultState);
  const [username, setUsername] = useState('John');
  const [volume, setVolume] = useState(0.72);
  const [showQueue, setShowQueue] = useState(true);
  const [toast, setToast] = useState('');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [autoplayToast, setAutoplayToast] = useState(null);
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const roomRef = useRef('');
  const progressTickRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const mainContentRef = useRef(null);
  const currentSongIdRef = useRef(null);

  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirm = ({ title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const resolvePlaybackSource = (song) => {
    if (!song) return '';
    const source = song.playbackUrl || `/audio/${song.videoId}`;
    try {
      return new URL(source, API_URL).toString();
    } catch (error) {
      return `${API_URL}/audio/${song.videoId}`;
    }
  };

  const requestAudioPlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong) return;
    const source = resolvePlaybackSource(state.currentSong);
    if (audio.src !== source) {
      audio.src = source;
      audio.load();
    }
    audio.volume = volume;
    try {
      await audio.play();
      audioUnlockedRef.current = true;
      setAudioBlocked(false);
    } catch {
      audioUnlockedRef.current = false;
      setAudioBlocked(true);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => {
      setConnected(false);
      setToast('Connection lost. Reconnecting automatically...');
    };
    const handleRoomState = (roomState) => {
      setState(roomState);
      roomRef.current = roomState.roomId || roomRef.current;
      setJoined(true);
      setLoading(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room-state', handleRoomState);
    socket.connect();
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room-state', handleRoomState);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync audio source when the song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    if (!state.currentSong) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      currentSongIdRef.current = null;
      return undefined;
    }
    const songId = state.currentSong.id;
    const songChanged = currentSongIdRef.current !== songId;
    if (songChanged) {
      currentSongIdRef.current = songId;
      const source = resolvePlaybackSource(state.currentSong);
      audio.src = source;
      audio.load();
      if (state.currentTime > 0) {
        const seekOnLoad = () => {
          try { audio.currentTime = state.currentTime; } catch {}
          audio.removeEventListener('loadedmetadata', seekOnLoad);
        };
        audio.addEventListener('loadedmetadata', seekOnLoad);
      }
    }
    audio.volume = volume;
    if (state.isPlaying) {
      audio.play().catch(() => {
        audioUnlockedRef.current = false;
        setAudioBlocked(true);
      });
    } else {
      audio.pause();
    }
    return undefined;
  }, [state.currentSong?.id, state.isPlaying, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onAudioError = () => {
      const mediaError = audio.error;
      console.error('Audio playback error:', mediaError);
      
      // Network error or format error (often happens when YouTube URL expires mid-stream)
      if (mediaError?.code === 2 || mediaError?.code === 4) {
        const retryCount = parseInt(audio.dataset.retryCount || '0', 10);
        if (retryCount < 3) {
          audio.dataset.retryCount = (retryCount + 1).toString();
          setToast('Reconnecting audio stream...');
          const currentState = stateRef.current;
          if (currentState.currentSong) {
            const source = resolvePlaybackSource(currentState.currentSong);
            const retryUrl = source + (source.includes('?') ? '&' : '?') + 'retry=' + Date.now();
            audio.src = retryUrl;
            audio.load();
            // Restore time
            const seekOnLoad = () => {
              try { audio.currentTime = currentState.currentTime; } catch {}
              audio.removeEventListener('loadedmetadata', seekOnLoad);
            };
            audio.addEventListener('loadedmetadata', seekOnLoad);
            if (currentState.isPlaying) {
              audio.play().catch(() => setAudioBlocked(true));
            }
          }
          return;
        }
      } 
      
      const message = mediaError?.code === 4
        ? 'The audio source could not be loaded. Check the song URL or backend stream.'
        : 'Audio playback failed.';
      setAudioBlocked(true);
      setToast(message);
    };
    audio.addEventListener('error', onAudioError);
    return () => audio.removeEventListener('error', onAudioError);
  }, []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onTimeUpdate = () => {
      const currentState = stateRef.current;
      if (!currentState.currentSong || !roomRef.current || !socketRef.current) return;
      const diff = Math.abs((audio.currentTime || 0) - (currentState.currentTime || 0));
      if (currentState.isPlaying && diff > 1.5) {
        socketRef.current.emit('sync-time', { roomId: roomRef.current, currentTime: audio.currentTime });
      }
    };
    const onEnded = () => {
      if (roomRef.current && socketRef.current) {
        socketRef.current.emit('next-song', { roomId: roomRef.current });
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    if (!state.currentSong) return undefined;
    progressTickRef.current = window.setInterval(() => {
      const audio = audioRef.current;
      setState((current) => {
        if (!current.isPlaying || !current.currentSong) return current;
        
        // Fix silent playback bug: Only advance the progress bar if the audio element is actually playing and buffering
        // readyState 3 = HAVE_FUTURE_DATA, readyState 4 = HAVE_ENOUGH_DATA
        if (audio && (audio.paused || audio.readyState < 3)) {
          return current;
        }

        const nextTime = Math.min(current.currentSong.duration, current.currentTime + 0.9);
        return { ...current, currentTime: nextTime };
      });
    }, 900);
    return () => {
      if (progressTickRef.current) window.clearInterval(progressTickRef.current);
    };
  }, [state.currentSong]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.code === 'Space' && joined) { event.preventDefault(); handleTogglePlay(); }
      if (event.code === 'ArrowRight' && joined) handleNext();
      if (event.code === 'ArrowLeft' && joined) handlePrevious();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [joined, state]);

  // Periodically refresh room state from DB
  useEffect(() => {
    if (!joined || !roomRef.current || !socketRef.current) return undefined;
    const interval = setInterval(() => {
      socketRef.current?.emit('refresh-room', { roomId: roomRef.current });
    }, 30000);
    return () => clearInterval(interval);
  }, [joined]);

  // --- Join / Create handlers ---
  const handleJoin = async ({ roomName, password, username: enteredUsername }) => {
    if (!roomName || !password || !enteredUsername) { setError('Room name, password, and username are all required.'); return; }
    setError(''); setLoading(true); setUsername(enteredUsername);
    try {
      const response = await fetch(`${API_URL}/room/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, password, username: enteredUsername }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to join room');
      setState(payload.state); setJoined(true); setLoading(false);
      roomRef.current = payload.roomId;
      socketRef.current?.emit('join-room', { roomId: payload.roomId, username: enteredUsername });
      socketRef.current?.emit('get-room-state', { roomId: payload.roomId });
      setToast(`Joined "${payload.roomId}" 🎵`);
    } catch (joinError) {
      setError(joinError.message || 'Unable to join room.'); setLoading(false);
    }
  };

  const handleCreate = async ({ roomName, password, username: enteredUsername }) => {
    if (!roomName || !password || !enteredUsername) { setError('Room name, password, and username are all required.'); return; }
    setError(''); setLoading(true); setUsername(enteredUsername);
    try {
      const response = await fetch(`${API_URL}/room/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, password, username: enteredUsername }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to create room');
      setState(payload.state); setJoined(true); setLoading(false);
      roomRef.current = payload.roomId;
      socketRef.current?.emit('join-room', { roomId: payload.roomId, username: enteredUsername });
      socketRef.current?.emit('get-room-state', { roomId: payload.roomId });
      setToast(`Room "${payload.roomId}" created! 🎉`);
    } catch (createError) {
      setError(createError.message || 'Unable to create room.'); setLoading(false);
    }
  };

  const scrollToPlaylist = () => {
    setShowQueue(false);
    requestAnimationFrame(() => { mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); });
  };

  const scrollToTop = () => {
    setShowQueue(false);
    emitIfReady('select-playlist', { playlistName: 'Home' });
    requestAnimationFrame(() => { mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); });
  };

  const emitIfReady = (event, payload) => {
    if (!roomRef.current || !socketRef.current) return;
    socketRef.current.emit(event, { roomId: roomRef.current, ...payload });
  };

  const handleTogglePlay = () => {
    if (!state.currentSong) return;
    const audio = audioRef.current;
    const currentAudioTime = audio ? audio.currentTime : state.currentTime;
    if (!state.isPlaying) { requestAudioPlayback(); } else if (audio) { audio.pause(); }
    emitIfReady('toggle-play', { isPlaying: !state.isPlaying, currentTime: currentAudioTime });
  };

  const handleNext = () => emitIfReady('next-song', {});
  const handlePrevious = () => emitIfReady('previous-song', {});
  const handleToggleShuffle = () => emitIfReady('toggle-shuffle', {});
  const handleToggleRepeat = () => emitIfReady('toggle-repeat', {});

  const handleSeek = (time) => {
    if (!state.currentSong) return;
    setState((current) => ({ ...current, currentTime: time }));
    emitIfReady('sync-time', { currentTime: time });
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleEnableAudio = () => requestAudioPlayback();

  const handleAddSong = (input, playlistName) => {
    if (!input) return;
    if (typeof input === 'object' && input.videoId) {
      const playNow = playlistName === '__queue_only__';
      emitIfReady('add-song', { song: input, username, playlistName, playNow });
      const msg = playlistName && playlistName !== '__queue_only__'
        ? `"${input.title}" added & saved to "${playlistName}"! 🎶`
        : `Now playing: "${input.title}" 🎶`;
      if (playlistName && playlistName !== '__queue_only__') setToast(msg);
      return;
    }
    const isYouTubeLink = /youtu(?:\.be|be\.com)/i.test(input) || /^[A-Za-z0-9_-]{11}$/.test(input);
    const isDirectUrl = (() => { try { const p = new URL(input); return p.protocol === 'http:' || p.protocol === 'https:'; } catch { return false; } })();
    if (!isYouTubeLink && !isDirectUrl) { setToast('Enter a valid YouTube link, video ID, or direct audio URL.'); return; }
    const playNow = playlistName === '__queue_only__';
    emitIfReady('add-song', { input, username, playlistName, playNow });
  };

  const handleCreatePlaylist = (playlistName) => emitIfReady('create-playlist', { playlistName });

  const handleSelectPlaylist = (playlistName) => {
    setShowQueue(false);
    emitIfReady('select-playlist', { playlistName });
  };

  const handleDeletePlaylist = (playlistName) => {
    showConfirm({
      title: 'Delete Playlist', message: 'Are you sure?', confirmText: 'Delete', type: 'warning',
      onConfirm: () => {
        setState((current) => ({
          ...current,
          playlists: current.playlists.filter(p => (typeof p === 'string' ? p : p.name) !== playlistName),
          activePlaylistName: current.activePlaylistName === playlistName ? 'Liked Songs' : current.activePlaylistName,
        }));
        emitIfReady('delete-playlist', { playlistName });
        setToast(`Playlist "${playlistName}" deleted.`);
      },
    });
  };

  const handleRemoveSong = (songId) => {
    showConfirm({
      title: 'Remove Song', message: 'Are you sure?', confirmText: 'Remove', type: 'warning',
      onConfirm: () => {
        setState((current) => {
          const newPlaylist = current.playlist.filter((s) => s.id !== songId);
          const newQueue = current.queue.filter((s) => s.id !== songId);
          const isCurrent = current.currentSong?.id === songId;
          const shouldStop = isCurrent || (newPlaylist.length === 0 && newQueue.length === 0);
          return {
            ...current, playlist: newPlaylist, queue: newQueue,
            currentSong: shouldStop ? (newQueue[0] || null) : current.currentSong,
            isPlaying: shouldStop ? Boolean(newQueue[0]) : current.isPlaying,
            currentTime: shouldStop ? 0 : current.currentTime,
          };
        });
        emitIfReady('remove-from-playlist', { songId });
        setToast('Song removed from playlist.');
      }
    });
  };

  const handlePlayFromPlaylist = (song) => {
    emitIfReady('play-from-playlist', { songId: song.id, playNow: true });
  };

  const handlePlayFromQueue = (song) => {
    emitIfReady('play-from-queue', { songId: song.id });
  };

  const handleToggleLike = (song) => {
    if (!song) return;
    emitIfReady('toggle-like-song', { song, username });
    setState((current) => {
      let newPlaylists = Array.isArray(current.playlists)
        ? current.playlists.map(p => typeof p === 'string' ? { name: p, songs: [] } : { name: p.name, songs: [...(p.songs || [])] })
        : [];
      let likedPlaylist = newPlaylists.find(p => p.name === 'Liked Songs');
      if (!likedPlaylist) {
        likedPlaylist = { name: 'Liked Songs', songs: [] };
        newPlaylists.push(likedPlaylist);
      }
      const targetId = song.videoId || song.id;
      const index = likedPlaylist.songs.findIndex(s => (s.videoId && targetId && s.videoId === targetId) || s.id === targetId);
      let isAdded = false;
      if (index > -1) {
        likedPlaylist.songs.splice(index, 1);
        isAdded = false;
      } else {
        likedPlaylist.songs.push({
          ...song,
          id: song.id || `${song.videoId || Date.now()}-${Date.now()}`,
          videoId: song.videoId || song.id,
          requestedBy: song.requestedBy || username || 'Guest',
        });
        isAdded = true;
      }
      const newPlaylist = current.activePlaylistName === 'Liked Songs' ? likedPlaylist.songs : current.playlist;
      setToast(isAdded ? 'Added to Liked Songs ❤️' : 'Removed from Liked Songs');
      return { ...current, playlists: newPlaylists, playlist: newPlaylist };
    });
  };

  const handleAddToPlaylist = (song, playlistName) => {
    if (!song || !playlistName) return;
    emitIfReady('add-song-to-playlist', { song, playlistName });
    setState((current) => {
      let newPlaylists = Array.isArray(current.playlists)
        ? current.playlists.map(p => typeof p === 'string' ? { name: p, songs: [] } : { name: p.name, songs: [...(p.songs || [])] })
        : [];
      let targetPlaylist = newPlaylists.find(p => p.name === playlistName);
      if (!targetPlaylist) {
        targetPlaylist = { name: playlistName, songs: [] };
        newPlaylists.push(targetPlaylist);
      }
      const targetId = song.videoId || song.id;
      if (!targetPlaylist.songs.some(s => (s.videoId && targetId && s.videoId === targetId) || s.id === targetId)) {
        targetPlaylist.songs.push({
          ...song,
          id: song.id || `${song.videoId || Date.now()}-${Date.now()}`,
          videoId: song.videoId || song.id,
          requestedBy: song.requestedBy || username || 'Guest',
        });
      }
      const newPlaylist = current.activePlaylistName === playlistName ? targetPlaylist.songs : current.playlist;
      return { ...current, playlists: newPlaylists, playlist: newPlaylist };
    });
    setToast(`Added to "${playlistName}" 🎵`);
  };

  const currentSong = state.currentSong;

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <ConfirmDialog {...confirmConfig} />
      {toast ? <div className="toast toast-info">{toast}</div> : null}

      {!joined ? (
        <div className="app-shell">
          <LandingPage onJoin={handleJoin} onCreate={handleCreate} loading={loading} error={error} />
        </div>
      ) : (
        <div className={`spotify-app-layout mobile-active-${activeMobileTab}`}>
          {/* Global Top Bar with Search */}
          <TopBar
            roomId={state.roomId}
            usersCount={state.users.length}
            onAddSong={handleAddSong}
            onToggleLike={handleToggleLike}
            onAddToPlaylist={handleAddToPlaylist}
            playlists={state.playlists}
            onHomeClick={scrollToTop}
            username={username}
          />

          {/* Three-column content grid */}
          <div className="spotify-main-grid">
            {/* Left: Sidebar with playlists */}
            <Sidebar
              onHomeClick={scrollToTop}
              onLibraryClick={scrollToPlaylist}
              playlists={state.playlists}
              activePlaylistName={state.activePlaylistName}
              onSelectPlaylist={handleSelectPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onCreatePlaylist={handleCreatePlaylist}
            />

            {/* Center: Playlist / Queue */}
            <main className="spotify-main-content" ref={mainContentRef}>
              <Playlist
                queue={state.queue}
                playlist={state.playlist}
                playlists={state.playlists}
                activePlaylistName={state.activePlaylistName}
                currentSong={currentSong}
                isPlaying={state.isPlaying}
                onTogglePlay={handleTogglePlay}
                onRemoveSong={handleRemoveSong}
                onPlayFromPlaylist={handlePlayFromPlaylist}
                onPlayFromQueue={handlePlayFromQueue}
                onToggleLike={handleToggleLike}
                onAddToPlaylist={handleAddToPlaylist}
                onSelectPlaylist={handleSelectPlaylist}
                showQueue={showQueue}
                roomId={state.roomId}
                usersCount={state.users.length}
              />
            </main>

            {/* Right: Now Playing artwork panel */}
            <div className="spotify-right-sidebar desktop-right-sidebar">
              <NowPlayingPanel
                song={currentSong}
                playlists={state.playlists}
                onToggleLike={handleToggleLike}
                onAddToPlaylist={handleAddToPlaylist}
              />
            </div>
          </div>

          {/* Bottom Player */}
          <BottomPlayer
            song={currentSong}
            playlists={state.playlists}
            isPlaying={state.isPlaying}
            isShuffle={state.isShuffle}
            isRepeat={state.isRepeat}
            currentTime={state.currentTime}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onToggleShuffle={handleToggleShuffle}
            onToggleRepeat={handleToggleRepeat}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={setVolume}
            onEnableAudio={handleEnableAudio}
            audioBlocked={audioBlocked && state.isPlaying && Boolean(currentSong)}
            showQueue={showQueue}
            onToggleQueue={() => setShowQueue(!showQueue)}
            activePlaylistName={state.activePlaylistName}
            onToggleLike={handleToggleLike}
          />

          <MobileNav
            activeTab={activeMobileTab}
            onHomeClick={scrollToTop}
            onSearchClick={() => setActiveMobileTab('search')}
            onLibraryClick={scrollToPlaylist}
          />


        </div>
      )}
    </>
  );
}