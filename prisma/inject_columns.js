const { Client } = require('@neondatabase/serverless');

async function injectColumns() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("No DATABASE_URL found. Skipping injection.");
    return;
  }

  const client = new Client(dbUrl);
  
  try {
    await client.connect();
    console.log("Connected to database. Injecting columns if they don't exist...");

    const queries = [
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "quoterLifeCompany" TEXT DEFAULT 'Insignia Life';`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "quoterEnableVPL" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "quoterEnableVPLPPR" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "quoterEnableUniversal" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "quoterShowAccumulatedPremium" BOOLEAN DEFAULT false;`
    ];

    for (const q of queries) {
      await client.query(q);
      console.log(`Executed: ${q}`);
    }

    console.log("Column injection completed successfully.");
  } catch (error) {
    console.error("Error injecting columns:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

injectColumns();
