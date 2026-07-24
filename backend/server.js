import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import youtubedl from 'youtube-dl-exec';
import https from 'https';
import bcrypt from 'bcrypt';
import { Room } from './db.js';
import YouTube from 'youtube-sr';
import YTMusic from 'ytmusic-api';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: true }));
app.use(express.json());

const SALT_ROUNDS = 10;

// In-memory cache for quick access (optional, for performance)
const roomCache = new Map();

// ─── PER-ROOM PLAY HISTORY (prevents repeat songs in autoplay) ───────────────
// Maps roomId → Set of recently played videoIds (last 30 songs)
const roomPlayHistory = new Map();

function recordPlayHistory(roomId, videoId) {
  if (!videoId) return;
  if (!roomPlayHistory.has(roomId)) roomPlayHistory.set(roomId, []);
  const history = roomPlayHistory.get(roomId);
  // Remove if already present (move to front)
  const idx = history.indexOf(videoId);
  if (idx !== -1) history.splice(idx, 1);
  history.unshift(videoId);
  // Keep only last 30
  if (history.length > 30) history.pop();
}

function wasRecentlyPlayed(roomId, videoId) {
  if (!videoId) return false;
  const history = roomPlayHistory.get(roomId) || [];
  return history.includes(videoId);
}

// Weighted random: prefer earlier results but allow variety
function weightedPick(candidates) {
  if (candidates.length === 0) return null;
  // Assign weights: index 0 = weight 5, index 1 = 4, etc., min 1
  const weights = candidates.map((_, i) => Math.max(5 - i, 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return candidates[i];
  }
  return candidates[0];
}

// Normalize a raw candidate from any source into a consistent shape
function normalizeCandidate(c) {
  return {
    videoId: c.videoId,
    name: c.name || c.title,
    artist: c.artist,
    duration: c.duration,
    thumbnails: c.thumbnails,
  };
}

// --- Database Functions ---

async function getRoomFromDB(roomId) {
  // Check cache first
  if (roomCache.has(roomId)) {
    const cached = roomCache.get(roomId);
    // Return cached if not stale (within 2 seconds)
    if (Date.now() - cached._cachedAt < 2000) {
      return cached;
    }
  }
  
  // Always fetch fresh from DB when cache is stale or missing
  let room = await Room.findOne({ roomId });
  if (!room) {
    roomCache.delete(roomId); // Clear stale cache entry
    return null; // Don't auto-create rooms — they must be created with a password
  }
  
  // Cache it
  room._cachedAt = Date.now();
  roomCache.set(roomId, room);
  return room;
}

async function saveRoomToDB(room) {
  // Prune any disconnected sockets before saving to DB
  if (room.users) {
    room.users = room.users.filter(user => io.sockets.sockets.has(user.id));
  }
  if (room.hostId && !io.sockets.sockets.has(room.hostId)) {
    room.hostId = room.users[0]?.id || null;
  }
  room.lastUpdatedAt = new Date();
  await room.save();
  room._cachedAt = Date.now();
  roomCache.set(room.roomId, room);
  return room;
}

function serializeRoom(room) {
  // Filter active connections dynamically
  const activeUsers = (room.users || []).filter(user => io.sockets.sockets.has(user.id));
  
  let hostId = room.hostId;
  if (hostId && !io.sockets.sockets.has(hostId)) {
    hostId = activeUsers[0]?.id || null;
  }

  if (!room.playlists || room.playlists.length === 0) {
    room.playlists = [{
      name: 'Liked Songs',
      songs: room.playlist || []
    }];
    room.activePlaylistName = 'Liked Songs';
    // Save to DB asynchronously to persist the migration
    room.save().catch(err => console.error('Failed to auto-migrate room playlists:', err));
  }

  const activePlaylist = room.playlists.find(p => p.name === room.activePlaylistName) || room.playlists[0];

  return {
    roomId: room.roomId,
    currentSong: room.currentSong || null,
    queue: room.queue || [],
    playlist: activePlaylist ? activePlaylist.songs : [],
    playlists: (room.playlists || []).map(p => ({
      name: p.name,
      songs: p.songs || []
    })),
    activePlaylistName: room.activePlaylistName || 'Liked Songs',
    users: activeUsers,
    isPlaying: room.isPlaying || false,
    currentTime: room.currentTime || 0,
    lastUpdatedAt: room.lastUpdatedAt,
    hostId: hostId,
  };
}

function getSyncedTime(room) {
  if (!room.currentSong) return 0;
  const elapsed = (Date.now() - new Date(room.lastUpdatedAt).getTime()) / 1000;
  return Math.min(room.currentSong.duration || 0, Math.max(0, room.currentTime + elapsed));
}

// --- Helper Functions ---

function normalizeVideoId(input) {
  if (!input) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(String(input));
    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      return url.searchParams.get('v');
    }
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1).split('/')[0];
    }
    const pathMatch = url.pathname.match(/\/(?:embed|v|shorts)\/([A-Za-z0-9_-]{11})/);
    if (pathMatch) return pathMatch[1];
  } catch (error) {}
  const match = String(input).match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[&#?]|$)/);
  return match ? match[1] : null;
}

