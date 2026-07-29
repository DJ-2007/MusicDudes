async function test() {
  const videoId = 'dQw4w9WgXcQ';
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        isAudioOnly: true
      })
    });
    
    if (!res.ok) {
      console.log('Cobalt failed with status:', res.status);
      console.log(await res.text());
      return;
    }
    
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error('Cobalt failed:', err);
  }
}
test();
