import https from 'https';

function getSpotifyToken() {
  return new Promise((resolve, reject) => {
    const url = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player';
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    };

    https.get(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.accessToken) {
            resolve(data.accessToken);
          } else {
            reject(new Error('No access token in response: ' + body));
          }
        } catch (e) {
          reject(new Error('Failed to parse Spotify token JSON: ' + e.message + ', body: ' + body));
        }
      });
    }).on('error', reject);
  });
}

function searchSpotify(query, token) {
  return new Promise((resolve, reject) => {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`;
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    };

    https.get(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

console.log("Fetching anonymous Spotify token...");
getSpotifyToken()
  .then((token) => {
    console.log("Got token successfully! Searching for 'Rick Astley'...");
    return searchSpotify('Rick Astley', token);
  })
  .then((results) => {
    console.log("Search results tracks count:", results.tracks?.items?.length);
    if (results.tracks?.items?.length > 0) {
      const track = results.tracks.items[0];
      console.log("First track:", {
        name: track.name,
        artists: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        thumbnail: track.album.images[0]?.url,
        duration_ms: track.duration_ms,
      });
    }
  })
  .catch((err) => {
    console.error("Error:", err);
  });
