import mongoose from 'mongoose';
import { Room } from './db.js';

async function checkDB() {
  await mongoose.connect('mongodb://localhost:27017/music-with-dudes');
  const rooms = await Room.find({});
  for (const room of rooms) {
    console.log(`Room: ${room.roomId}`);
    console.log(`Legacy playlist count: ${room.playlist ? room.playlist.length : 0}`);
    console.log(`Playlists:`);
    if (room.playlists) {
      room.playlists.forEach(p => {
        console.log(`  - ${p.name}: ${p.songs ? p.songs.length : 0} songs`);
      });
    }
  }
  process.exit(0);
}

checkDB().catch(err => {
  console.error(err);
  process.exit(1);
});
