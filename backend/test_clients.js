// Test different yt-dlp client types on Render to see which bypasses bot detection
const videoId = 'YE8S25WAII8';

const CLIENTS = [
  { name: 'default', args: {} },
  { name: 'tv_embedded', args: { extractorArgs: 'youtube:player_client=tv_embedded' } },
  { name: 'tv', args: { extractorArgs: 'youtube:player_client=tv' } },
  { name: 'ios', args: { extractorArgs: 'youtube:player_client=ios' } },
  { name: 'android_vr', args: { extractorArgs: 'youtube:player_client=android_vr' } },
  { name: 'mweb', args: { extractorArgs: 'youtube:player_client=mweb' } },
  { name: 'mediaconnect', args: { extractorArgs: 'youtube:player_client=mediaconnect' } },
];

import youtubedl from 'youtube-dl-exec';

async function testClient(client) {
  const start = Date.now();
  try {
    const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true,
      noWarnings: true,
      format: 'bestaudio[ext=m4a]/bestaudio/best',
      ...client.args,
    });
    const elapsed = Date.now() - start;
    return { name: client.name, ok: true, elapsed, url: info.url?.slice(0, 60) };
  } catch (e) {
    const elapsed = Date.now() - start;
    const msg = e.message?.includes('bot') ? 'BOT CHECK' : 
                e.message?.includes('Sign in') ? 'BOT CHECK' :
                e.message?.slice(0, 100);
    return { name: client.name, ok: false, elapsed, error: msg };
  }
}

async function main() {
  console.log(`Testing yt-dlp clients for video ${videoId}...\n`);
  for (const client of CLIENTS) {
    const result = await testClient(client);
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.elapsed}ms)`);
    if (result.ok) {
      console.log(`   URL: ${result.url}...`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  }
}

main();
