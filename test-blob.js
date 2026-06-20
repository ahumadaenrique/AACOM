const { put } = require('@vercel/blob');


async function test() {
    try {
        console.log("Token:", process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 10));
        const blob = await put('test.txt', 'Hello World', {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        console.log("Success:", blob);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
