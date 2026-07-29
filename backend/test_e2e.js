async function test() {
  // The actual Kina Chir videoId from search
  const videoId = 'YE8S25WAII8';
  
  console.log('--- Testing /audio/' + videoId + ' ---');
  const start = Date.now();
  const audioRes = await fetch(`https://musicdudes.onrender.com/audio/${videoId}`, {
    headers: { 'Range': 'bytes=0-' },
    signal: AbortSignal.timeout(60000)
  });
  const elapsed = Date.now() - start;
  
  console.log('Response time:', elapsed + 'ms');
  console.log('Status:', audioRes.status);
  console.log('Content-Type:', audioRes.headers.get('content-type'));
  
  if (audioRes.status >= 400) {
    const body = await audioRes.text();
    console.log('ERROR:', body);
  } else {
    const reader = audioRes.body.getReader();
    const { value } = await reader.read();
    console.log('First chunk size:', value?.length, 'bytes');
    console.log('SUCCESS - audio is streaming');
    reader.cancel();
  }
  
  // Also test the diagnostic endpoint to see if yt-dlp works at all
  console.log('\n--- Testing /api/test-audio/' + videoId + ' ---');
  const start2 = Date.now();
  const diagRes = await fetch(`https://musicdudes.onrender.com/api/test-audio/${videoId}`, {
    signal: AbortSignal.timeout(60000)
  });
  const diagData = await diagRes.json();
  console.log('Diagnostic time:', (Date.now() - start2) + 'ms');
  console.log('Success:', diagData.success);
  if (!diagData.success) {
    console.log('Error:', diagData.error);
  } else {
    console.log('URL starts with:', diagData.url?.slice(0, 80));
  }
}
test().catch(e => console.error('Failed:', e.message));
