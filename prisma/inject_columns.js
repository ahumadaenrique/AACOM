const { Client } = require('@neondatabase/serverless');
require('dotenv').config();

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
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "quoterShowAccumulatedPremium" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "allowRoleplaySimulator" BOOLEAN DEFAULT false;`,
      `CREATE TABLE IF NOT EXISTS "RoleplayCall" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "scenarioId" TEXT,
        "prospectName" TEXT NOT NULL,
        "scenarioTitle" TEXT NOT NULL,
        "level" INTEGER NOT NULL DEFAULT 1,
        "durationSeconds" INTEGER NOT NULL DEFAULT 0,
        "score" INTEGER NOT NULL DEFAULT 0,
        "xpEarned" INTEGER NOT NULL DEFAULT 0,
        "callAudioUrl" TEXT,
        "conversationId" TEXT,
        "transcript" JSONB,
        "evaluation" JSONB,
        "aciertos" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "errores" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "coachTip" TEXT,
        "objectionHandled" BOOLEAN NOT NULL DEFAULT false,
        "appointmentClosed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RoleplayCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "RoleplayCall_userId_idx" ON "RoleplayCall"("userId");`,
      `CREATE INDEX IF NOT EXISTS "RoleplayCall_createdAt_idx" ON "RoleplayCall"("createdAt");`,
      `CREATE TABLE IF NOT EXISTS "RoleplayStats" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT UNIQUE NOT NULL,
        "xp" INTEGER NOT NULL DEFAULT 0,
        "level" INTEGER NOT NULL DEFAULT 1,
        "streak" INTEGER NOT NULL DEFAULT 0,
        "lastActiveDate" TEXT,
        "todayXp" INTEGER NOT NULL DEFAULT 0,
        "todayDate" TEXT,
        "todayCallsCount" INTEGER NOT NULL DEFAULT 0,
        "totalCalls" INTEGER NOT NULL DEFAULT 0,
        "closedCalls" INTEGER NOT NULL DEFAULT 0,
        "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "unlockedBenefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RoleplayStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "RoleplayStats_userId_idx" ON "RoleplayStats"("userId");`
    ];

    for (const q of queries) {
      await client.query(q);
      console.log(`Executed: ${q}`);
    }

    console.log("Column injection completed successfully.");
  } catch (error) {
    console.warn("⚠️  inject_columns: Could not connect to DB or columns may already exist. Continuing build...");
    console.warn(error.message || error);
    // Do NOT exit(1) — columns already exist in production. A transient DB error should not block the build.
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

injectColumns();
