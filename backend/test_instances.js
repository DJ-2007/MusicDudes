// Test multiple Piped and Invidious instances to find ones that work
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de', 
  'https://api.piped.yt',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi.darkness.services',
  'https://piped-api.lunar.icu',
  'https://pa.il.ax',
  'https://pipedapi.drgns.space',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.privacyredirect.com',
  'https://yt.cdaut.de',
  'https://invidious.protokolla.fi',
];

const videoId = 'YE8S25WAII8'; // Kina Chir

async function testPiped(base) {
  try {
    const res = await fetch(`${base}/streams/${videoId}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return { instance: base, status: res.status, ok: false };
    const data = await res.json();
    const audioStreams = data.audioStreams || [];
    if (audioStreams.length > 0) {
      const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      return { instance: base, ok: true, audioCount: audioStreams.length, bestUrl: best.url?.slice(0, 80), bitrate: best.bitrate, mimeType: best.mimeType };
    }
    return { instance: base, ok: false, reason: 'no audio streams' };
  } catch (e) {
    return { instance: base, ok: false, error: e.message };
  }
}

async function testInvidious(base) {
  try {
    const res = await fetch(`${base}/api/v1/videos/${videoId}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return { instance: base, status: res.status, ok: false };
    const data = await res.json();
    const adaptiveFormats = data.adaptiveFormats || [];
    const audioFormats = adaptiveFormats.filter(f => f.type && f.type.startsWith('audio'));
    if (audioFormats.length > 0) {
      return { instance: base, ok: true, audioCount: audioFormats.length, bestUrl: audioFormats[0].url?.slice(0, 80) };
    }
    return { instance: base, ok: false, reason: 'no audio formats' };
  } catch (e) {
    return { instance: base, ok: false, error: e.message };
  }
}

async function main() {
  console.log('=== Testing Piped Instances ===\n');
  for (const inst of PIPED_INSTANCES) {
    const result = await testPiped(inst);
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} ${inst}`);
    if (result.ok) {
      console.log(`   Audio streams: ${result.audioCount}, Best bitrate: ${result.bitrate}, Type: ${result.mimeType}`);
    } else {
      console.log(`   ${result.error || result.reason || 'status ' + result.status}`);
    }
  }

  console.log('\n=== Testing Invidious Instances ===\n');
  for (const inst of INVIDIOUS_INSTANCES) {
    const result = await testInvidious(inst);
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} ${inst}`);
    if (result.ok) {
      console.log(`   Audio formats: ${result.audioCount}`);
    } else {
      console.log(`   ${result.error || result.reason || 'status ' + result.status}`);
    }
  }
}

main();
