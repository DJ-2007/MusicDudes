import YouTube from 'youtube-sr';

console.log("Searching YouTube via youtube-sr...");
console.time("youtube-sr");
YouTube.default.search("Rick Astley", { limit: 5, type: 'video' })
  .then((results) => {
    console.timeEnd("youtube-sr");
    console.log("Found results:", results.length);
    if (results.length > 0) {
      const first = results[0];
      console.log("First result:", {
        id: first.id,
        title: first.title,
        duration: first.duration,
        artist: first.channel?.name,
        thumbnail: first.thumbnail?.url,
      });
    }
  })
  .catch((err) => {
    console.error("Error:", err);
  });
