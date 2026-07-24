import https from 'https';

function getSpotifyCookieAndToken() {
  return new Promise((resolve, reject) => {
    // Step 1: Visit open.spotify.com to get session cookies
    const url1 = 'https://open.spotify.com';
    const options1 = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    };

    https.get(url1, options1, (res1) => {
      const cookies = res1.headers['set-cookie'] || [];
      const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
      
      // Step 2: Request the token using the cookies
      const url2 = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player';
      const options2 = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cookie': cookieHeader,
          'Referer': 'https://open.spotify.com/',
        }
      };

      https.get(url2, options2, (res2) => {
        let body = '';
        res2.on('data', (chunk) => body += chunk);
        res2.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.accessToken) {
              resolve(data.accessToken);
            } else {
              reject(new Error('No access token in response: ' + body));
            }
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message + ', body: ' + body));
          }
        });
      }).on('error', reject);
    }).on('error', reject);
  });
}

console.log("Attempting to get Spotify token using cookie simulation...");
getSpotifyCookieAndToken()
  .then((token) => {
    console.log("SUCCESS! Got token:", token.substring(0, 10) + "...");
  })
  .catch((err) => {
    console.error("FAILED:", err.message);
  });
