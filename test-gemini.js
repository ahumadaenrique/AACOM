require('dotenv').config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    console.log("Using API key:", apiKey ? "Present" : "Missing");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "a" }] }] })
    });

    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
}
test();
