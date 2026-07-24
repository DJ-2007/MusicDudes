import mongoose from 'mongoose';
import { Room } from './db.js';

async function checkDB() {
  await mongoose.connect('mongodb://localhost:27017/music-with-dudes');
  const room = await Room.findOne({ roomId: 'DJ' });
  if (room) {
    const p = room.playlists.find(p => p.name === 'Liked Songs');
    console.log(JSON.stringify(p.songs, null, 2));
    console.log("activePlaylistName:", room.activePlaylistName);
  }
  process.exit(0);
}

checkDB().catch(err => {
  console.error(err);
  process.exit(1);
});
