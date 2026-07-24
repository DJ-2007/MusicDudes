import mongoose from 'mongoose';
import { Room } from './db.js';

async function fixDB() {
  await mongoose.connect('mongodb://localhost:27017/music-with-dudes');
  const rooms = await Room.find({});
  for (const room of rooms) {
    let likedPlaylist = room.playlists.find(p => p.name === 'Liked Songs');
    if (likedPlaylist && likedPlaylist.songs.length === 0 && room.playlist && room.playlist.length > 0) {
      console.log(`Fixing room ${room.roomId}: copying ${room.playlist.length} legacy songs to Liked Songs`);
      likedPlaylist.songs = [...room.playlist];
      await room.save();
    }
  }
  process.exit(0);
}

fixDB().catch(err => {
  console.error(err);
  process.exit(1);
});
