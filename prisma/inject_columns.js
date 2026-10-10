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
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "elevenLabsApiKey" TEXT;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "elevenLabsVoiceId" TEXT;`,
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
      `CREATE INDEX IF NOT EXISTS "RoleplayStats_userId_idx" ON "RoleplayStats"("userId");`,
      `CREATE TABLE IF NOT EXISTS "SatisfactionSurvey" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "agencyId" TEXT,
        "intervieweeName" TEXT NOT NULL,
        "q1Useful" BOOLEAN NOT NULL DEFAULT true,
        "q2Attractive" BOOLEAN NOT NULL DEFAULT true,
        "q3Professional" BOOLEAN NOT NULL DEFAULT true,
        "q4Clear" BOOLEAN NOT NULL DEFAULT true,
        "q5WouldRecommend" BOOLEAN NOT NULL DEFAULT true,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SatisfactionSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "SatisfactionSurvey_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "SatisfactionSurvey_userId_idx" ON "SatisfactionSurvey"("userId");`,
      `CREATE INDEX IF NOT EXISTS "SatisfactionSurvey_agencyId_idx" ON "SatisfactionSurvey"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "SatisfactionSurvey_createdAt_idx" ON "SatisfactionSurvey"("createdAt");`,
      `CREATE TABLE IF NOT EXISTS "SurveyReferral" (
        "id" TEXT PRIMARY KEY,
        "surveyId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "agencyId" TEXT,
        "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "notes" TEXT,
        "status" TEXT NOT NULL DEFAULT 'NO_CONTACTADO',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SurveyReferral_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "SatisfactionSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "SurveyReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "SurveyReferral_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "SurveyReferral_surveyId_idx" ON "SurveyReferral"("surveyId");`,
      `CREATE INDEX IF NOT EXISTS "SurveyReferral_userId_idx" ON "SurveyReferral"("userId");`,
      `CREATE INDEX IF NOT EXISTS "SurveyReferral_agencyId_idx" ON "SurveyReferral"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "SurveyReferral_status_idx" ON "SurveyReferral"("status");`,
      `CREATE INDEX IF NOT EXISTS "SurveyReferral_createdAt_idx" ON "SurveyReferral"("createdAt");`,
      `CREATE TABLE IF NOT EXISTS "InsuranceCompany" (
        "id" TEXT PRIMARY KEY,
        "agencyId" TEXT,
        "name" TEXT NOT NULL,
        "logoUrl" TEXT,
        "color" TEXT DEFAULT '#0284c7',
        "order" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InsuranceCompany_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "InsuranceCompany_agencyId_idx" ON "InsuranceCompany"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "InsuranceCompany_order_idx" ON "InsuranceCompany"("order");`,
      `CREATE TABLE IF NOT EXISTS "AgentEmission" (
        "id" TEXT PRIMARY KEY,
        "agencyId" TEXT,
        "agentId" TEXT NOT NULL,
        "companyId" TEXT,
        "companyName" TEXT NOT NULL,
        "policyNumber" TEXT,
        "clientName" TEXT,
        "ramo" TEXT DEFAULT 'Protección',
        "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "primaEmitida" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "primaPagada" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'EMITIDA',
        "notes" TEXT,
        "createdById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AgentEmission_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "AgentEmission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AgentEmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "InsuranceCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "AgentEmission_agencyId_idx" ON "AgentEmission"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "AgentEmission_agentId_idx" ON "AgentEmission"("agentId");`,
      `CREATE INDEX IF NOT EXISTS "AgentEmission_companyId_idx" ON "AgentEmission"("companyId");`,
      `CREATE INDEX IF NOT EXISTS "AgentEmission_year_month_idx" ON "AgentEmission"("year", "month");`,
      `CREATE INDEX IF NOT EXISTS "AgentEmission_issueDate_idx" ON "AgentEmission"("issueDate");`,
      `CREATE TABLE IF NOT EXISTS "AgentMonthlyBudget" (
        "id" TEXT PRIMARY KEY,
        "agencyId" TEXT,
        "agentId" TEXT NOT NULL,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "budgetPE" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "source" TEXT NOT NULL DEFAULT 'PEA_AUTO',
        "sourceReviewId" TEXT,
        "notes" TEXT,
        "updatedById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AgentMonthlyBudget_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AgentMonthlyBudget_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "AgentMonthlyBudget_agent_year_month_key" ON "AgentMonthlyBudget"("agentId", "year", "month");`,
      `CREATE INDEX IF NOT EXISTS "AgentMonthlyBudget_agencyId_idx" ON "AgentMonthlyBudget"("agencyId");`,
      `CREATE TABLE IF NOT EXISTS "Lead" (
        "id" TEXT PRIMARY KEY,
        "fullName" TEXT NOT NULL,
        "agencyName" TEXT NOT NULL,
        "insurers" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "agentsCount" TEXT NOT NULL,
        "whatsapp" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "privacyAccepted" BOOLEAN NOT NULL DEFAULT true,
        "utmSource" TEXT,
        "utmMedium" TEXT,
        "utmCampaign" TEXT,
        "utmContent" TEXT,
        "utmTerm" TEXT,
        "originPage" TEXT DEFAULT '/inicio',
        "status" TEXT NOT NULL DEFAULT 'NUEVO',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");`,
      `CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead"("email");`,
      `ALTER TABLE "preguntas" ADD COLUMN IF NOT EXISTS "explanation" TEXT;`,
      `ALTER TABLE "preguntas" ADD COLUMN IF NOT EXISTS "explicacion" TEXT;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT DEFAULT 'QUARTERLY';`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "voiceEngine" TEXT DEFAULT 'GEMINI_LIVE';`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "byokActive" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "voiceSecondsBalance" INTEGER DEFAULT 0;`,
      `ALTER TABLE "RoleplayCall" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;`,
      `ALTER TABLE "RoleplayCall" ADD COLUMN IF NOT EXISTS "engine" TEXT DEFAULT 'GEMINI_LIVE';`,
      `CREATE INDEX IF NOT EXISTS "RoleplayCall_agencyId_idx" ON "RoleplayCall"("agencyId");`
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
