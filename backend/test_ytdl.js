import ytdl from '@distube/ytdl-core';
async function test() {
  const info = await ytdl.getInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
  console.log(format.url);
}
test().catch(console.error);
