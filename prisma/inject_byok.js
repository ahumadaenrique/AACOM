const { Client } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function injectBYOK() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('No DATABASE_URL found.');
    return;
  }
  const client = new Client(dbUrl);
  try {
    await client.connect();
    await client.query('ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "elevenLabsApiKey" TEXT;');
    await client.query('ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "elevenLabsVoiceId" TEXT;');
    console.log('BYOK columns injected successfully.');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
injectBYOK();