function isHttpUrl(input) {
  try {
    const parsed = new URL(String(input));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function createGenericThumbnail(label) {
  const safeLabel = String(label || 'Track').slice(0, 18);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1db954" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="28" fill="url(#bg)" />
      <circle cx="512" cy="108" r="92" fill="rgba(255,255,255,0.12)" />
      <circle cx="158" cy="256" r="118" fill="rgba(255,255,255,0.08)" />
      <text x="52" y="154" fill="#ffffff" font-family="Arial, sans-serif" font-size="46" font-weight="700">Now Playing</text>
      <text x="52" y="214" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="28">${safeLabel}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function createSongFromInputAsync(input, userName) {
  const videoId = normalizeVideoId(input);
  const directAudioUrl = isHttpUrl(input) && !videoId ? String(input) : null;

  if (directAudioUrl) {
    return {
      id: `direct-${Date.now()}`,
      videoId: null,
      title: `Stream from ${new URL(directAudioUrl).hostname}`,
      duration: 240,
      artist: userName || 'Unknown Artist',
      thumbnail: createGenericThumbnail(new URL(directAudioUrl).hostname),
      requestedBy: userName || 'Guest',
      url: input,
      playbackUrl: `/audio/proxy?url=${encodeURIComponent(directAudioUrl)}`,
    };
  }

  const resolvedId = videoId || 'dQw4w9WgXcQ';

  try {
    const url = `https://www.youtube.com/watch?v=${resolvedId}`;
    const metadata = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });

    const title = metadata.title || `YouTube Track ${resolvedId.slice(0, 6)}`;
    const duration = metadata.duration || 240;
    const channelName = metadata.uploader || metadata.channel || userName || 'Unknown Artist';
    const thumbnail = metadata.thumbnail || `https://img.youtube.com/vi/${resolvedId}/hqdefault.jpg`;

    return {
      id: `${resolvedId}-${Date.now()}`,
      videoId: resolvedId,
      title,
      duration,
      artist: channelName,
      thumbnail,
      requestedBy: userName || 'Guest',
      url: input,
      playbackUrl: `/audio/${resolvedId}`,
    };
  } catch (error) {
    console.error('Failed to fetch video info:', error.message);
  }

  // Fallback
  return {
    id: `${resolvedId}-${Date.now()}`,
    videoId: resolvedId,
    title: `YouTube Track ${resolvedId.slice(0, 6)}`,
    duration: 240,
    artist: userName || 'Unknown Artist',
    thumbnail: `https://img.youtube.com/vi/${resolvedId}/hqdefault.jpg`,
    requestedBy: userName || 'Guest',
    url: input,
    playbackUrl: `/audio/${resolvedId}`,
  };
}

function advanceTrack(room) {
  if (room.currentSong) {
    if (!room.history) room.history = [];
    room.history.push(room.currentSong);
    if (room.history.length > 30) {
      room.history.shift(); // keep it small
    }
  }
  room.currentSong = room.queue.shift() || null;
  room.currentTime = 0;
  room.lastUpdatedAt = Date.now();
  room.isPlaying = Boolean(room.currentSong);
}

function rewindTrack(room) {
  if (room.history && room.history.length > 0) {
    if (room.currentSong) {
      room.queue.unshift(room.currentSong);
    }
    room.currentSong = room.history.pop();
    room.currentTime = 0;
    room.isPlaying = true;
    room.lastUpdatedAt = Date.now();
  }
}

// --- Audio Routes ---

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: roomCache.size });
});

// Cache resolved audio URLs (they expire after ~6 hours on YouTube's side)
const audioUrlCache = new Map(); // { videoId: { directUrl, userAgent } }

