import youtubedl from 'youtube-dl-exec';

const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
try {
  console.log("Fetching video info...");
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    preferFreeFormats: true,
  });
  console.log("Got video info!");

  const audioFormats = (info.formats || [])
    .filter(f => f.acodec !== 'none' && f.vcodec === 'none');
  
  console.log("Number of audio-only formats:", audioFormats.length);
  
  const sorted = [...audioFormats].sort((a, b) => (b.abr || 0) - (a.abr || 0));
  
  console.log("Top 5 formats:");
  sorted.slice(0, 5).forEach((f, idx) => {
    console.log(`${idx}: id=${f.format_id}, ext=${f.ext}, acodec=${f.acodec}, abr=${f.abr}, container=${f.container}, protocol=${f.protocol}, url=${f.url ? f.url.slice(0, 80) + '...' : 'none'}`);
  });

  const bestFormat = sorted[0];
  console.log("\nBest format selected:", bestFormat.format_id);

} catch (err) {
  console.error("Error:", err);
}
