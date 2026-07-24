import http from 'http';

console.log("Requesting backend audio for 6hV1jnQssj0...");
http.get('http://localhost:4000/audio/6hV1jnQssj0', (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
  
  let chunkCount = 0;
  res.on('data', (chunk) => {
    chunkCount++;
    if (chunkCount === 1) {
      console.log("First chunk size:", chunk.length);
      console.log("First 20 bytes (hex):", chunk.slice(0, 20).toString('hex'));
      console.log("First 20 bytes (ascii):", chunk.slice(0, 20).toString('ascii'));
    }
  });

  res.on('end', () => {
    console.log("Response ended. Total chunks:", chunkCount);
  });
}).on('error', (err) => {
  console.error("Request Error:", err);
});
