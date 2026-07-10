require('dotenv').config({ path: '.env' });
async function test() {
    const url = 'https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/policies/cmpqhbby60001m8szttlu4but/1781582519183-POLIZA%2035223.pdf';
    
    // We know this token belongs to the lxyhgkkgwtxjiqp0 store
    const oldToken = "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";
    // Let's pretend process.env has a different one
    const currentToken = process.env.BLOB_READ_WRITE_TOKEN;

    console.log("Current Token:", currentToken);
    console.log("Old Token:", oldToken);

    const tryFetch = async (t, label) => {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
        console.log(`[${label}] Status:`, res.status);
    }

    await tryFetch(currentToken, "Current Token");
    await tryFetch(oldToken, "Old Token");
}
test();
