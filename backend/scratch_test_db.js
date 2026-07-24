import { Room } from './db.js';

async function test() {
  try {
    const room = await Room.findOne();
    if (!room) {
      console.log("No room found in database.");
      process.exit(0);
    }
    console.log("Room ID:", room.roomId);
    if (room.currentSong) {
      console.log("currentSong object:", room.currentSong);
      console.log("currentSong.id:", room.currentSong.id);
      console.log("currentSong.get('id'):", room.currentSong.get('id'));
      console.log("currentSong._doc.id:", room.currentSong._doc?.id);
    } else {
      console.log("No current song set in the room.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

test();
