import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Playlist from './components/Playlist';
import NowPlayingPanel from './components/NowPlayingPanel';
import BottomPlayer from './components/BottomPlayer';
import MobileNav from './components/MobileNav';
import MobileNowPlaying from './components/MobileNowPlaying';
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
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const socketRef = useRef(null);
  const roomRef = useRef('');
  const progressTickRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const mainContentRef = useRef(null);
  const currentSongIdRef = useRef(null);

  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [showMobileNowPlaying, setShowMobileNowPlaying] = useState(false);
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
    return song.videoId || '';
  };

  // Initialize YouTube IFrame Player
  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const container = document.getElementById('yt-player-hidden');
      if (!container) return;
      if (ytPlayerRef.current) return;

      ytPlayerRef.current = new window.YT.Player('yt-player-hidden', {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            ytReadyRef.current = true;
            try {
              event.target.unMute();
              event.target.setVolume(volume * 100);
            } catch {}
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              if (roomRef.current && socketRef.current) {
                socketRef.current.emit('next-song', { roomId: roomRef.current });
              }
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              audioUnlockedRef.current = true;
              setAudioBlocked(false);
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            setToast('Audio playback error. Trying next song...');
            setTimeout(() => {
              if (roomRef.current && socketRef.current) {
                socketRef.current.emit('next-song', { roomId: roomRef.current });
              }
            }, 1500);
          }
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, []);

  const requestAudioPlayback = async () => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current || !state.currentSong) return;
    try {
      if (typeof player.unMute === 'function') player.unMute();
      if (typeof player.setVolume === 'function') player.setVolume(volume * 100);
      if (typeof player.playVideo === 'function') player.playVideo();
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
    const handleQueueUpdated = ({ queue }) => {
      setState(prev => ({ ...prev, queue }));
    };
    const handleRoomState = (roomState) => {
      // Smart sync: don't blindly overwrite currentTime if our YT player is close
      const player = ytPlayerRef.current;
      if (player && ytReadyRef.current && roomState.currentSong && roomState.isPlaying) {
        try {
          const ytTime = player.getCurrentTime?.();
          if (typeof ytTime === 'number') {
            const serverTime = roomState.currentTime || 0;
            const diff = Math.abs(ytTime - serverTime);
            // Increase tolerance to 8s so background queue updates don't trigger accidental seeks
            if (diff < 8) {
              // Server time is close to our player — keep local time, don't seek
              roomState = { ...roomState, currentTime: ytTime };
            } else {
              // Large difference — this is a real seek event (e.g. another user dragged the progress bar)
              player.seekTo(serverTime, true);
            }
          }
        } catch {}
      }
      setState(roomState);
      roomRef.current = roomState.roomId || roomRef.current;
      setJoined(true);
      setLoading(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room-state', handleRoomState);
    socket.on('queue-updated', handleQueueUpdated);
    socket.connect();
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room-state', handleRoomState);
      socket.off('queue-updated', handleQueueUpdated);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync audio source when the song changes
  // Sync YouTube player when song changes or play/pause state changes
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!ytReadyRef.current || !player) return undefined;

    if (!state.currentSong) {
      try { player.stopVideo(); } catch {}
      currentSongIdRef.current = null;
      currentVideoIdRef.current = null;
      return undefined;
    }

    const songId = state.currentSong.id;
    const videoId = state.currentSong.videoId;
    const videoChanged = currentVideoIdRef.current !== videoId;

    if (videoChanged) {
      currentVideoIdRef.current = videoId;
      currentSongIdRef.current = songId;
      if (videoId) {
        try {
          if (typeof player.unMute === 'function') player.unMute();
          if (typeof player.setVolume === 'function') player.setVolume(volume * 100);
          player.loadVideoById({ videoId, startSeconds: state.currentTime || 0 });
          if (typeof player.playVideo === 'function') player.playVideo();
        } catch (err) {
          console.error('Error loading video by ID:', err);
        }
      }
    }

    try {
      if (typeof player.setVolume === 'function') player.setVolume(volume * 100);
    } catch {}

    if (state.isPlaying) {
      try {
        const playerState = player.getPlayerState?.();
        // YT.PlayerState.PLAYING = 1, BUFFERING = 3
        if (playerState !== 1 && playerState !== 3) {
          if (typeof player.unMute === 'function') player.unMute();
          if (typeof player.playVideo === 'function') player.playVideo();
        }
      } catch {
        audioUnlockedRef.current = false;
        setAudioBlocked(true);
      }
    } else {
      try { player.pauseVideo(); } catch {}
    }
    return undefined;
  }, [state.currentSong?.id, state.currentSong?.videoId, state.isPlaying, volume]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);



  // Time sync: periodically check YT player time and sync with server
  useEffect(() => {
    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || !ytReadyRef.current) return;
      const currentState = stateRef.current;
      if (!currentState.currentSong || !roomRef.current || !socketRef.current) return;
      
      try {
        const ytTime = player.getCurrentTime?.();
        if (typeof ytTime === 'number' && currentState.isPlaying) {
          const diff = Math.abs(ytTime - (currentState.currentTime || 0));
          if (diff > 1.5) {
            socketRef.current.emit('sync-time', { roomId: roomRef.current, currentTime: ytTime });
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!state.currentSong) return undefined;
    progressTickRef.current = window.setInterval(() => {
      const player = ytPlayerRef.current;
      setState((current) => {
        if (!current.isPlaying || !current.currentSong) return current;
        
        // Use actual YouTube player time if available
        if (player && ytReadyRef.current) {
          try {
            const playerState = player.getPlayerState?.();
            // Only advance if YT player is actually playing (state 1) or buffering (state 3)
            if (playerState !== 1 && playerState !== 3) return current;
            const ytTime = player.getCurrentTime?.();
            if (typeof ytTime === 'number') {
              return { ...current, currentTime: ytTime };
            }
          } catch {}
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
    setActiveMobileTab('library');
    requestAnimationFrame(() => { mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); });
  };

  const scrollToTop = () => {
    setShowQueue(false);
    setActiveMobileTab('home');
    emitIfReady('select-playlist', { playlistName: 'Home' });
    requestAnimationFrame(() => { mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); });
  };

  const emitIfReady = (event, payload) => {
    if (!roomRef.current || !socketRef.current) return;
    socketRef.current.emit(event, { roomId: roomRef.current, ...payload });
  };

  const handleTogglePlay = () => {
    if (!state.currentSong) return;
    
    let currentAudioTime = state.currentTime;
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        const ytTime = ytPlayerRef.current.getCurrentTime?.();
        if (typeof ytTime === 'number') {
          currentAudioTime = ytTime;
        }
      } catch {}
    }

    if (!state.isPlaying) {
      requestAudioPlayback();
    } else {
      try { ytPlayerRef.current?.pauseVideo?.(); } catch {}
    }
    
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
    if (ytPlayerRef.current && ytReadyRef.current) {
      try { ytPlayerRef.current.seekTo(time, true); } catch {}
    }
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
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
      <div id="yt-player-hidden" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none' }} />
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
          <div 
            onClick={(e) => {
              if (window.innerWidth <= 768 && !e.target.closest('button') && !e.target.closest('input')) {
                setShowMobileNowPlaying(true);
              }
            }} 
            className={window.innerWidth <= 768 ? 'mobile-mini-player' : ''}
          >
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
          </div>

          <MobileNav
            activeTab={activeMobileTab}
            onHomeClick={scrollToTop}
            onSearchClick={() => setActiveMobileTab('search')}
            onLibraryClick={scrollToPlaylist}
            onQueueClick={() => setShowQueue(!showQueue)}
          />

          {showMobileNowPlaying && (
            <MobileNowPlaying
              song={currentSong}
              playlists={state.playlists}
              isPlaying={state.isPlaying}
              currentTime={state.currentTime}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onToggleShuffle={handleToggleShuffle}
              onToggleRepeat={handleToggleRepeat}
              isShuffle={state.isShuffle}
              isRepeat={state.isRepeat}
              onSeek={handleSeek}
              onClose={() => setShowMobileNowPlaying(false)}
              onToggleLike={handleToggleLike}
            />
          )}

        </div>
      )}
    </>
  );
}