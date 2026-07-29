// Poll Render's test endpoint until the new multi-client version is deployed
async function poll() {
  const url = 'https://musicdudes.onrender.com/api/test-audio/YE8S25WAII8';
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      const data = await res.json();
      // New version returns { results: [...] }
      if (data.results) {
        console.log(JSON.stringify(data.results, null, 2));
        return;
      }
      console.log('Old version still running, waiting...');
    } catch (e) {
      console.log('Waiting for deploy...', e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log('Timed out waiting for deploy');
}
poll();