function streamAudioFromYoutube(targetUrl, userAgent, reqHeaders, res, redirectCount = 0) {
  if (redirectCount > 5) {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Too many redirects' });
    } else {
      res.end();
    }
    return;
  }

  const client = targetUrl.startsWith('https:') ? https : http;
  const headers = {
    'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  };
  if (reqHeaders.range) {
    headers['Range'] = reqHeaders.range;
  }

  client.get(targetUrl, { headers }, (upstream) => {
    if (
      upstream.statusCode &&
      upstream.statusCode >= 300 &&
      upstream.statusCode < 400 &&
      upstream.headers.location
    ) {
      const redirectedUrl = new URL(upstream.headers.location, targetUrl).toString();
      upstream.resume();
      streamAudioFromYoutube(redirectedUrl, userAgent, reqHeaders, res, redirectCount + 1);
      return;
    }

    res.status(upstream.statusCode);
    if (upstream.headers['content-type']) res.setHeader('Content-Type', upstream.headers['content-type']);
    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
    if (upstream.headers['content-range']) res.setHeader('Content-Range', upstream.headers['content-range']);
    if (upstream.headers['accept-ranges']) res.setHeader('Accept-Ranges', upstream.headers['accept-ranges']);
    res.setHeader('Cache-Control', 'no-store');

    upstream.pipe(res);
    upstream.on('error', () => res.end());
  }).on('error', (err) => {
    console.error('Audio proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to stream audio' });
    } else {
      res.end();
    }
  });
}

app.get('/audio/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check cache first
    let cacheEntry = audioUrlCache.get(videoId);
    if (!cacheEntry) {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        format: 'bestaudio[ext=m4a]/bestaudio/best',
      });

      const directUrl = info.url;
      if (!directUrl) {
        return res.status(502).json({ error: 'Could not extract audio URL' });
      }

      const userAgent = info.http_headers?.['User-Agent'] || info.http_headers?.['user-agent'];

      cacheEntry = { directUrl, userAgent };
      // Cache for 5 hours
      audioUrlCache.set(videoId, cacheEntry);
      setTimeout(() => audioUrlCache.delete(videoId), 5 * 60 * 60 * 1000);
    }

    // Proxy the audio through our server (fixes CORS) with Range support (fixes seeking)
    streamAudioFromYoutube(cacheEntry.directUrl, cacheEntry.userAgent, req.headers, res);
  } catch (error) {
    console.error('Audio route error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to get audio URL' });
    }
  }
});

app.get('/audio/proxy', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || !isHttpUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid audio URL' });
  }
  streamRemoteAudio(String(targetUrl), res);
});

// --- YouTube Music Search (fast, accurate, no API key needed) ---
const ytmusic = new YTMusic();
let ytmusicReady = false;
ytmusic.initialize().then(() => {
  ytmusicReady = true;
  console.log('🎵 YouTube Music search initialized');
}).catch(err => console.error('YouTube Music init failed:', err.message));

const searchCache = new Map();

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q.trim();
    const cacheKey = query.toLowerCase();

    // Check cache first (instant response)
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      return res.json({ success: true, tracks: cached.tracks, provider: cached.provider });
    }

    let tracks = [];
    let provider = 'youtube';

    // Use YouTube Music search (returns clean song metadata + videoIds)
    if (ytmusicReady) {
      try {
        const results = await ytmusic.searchSongs(query);
        tracks = results.slice(0, 6).map(song => ({
          videoId: song.videoId,
          isSpotify: false,
          title: song.name,
          artist: song.artist?.name || 'Unknown Artist',
          duration: song.duration || 240,
          thumbnail: song.thumbnails?.[song.thumbnails.length - 1]?.url || '',
        }));
        provider = 'ytmusic';
      } catch (err) {
        console.warn('YouTube Music search failed:', err.message);
      }
    }

    // Fallback to youtube-sr if YTMusic is not ready
    if (tracks.length === 0) {
      try {
        const results = await YouTube.default.search(query, { limit: 5, type: 'video' });
        tracks = results.map(entry => ({
          videoId: entry.id,
          isSpotify: false,
          title: entry.title,
          duration: Math.round((entry.duration || 240000) / 1000),
          artist: entry.channel?.name || 'Unknown Artist',
          thumbnail: entry.thumbnail?.url || (entry.id ? `https://img.youtube.com/vi/${entry.id}/hqdefault.jpg` : ''),
        }));
        provider = 'youtube';
      } catch (fallbackErr) {
        console.error('YouTube fallback search also failed:', fallbackErr.message);
      }
    }

    // Cache results for 15 minutes
    searchCache.set(cacheKey, { tracks, provider });
    setTimeout(() => searchCache.delete(cacheKey), 15 * 60 * 1000);

    res.json({ success: true, tracks, provider });
  } catch (error) {
    console.error('Search API route error:', error.message);
    res.status(500).json({ error: 'Failed to search' });
  }
});

