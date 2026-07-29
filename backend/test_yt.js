import youtubedl from 'youtube-dl-exec';
async function test() {
  try {
    const info = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      dumpSingleJson: true,
      noWarnings: true,
      format: 'bestaudio'
    });
    console.log(info.url);
  } catch (err) {
    console.error('youtube-dl-exec failed:', err);
  }
}
test();
