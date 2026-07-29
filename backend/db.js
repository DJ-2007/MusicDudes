import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/music-with-dudes';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Song Schema
const songSchema = new mongoose.Schema({
  id: { type: String, required: true },
  videoId: { type: String },
  title: { type: String, required: true },
  duration: { type: Number, default: 240 },
  artist: { type: String, default: 'Unknown Artist' },
  thumbnail: { type: String },
  requestedBy: { type: String, default: 'Guest' },
  url: { type: String },
  playbackUrl: { type: String },
  addedAt: { type: Date, default: Date.now }
});

// User Schema (for room users)
const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  joinedAt: { type: Date, default: Date.now }
});

// Room Schema
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  currentSong: songSchema,
  queue: [songSchema],
  playlist: [songSchema],       // Permanent playlist — songs stored here forever
  playlists: [{
    name: { type: String, required: true },
    songs: [songSchema]
  }],
  activePlaylistName: { type: String, default: 'Home' },
  users: [userSchema],
  history: [songSchema],
  isPlaying: { type: Boolean, default: false },
  isShuffle: { type: Boolean, default: false },
  isRepeat: { type: Boolean, default: false },
  currentTime: { type: Number, default: 0 },
  hostId: { type: String },
  lastUpdatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries (roomId index is auto-created by unique: true)
roomSchema.index({ 'queue.id': 1 });
roomSchema.index({ 'playlist.id': 1 });
roomSchema.index({ 'users.id': 1 });

const Room = mongoose.model('Room', roomSchema);

export { Room, mongoose };