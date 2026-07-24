import http from 'http';
import https from 'https';
import youtubedl from 'youtube-dl-exec';

const videoId = '6hV1jnQssj0';
const url = `https://www.youtube.com/watch?v=${videoId}`;

try {
  console.log("Getting formats...");
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    preferFreeFormats: true,
  });

  const audioFormat = (info.formats || [])
    .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

  const directUrl = audioFormat?.url || info.url;
  console.log("Direct URL:", directUrl.slice(0, 100) + '...');

  function streamAudioWithRedirects(targetUrl, redirectCount = 0) {
    if (redirectCount > 5) {
      console.log("Error: Too many redirects");
      return;
    }

    const client = targetUrl.startsWith('https:') ? https : http;
    const headers = {};

    client.get(targetUrl, { headers }, (upstream) => {
      console.log(`[Redirect ${redirectCount}] Status:`, upstream.statusCode);
      console.log(`[Redirect ${redirectCount}] Headers:`, upstream.headers);
      
      if (
        upstream.statusCode &&
        upstream.statusCode >= 300 &&
        upstream.statusCode < 400 &&
        upstream.headers.location
      ) {
        const redirectedUrl = new URL(upstream.headers.location, targetUrl).toString();
        upstream.resume();
        streamAudioWithRedirects(redirectedUrl, redirectCount + 1);
        return;
      }

      console.log("Successful connection! Status code:", upstream.statusCode);
      let bytes = 0;
      upstream.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 100000) {
          console.log("Received > 100KB, closing connection.");
          upstream.destroy();
        }
      });
    }).on('error', (err) => {
      console.error("Connection Error:", err);
    });
  }

  streamAudioWithRedirects(directUrl);
} catch (err) {
  console.error("Main Error:", err);
}