function streamRemoteAudio(targetUrl, res, redirectCount = 0) {
  if (redirectCount > 4) {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Too many redirects' });
    } else {
      res.end();
    }
    return;
  }

  const client = targetUrl.startsWith('https:') ? https : http;
  client
    .get(targetUrl, (remoteResponse) => {
      if (remoteResponse.statusCode && remoteResponse.statusCode >= 300 && remoteResponse.statusCode < 400 && remoteResponse.headers.location) {
        const redirectedUrl = new URL(remoteResponse.headers.location, targetUrl).toString();
        remoteResponse.resume();
        streamRemoteAudio(redirectedUrl, res, redirectCount + 1);
        return;
      }

      res.status(200);
      if (remoteResponse.headers['content-type']) {
        res.setHeader('Content-Type', remoteResponse.headers['content-type']);
      } else {
        res.setHeader('Content-Type', 'audio/mpeg');
      }
      res.setHeader('Cache-Control', 'no-store');
      remoteResponse.pipe(res);
      remoteResponse.on('error', () => {
        if (!res.headersSent) {
          res.status(502).end('Failed to stream remote audio');
        } else {
          res.end();
        }
      });
    })
    .on('error', () => {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Unable to stream remote audio' });
      } else {
        res.end();
      }
    });
}

// --- Room API Routes (with password protection) ---

