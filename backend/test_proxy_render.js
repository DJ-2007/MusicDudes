async function test() {
  const res = await fetch('https://musicdudes.onrender.com/audio/dQw4w9WgXcQ', {
    headers: { 'Range': 'bytes=0-1000' }
  });
  console.log('Status:', res.status);
  console.log('Headers:', res.headers);
  const text = await res.text();
  console.log('Body start:', text.slice(0, 200));
}
test();
