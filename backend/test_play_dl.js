import play from 'play-dl';
async function test() {
  const streamInfo = await play.stream('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { discordPlayerCompatibility: true });
  console.log(Object.keys(streamInfo));
  console.log('url:', streamInfo.url);
}
test().catch(console.error);
