require('dotenv').config({ path: '.env' });
async function test() {
    const url = 'https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/policies/cmpqhbby60001m8szttlu4but/1781582519183-POLIZA%2035223.pdf';
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Status:", response.status);
    console.log("Response text:", await response.text());
}
test();
