async function test() {
  const videoId = 'dQw4w9WgXcQ'; // Rick roll
  try {
    const res = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
    const data = await res.json();
    const audioStreams = data.audioStreams || [];
    const bestAudio = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
    console.log(bestAudio ? bestAudio.url : 'No audio found');
  } catch (err) {
    console.error('Piped failed:', err);
  }
}
test();
