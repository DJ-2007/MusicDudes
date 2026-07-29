async function test() {
  while (true) {
    try {
      const res = await fetch('https://musicdudes.onrender.com/api/test-audio/dQw4w9WgXcQ');
      if (res.status !== 404) {
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 5000));
  }
}
test();
