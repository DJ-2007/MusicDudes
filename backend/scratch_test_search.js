import https from 'https';

function searchYouTubeScrape(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`; // sp=EgIQAQ%3D%3D filters for videos only
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };

    https.get(url, options, (res) => {
      let html = '';
      res.on('data', (chunk) => { html += chunk; });
      res.on('end', () => {
        try {
          const match = html.match(/ytInitialData\s*=\s*({.+?});/);
          if (!match) {
            return reject(new Error('Could not find ytInitialData in page source'));
          }

          const data = JSON.parse(match[1]);
          const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
          
          if (!contents) {
            return resolve([]);
          }

          const tracks = [];
          for (const item of contents) {
            const video = item.videoRenderer;
            if (!video) continue;

            const videoId = video.videoId;
            const title = video.title?.runs?.[0]?.text;
            const artist = video.ownerText?.runs?.[0]?.text || 'Unknown Artist';
            const thumbnail = video.thumbnail?.thumbnails?.[0]?.url;
            
            // Parse duration string e.g. "3:45" to seconds
            const durationText = video.lengthText?.simpleText || '';
            let duration = 0;
            if (durationText) {
              const parts = durationText.split(':').map(Number);
              if (parts.length === 2) {
                duration = parts[0] * 60 + parts[1];
              } else if (parts.length === 3) {
                duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
              }
            } else {
              duration = 240; // Default fallback
            }

            if (videoId && title) {
              tracks.push({ videoId, title, artist, thumbnail, duration });
            }

            if (tracks.length >= 5) break;
          }

          resolve(tracks);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

console.log("Searching YouTube directly via HTTPS request...");
console.time("SearchTime");
searchYouTubeScrape("Rick Astley")
  .then((results) => {
    console.timeEnd("SearchTime");
    console.log("Found results:", results.length);
    console.log(JSON.stringify(results, null, 2));
  })
  .catch((err) => {
    console.error("Error:", err);
  });