// Create a new room
app.post('/room/create', async (req, res) => {
  try {
    const { roomName, password, username = 'Guest' } = req.body || {};
    
    if (!roomName || !password) {
      return res.status(400).json({ error: 'Room name and password are required.' });
    }

    // Check if room already exists
    const existing = await Room.findOne({ roomId: roomName.trim() });
    if (existing) {
      return res.status(409).json({ error: 'A room with this name already exists. Try joining it instead.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the room
    const room = new Room({
      roomId: roomName.trim(),
      password: hashedPassword,
      playlist: [],
      queue: [],
      users: [],
    });

    await room.save();
    room._cachedAt = Date.now();
    roomCache.set(room.roomId, room);

    res.json({ roomId: room.roomId, state: serializeRoom(room) });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room.' });
  }
});

// Join an existing room with password
app.post('/room/join', async (req, res) => {
  try {
    const { roomName, password, username = 'Guest' } = req.body || {};
    
    if (!roomName || !password) {
      return res.status(400).json({ error: 'Room name and password are required.' });
    }

    const room = await Room.findOne({ roomId: roomName.trim() });
    if (!room) {
      return res.status(404).json({ error: 'Room not found. Check the room name or create a new room.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, room.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    room._cachedAt = Date.now();
    roomCache.set(room.roomId, room);

    res.json({ roomId: room.roomId, state: serializeRoom(room) });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room.' });
  }
});

// Get room state (still available for socket reconnection)
app.get('/room/:roomId/state', async (req, res) => {
  try {
    const room = await getRoomFromDB(req.params.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(serializeRoom(room));
  } catch (error) {
    res.status(404).json({ error: 'Room not found' });
  }
});

// --- Socket.IO (Updated with password-protected rooms & permanent playlist) ---

io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  socket.on('join-room', async ({ roomId, username }) => {
    if (!roomId) return;

    try {
      let room = await getRoomFromDB(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }
      
      const existingUser = room.users.find((user) => user.id === socket.id);
      const userRecord = {
        id: socket.id,
        name: username || 'Guest',
        avatar: (username || 'G').slice(0, 1).toUpperCase(),
      };

      if (!existingUser) {
        room.users = room.users.filter((user) => user.id !== socket.id);
        room.users.push(userRecord);
      }

      if (!room.hostId) {
        room.hostId = socket.id;
      }

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username || 'Guest';

      socket.emit('room-state', serializeRoom(room));
      
      // Broadcast updated user list to everyone
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('get-room-state', async ({ roomId }) => {
    try {
      const room = await getRoomFromDB(roomId);
      if (!room) return;
      socket.emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error getting room state:', error);
    }
  });

  // Force-refresh from DB (bypasses cache) — useful after direct DB edits
  socket.on('refresh-room', async ({ roomId }) => {
    try {
      roomCache.delete(roomId); // Clear cache so we get fresh DB data
      const room = await Room.findOne({ roomId });
      if (!room) return;
      room._cachedAt = Date.now();
      roomCache.set(roomId, room);
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error refreshing room:', error);
    }
  });

  // Add a song — it goes into the queue/currentSong, and optional chosen playlist
  socket.on('add-song', async ({ roomId, song, username, input, playlistName }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      let nextSong;
      if (song && song.videoId) {
        // Song from YTMusic/YouTube search — already has a videoId
        nextSong = {
          id: song.id || `${song.videoId}-${Date.now()}`,
          videoId: song.videoId,
          title: song.title,
          artist: song.artist || 'Unknown Artist',
          duration: Number(song.duration) || 240,
          thumbnail: song.thumbnail,
          requestedBy: username || song.requestedBy || 'Guest',
          url: song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
          playbackUrl: song.playbackUrl || `/audio/${song.videoId}`,
        };
      } else {
        nextSong = await createSongFromInputAsync(input || song?.url || song?.videoId, username);
      }

      // Play the newly added song immediately
      if (room.currentSong) {
        // Put the currently playing song back at the front of the queue so it's not lost
        room.queue.unshift(room.currentSong);
      }
      room.currentSong = nextSong;
      room.currentTime = 0;
      room.lastUpdatedAt = Date.now();
      room.isPlaying = true;

      // Add to the chosen playlist ONLY if it's not queue-only
      if (playlistName && playlistName !== '__queue_only__') {
        if (!room.playlists || room.playlists.length === 0) {
          room.playlists = [{ name: 'Liked Songs', songs: room.playlist || [] }];
        }

        let targetPlaylist = room.playlists.find(p => p.name === playlistName);
        if (!targetPlaylist) {
          targetPlaylist = { name: playlistName, songs: [] };
          room.playlists.push(targetPlaylist);
        }
        
        // Prevent duplicate songs in the playlist
        if (!targetPlaylist.songs.some(s => s.videoId === nextSong.videoId)) {
          targetPlaylist.songs.push(nextSong);
        }

        if (playlistName === 'Liked Songs') {
          room.playlist = targetPlaylist.songs;
        }
      }

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error adding song:', error);
      socket.emit('error', 'Failed to add song');
    }
  });

  // Toggle like song (add/remove from "Liked Songs" playlist)
  socket.on('toggle-like-song', async ({ roomId, song, username }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      if (!room.playlists) {
        room.playlists = [{ name: 'Liked Songs', songs: [] }];
      }

      let likedPlaylist = room.playlists.find(p => p.name === 'Liked Songs');
      if (!likedPlaylist) {
        likedPlaylist = { name: 'Liked Songs', songs: [] };
        room.playlists.push(likedPlaylist);
      }

      // Check if song is liked
      const index = likedPlaylist.songs.findIndex(s => s.videoId === song.videoId);
      
      if (index > -1) {
        // Remove from Liked Songs
        likedPlaylist.songs.splice(index, 1);
      } else {
        // Add to Liked Songs
        const nextSong = {
          id: song.id || `${song.videoId}-${Date.now()}`,
          videoId: song.videoId,
          title: song.title,
          artist: song.artist || 'Unknown Artist',
          duration: Number(song.duration) || 240,
          thumbnail: song.thumbnail,
          requestedBy: username || song.requestedBy || 'Guest',
          url: song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
          playbackUrl: song.playbackUrl || `/audio/${song.videoId}`,
        };
        likedPlaylist.songs.push(nextSong);
      }

      // Sync legacy playlist
      room.playlist = likedPlaylist.songs;

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error toggling like song:', error);
    }
  });

  // Add song to playlist manually
  socket.on('add-song-to-playlist', async ({ roomId, song, playlistName }) => {
    try {
      if (!playlistName || playlistName === '__queue_only__') return;
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      if (!room.playlists) {
        room.playlists = [{ name: 'Liked Songs', songs: [] }];
      }

      let targetPlaylist = room.playlists.find(p => p.name === playlistName);
      if (!targetPlaylist) {
        targetPlaylist = { name: playlistName, songs: [] };
        room.playlists.push(targetPlaylist);
      }

      // Check if song already exists in that playlist
      if (!targetPlaylist.songs.some(s => s.videoId === song.videoId)) {
        const nextSong = {
          id: song.id || `${song.videoId}-${Date.now()}`,
          videoId: song.videoId,
          title: song.title,
          artist: song.artist || 'Unknown Artist',
          duration: Number(song.duration) || 240,
          thumbnail: song.thumbnail,
          requestedBy: song.requestedBy || 'Guest',
          url: song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
          playbackUrl: song.playbackUrl || `/audio/${song.videoId}`,
        };
        targetPlaylist.songs.push(nextSong);

        if (playlistName === 'Liked Songs') {
          room.playlist = targetPlaylist.songs;
        }

        room.lastUpdatedAt = new Date();
        await saveRoomToDB(room);
        io.to(roomId).emit('room-state', serializeRoom(room));
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
    }
  });

  // Remove a song from the permanent playlist (manual user action only)
  socket.on('remove-from-playlist', async ({ roomId, songId }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      // Remove from the active playlist
      let activePlaylistIsEmpty = false;
      if (room.playlists && room.playlists.length > 0) {
        const activePlaylist = room.playlists.find(p => p.name === room.activePlaylistName) || room.playlists[0];
        if (activePlaylist) {
          activePlaylist.songs = activePlaylist.songs.filter((s) => s.id !== songId);
          if (activePlaylist.songs.length === 0) {
            activePlaylistIsEmpty = true;
          }
        }
      } else {
        const remainingGlobal = room.playlist.filter((s) => s.id !== songId);
        if (remainingGlobal.length === 0) {
          activePlaylistIsEmpty = true;
        }
      }

      room.playlist = room.playlist.filter((s) => s.id !== songId);
      // Also remove from queue if it's there
      room.queue = room.queue.filter((s) => s.id !== songId);

      // If the currently playing song was removed, or if the active playlist is empty and queue is empty, stop playback and advance
      const isCurrentDeleted = room.currentSong && (room.currentSong.id === songId || String(room.currentSong._id) === String(songId));

      if (isCurrentDeleted || (activePlaylistIsEmpty && room.queue.length === 0)) {
        if (room.queue.length > 0) {
          room.currentSong = room.queue.shift();
          room.currentTime = 0;
          room.isPlaying = true;
        } else {
          room.currentSong = null;
          room.currentTime = 0;
          room.isPlaying = false;
        }
      }

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error removing from playlist:', error);
      socket.emit('error', 'Failed to remove song');
    }
  });

  // Create a new playlist
  socket.on('create-playlist', async ({ roomId, playlistName }) => {
    try {
      if (!playlistName || !playlistName.trim()) return;
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      if (!room.playlists) {
        room.playlists = [];
      }

      const trimmedName = playlistName.trim();
      const exists = room.playlists.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      
      if (!exists) {
        room.playlists.push({ name: trimmedName, songs: [] });
      }
      room.activePlaylistName = trimmedName;

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error creating playlist:', error);
      socket.emit('error', 'Failed to create playlist');
    }
  });

  // Select/switch active playlist
  socket.on('select-playlist', async ({ roomId, playlistName }) => {
    try {
      if (!playlistName) return;
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      const exists = room.playlists.some(p => p.name === playlistName);
      if (exists) {
        room.activePlaylistName = playlistName;
        room.lastUpdatedAt = new Date();
        await saveRoomToDB(room);
        io.to(roomId).emit('room-state', serializeRoom(room));
      }
    } catch (error) {
      console.error('Error selecting playlist:', error);
      socket.emit('error', 'Failed to select playlist');
    }
  });

  // Delete a playlist
  socket.on('delete-playlist', async ({ roomId, playlistName }) => {
    try {
      if (!playlistName || playlistName === 'Liked Songs') return; // Protect core playlist
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      room.playlists = room.playlists.filter(p => p.name !== playlistName);
      
      if (room.activePlaylistName === playlistName) {
        room.activePlaylistName = 'Liked Songs';
      }

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error deleting playlist:', error);
      socket.emit('error', 'Failed to delete playlist');
    }
  });

  // Play a song from the permanent playlist
  socket.on('play-from-playlist', async ({ roomId, songId }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      const song = room.playlist.find((s) => s.id === songId);
      if (!song) return;

      if (room.currentSong) {
        if (!room.history) room.history = [];
        room.history.push(room.currentSong);
        if (room.history.length > 30) room.history.shift();
      }
      room.currentSong = song;
      room.currentTime = 0;
      room.isPlaying = true;
      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error playing from playlist:', error);
      socket.emit('error', 'Failed to play song');
    }
  });

  socket.on('toggle-play', async ({ roomId, isPlaying, currentTime: clientTime }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room || !room.currentSong) return;

      // Use the client-provided time (actual audio position) if available, otherwise compute
      room.currentTime = (typeof clientTime === 'number' && clientTime >= 0) ? clientTime : getSyncedTime(room);
      room.isPlaying = typeof isPlaying === 'boolean' ? isPlaying : !room.isPlaying;
      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error toggling play:', error);
    }
  });

  socket.on('sync-time', async ({ roomId, currentTime }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room || !room.currentSong) return;

      room.currentTime = Math.max(0, Number(currentTime) || 0);
      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error syncing time:', error);
    }
  });

  socket.on('next-song', async ({ roomId }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      const finishedSong = room.currentSong;

      // Record the finished song in history before advancing
      if (finishedSong?.videoId) recordPlayHistory(roomId, finishedSong.videoId);

      advanceTrack(room);

      // ── SPOTIFY-LIKE AUTOPLAY ──────────────────────────────────────────────
      // Only triggers when queue becomes empty after advancing
      if (!room.currentSong && finishedSong) {
        try {
          console.log(`🎵 Autoplay: finding recommendation after "${finishedSong.title}"`);

          let candidates = [];

          if (ytmusicReady && finishedSong.videoId) {
            // ── STRATEGY 1: YouTube Music Radio (getUpNexts) ─────────────────
            // This is YTMusic's own radio engine — collaborative filtering +
            // audio-feature similarity, the same core as Spotify Radio.
            try {
              const upNexts = await ytmusic.getUpNexts(finishedSong.videoId);
              if (upNexts && upNexts.length > 0) {
                candidates = upNexts.slice(0, 8).map(normalizeCandidate);
                console.log(`  ✅ Strategy 1 (YTMusic Radio): ${candidates.length} candidates`);
              }
            } catch (e) {
              console.warn('  ⚠️  Strategy 1 failed:', e.message);
            }

            // ── STRATEGY 2: Artist's popular songs ───────────────────────────
            // Fetch artist's own catalog if we have an artistId from search
            if (candidates.length < 4) {
              try {
                const artistResults = await ytmusic.searchArtists(finishedSong.artist || finishedSong.title);
                const topArtist = artistResults[0];
                if (topArtist?.artistId) {
                  const artistSongs = await ytmusic.getArtistSongs(topArtist.artistId);
                  const artistCandidates = artistSongs.slice(0, 6).map(normalizeCandidate);
                  candidates = [...candidates, ...artistCandidates];
                  console.log(`  ✅ Strategy 2 (Artist songs): +${artistCandidates.length} candidates`);
                }
              } catch (e) {
                console.warn('  ⚠️  Strategy 2 failed:', e.message);
              }
            }

            // ── STRATEGY 3: Multi-signal search queries ────────────────────
            // Build smart queries that mirror Spotify's taste signals:
            // title-based similarity + artist context + genre hints
            if (candidates.length < 4) {
              const title = finishedSong.title || '';
              const artist = finishedSong.artist || '';
              // Strip common suffixes for cleaner queries
              const cleanTitle = title.replace(/\(.*?\)|\[.*?\]|official|video|audio|lyrics|ft\..*/gi, '').trim();
              const queries = [
                `${artist} similar songs mix`,
                `songs like ${cleanTitle}`,
                `${artist} top songs`,
              ];
              for (const q of queries) {
                if (candidates.length >= 6) break;
                try {
                  const r = await ytmusic.searchSongs(q);
                  const newOnes = r.slice(0, 4).map(normalizeCandidate);
                  candidates = [...candidates, ...newOnes];
                  console.log(`  ✅ Strategy 3 query "${q}": +${newOnes.length} candidates`);
                } catch {}
              }
            }
          }

          // ── STRATEGY 4: YouTube fallback search ───────────────────────────
          if (candidates.length === 0) {
            try {
              const query = `${finishedSong.artist || finishedSong.title} top songs`;
              const yt = await YouTube.default.search(query, { limit: 8, type: 'video' });
              candidates = yt.map(entry => ({
                videoId: entry.id,
                name: entry.title,
                artist: { name: entry.channel?.name || 'Unknown Artist' },
                duration: Math.round((entry.duration || 240000) / 1000),
                thumbnails: [{ url: entry.thumbnail?.url || `https://img.youtube.com/vi/${entry.id}/hqdefault.jpg` }],
              }));
              console.log(`  ✅ Strategy 4 (YT fallback): ${candidates.length} candidates`);
            } catch (e) {
              console.warn('  ⚠️  Strategy 4 failed:', e.message);
            }
          }

          // ── Deduplicate and filter out recently played ────────────────────
          const seen = new Set();
          const filtered = candidates.filter(c => {
            if (!c?.videoId) return false;
            if (seen.has(c.videoId)) return false;
            seen.add(c.videoId);
            // Allow the finished song's videoId back only if nothing else available
            return !wasRecentlyPlayed(roomId, c.videoId);
          });

          // If everything was filtered (edge case), fall back to unfiltered
          const pool = filtered.length > 0 ? filtered : candidates.filter((c, i, a) =>
            c?.videoId && a.findIndex(x => x.videoId === c.videoId) === i
          );

          // ── Weighted random pick (Spotify-style variety) ──────────────────
          const chosen = weightedPick(pool);

          if (chosen?.videoId) {
            const autoSong = {
              id: `${chosen.videoId}-${Date.now()}`,
              videoId: chosen.videoId,
              title: chosen.name || 'Unknown Title',
              artist: chosen.artist?.name || 'Unknown Artist',
              duration: Number(chosen.duration) || 240,
              thumbnail: chosen.thumbnails?.[chosen.thumbnails.length - 1]?.url
                || `https://img.youtube.com/vi/${chosen.videoId}/hqdefault.jpg`,
              requestedBy: '🤖 Autoplay',
              playbackUrl: `/audio/${chosen.videoId}`,
            };

            // Record in history immediately
            recordPlayHistory(roomId, autoSong.videoId);

            room.currentSong = autoSong;
            room.currentTime = 0;
            room.isPlaying = true;
            room.lastUpdatedAt = new Date();
            await saveRoomToDB(room);

            io.to(roomId).emit('room-state', serializeRoom(room));
            io.to(roomId).emit('autoplay', {
              title: autoSong.title,
              artist: autoSong.artist,
              thumbnail: autoSong.thumbnail,
            });

            console.log(`🎵 Autoplay → "${autoSong.title}" by ${autoSong.artist}`);
            return;
          }
        } catch (autoplayErr) {
          console.warn('Autoplay pipeline failed:', autoplayErr.message);
        }
      }

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error skipping song:', error);
    }
  });

  socket.on('previous-song', async ({ roomId }) => {
    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      rewindTrack(room);
      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);
      
      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error rewinding song:', error);
    }
  });

  socket.on('disconnect', async () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    try {
      let room = await getRoomFromDB(roomId);
      if (!room) return;

      room.users = room.users.filter((user) => user.id !== socket.id);
      if (room.hostId === socket.id) {
        room.hostId = room.users[0]?.id || null;
      }

      room.lastUpdatedAt = new Date();
      await saveRoomToDB(room);

      // Room is NEVER deleted — it persists forever with its playlist

      io.to(roomId).emit('room-state', serializeRoom(room));
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const port = Number(process.env.PORT || 4000);
server.listen(port, '0.0.0.0', async () => {
  console.log(`🎵 MusicDudes backend running on port ${port}`);
  console.log(`📡 Using MongoDB for persistent storage`);
  console.log(`🔒 Rooms are password-protected`);
  console.log(`🌐 Network: http://10.114.215.43:${port}`);
  
  try {
    // Clear all active users from database rooms on server startup since no one is connected yet
    const result = await Room.updateMany({}, { $set: { users: [], hostId: null } });
    
    // Migrate old playlist names to "Liked Songs"
    await Room.updateMany(
      { "playlists.name": "Default Playlist" },
      { $set: { "playlists.$[elem].name": "Liked Songs" } },
      { arrayFilters: [{ "elem.name": "Default Playlist" }] }
    );
    await Room.updateMany(
      { activePlaylistName: "Default Playlist" },
      { $set: { activePlaylistName: "Liked Songs" } }
    );
    await Room.updateMany(
      { "playlists.name": "Like Song" },
      { $set: { "playlists.$[elem].name": "Liked Songs" } },
      { arrayFilters: [{ "elem.name": "Like Song" }] }
    );
    await Room.updateMany(
      { activePlaylistName: "Like Song" },
      { $set: { activePlaylistName: "Liked Songs" } }
    );
    
    console.log(`🧹 Cleaned up ${result.modifiedCount} stale user sessions from database.`);
  } catch (err) {
    console.error('Failed to clean up stale users on startup:', err);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${port} is already in use!`);
    console.error(`   Run this to fix it:  taskkill /F /IM node.exe`);
    console.error(`   Then try again.\n`);
  } else {
    console.error('Server error:', err);
  }
});