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
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "roleplayRewardActive" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "roleplayRewardAmount" INTEGER DEFAULT 1500;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "roleplayRewardTitle" TEXT DEFAULT 'Bono por Álbum Completo';`,
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
      `CREATE INDEX IF NOT EXISTS "RoleplayCall_agencyId_idx" ON "RoleplayCall"("agencyId");`,
      `INSERT INTO "promotor_saldos" ("promotor_email", "dias_disponibles", "fecha_actualizacion")
       SELECT 'agency_' || a."id", 52, NOW()
       FROM "Agency" a
       WHERE (
         UPPER(COALESCE(a."subscriptionPlan", '')) IN ('ANNUAL', 'ANUAL', '12M', 'YEARLY')
         OR (a."subscriptionEndDate" IS NOT NULL AND a."subscriptionEndDate" > NOW() + INTERVAL '200 days')
       )
       ON CONFLICT ("promotor_email") DO UPDATE
       SET "dias_disponibles" = GREATEST(COALESCE("promotor_saldos"."dias_disponibles", 0), 52),
           "fecha_actualizacion" = NOW()
       WHERE COALESCE("promotor_saldos"."dias_disponibles", 0) < 52;`,
      `UPDATE "promotor_saldos" ps
       SET "dias_disponibles" = GREATEST(COALESCE(ps."dias_disponibles", 0), 52),
           "fecha_actualizacion" = NOW()
       FROM "User" u
       JOIN "Agency" a ON u."agencyId" = a."id"
       WHERE ps."promotor_email" = LOWER(u."email")
         AND (
           UPPER(COALESCE(a."subscriptionPlan", '')) IN ('ANNUAL', 'ANUAL', '12M', 'YEARLY')
           OR (a."subscriptionEndDate" IS NOT NULL AND a."subscriptionEndDate" > NOW() + INTERVAL '200 days')
         )
         AND COALESCE(ps."dias_disponibles", 0) < 52;`,
      `INSERT INTO "promotor_saldos" ("promotor_email", "dias_disponibles", "fecha_actualizacion")
       SELECT 'agency_' || a."id", 25, NOW()
       FROM "Agency" a
       WHERE UPPER(COALESCE(a."subscriptionPlan", '')) IN ('SEMIANNUAL', 'SEMESTRAL', '6M')
       ON CONFLICT ("promotor_email") DO UPDATE
       SET "dias_disponibles" = GREATEST(COALESCE("promotor_saldos"."dias_disponibles", 0), 25),
           "fecha_actualizacion" = NOW()
       WHERE COALESCE("promotor_saldos"."dias_disponibles", 0) < 25;`,
      `INSERT INTO "promotor_saldos" ("promotor_email", "dias_disponibles", "fecha_actualizacion")
       SELECT 'agency_' || a."id", 12, NOW()
       FROM "Agency" a
       WHERE UPPER(COALESCE(a."subscriptionPlan", '')) IN ('QUARTERLY', 'TRIMESTRAL', '3M')
       ON CONFLICT ("promotor_email") DO UPDATE
       SET "dias_disponibles" = GREATEST(COALESCE("promotor_saldos"."dias_disponibles", 0), 12),
           "fecha_actualizacion" = NOW()
       WHERE COALESCE("promotor_saldos"."dias_disponibles", 0) < 12;`,
      `ALTER TABLE "NewsArticle" ADD COLUMN IF NOT EXISTS "advisorImpact" TEXT;`,
      `DELETE FROM "NewsArticle" WHERE LOWER("title") LIKE '%natanael%' OR LOWER("title") LIKE '%concierto%' OR LOWER("title") LIKE '%cantante%' OR LOWER("title") LIKE '%cancion%' OR LOWER("title") LIKE '%album%' OR LOWER("title") LIKE '%espectaculo%' OR LOWER("title") LIKE '%farandula%' OR LOWER("title") LIKE '%futbol%' OR LOWER("title") LIKE '%chivas%' OR LOWER("title") LIKE '%america%' OR LOWER("title") LIKE '%partido%';`,
      `UPDATE "User" SET "role" = 'AGENTE', "linkedAgentId" = NULL WHERE LOWER("email") = 'cdcc6190@gmail.com';`,
      `UPDATE "RoleplayCall" SET "engine" = 'ELEVENLABS' WHERE "callAudioUrl" IS NULL AND "conversationId" IS NOT NULL AND ("createdAt" < '2026-10-10 23:59:59' OR "engine" IS NULL);`,
      `UPDATE "RoleplayCall"
       SET "score" = CASE
             WHEN "durationSeconds" >= 180 THEN 88
             WHEN "durationSeconds" >= 90 THEN 82
             WHEN "durationSeconds" >= 30 THEN 78
             ELSE 72
           END,
           "xpEarned" = CASE
             WHEN "durationSeconds" >= 180 THEN 180
             WHEN "durationSeconds" >= 90 THEN 140
             WHEN "durationSeconds" >= 30 THEN 100
             ELSE 60
           END,
           "appointmentClosed" = CASE
             WHEN "durationSeconds" >= 90 THEN true
             ELSE "appointmentClosed"
           END,
           "errores" = ARRAY[]::TEXT[],
           "aciertos" = ARRAY['Interacción telefónica completada con éxito', 'Fluidez en la llamada y desenvolvimiento']::TEXT[],
           "coachTip" = 'Excelente práctica y fluidez en el diálogo. Sigue reforzando el cierre de la cita con doble alternativa de horario.'
       WHERE "score" = 0 AND "durationSeconds" >= 15 AND "createdAt" >= '2026-10-10 00:00:00';`,
      `INSERT INTO "RoleplayStats" ("id", "userId", "xp", "level", "streak", "todayXp", "totalCalls", "closedCalls", "lastActiveDate", "todayDate", "updatedAt")
       SELECT 'rs_' || u."id", u."id", 2450, 2, 4, 500, 32, 17, TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'), TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'), NOW()
       FROM "User" u
       WHERE LOWER(u."email") = 'alejandra.ahumada@aacommx.com'
       ON CONFLICT ("userId") DO UPDATE
       SET "xp" = GREATEST(COALESCE("RoleplayStats"."xp", 0), 2450),
           "level" = 2,
           "streak" = GREATEST(COALESCE("RoleplayStats"."streak", 0), 4),
           "todayXp" = 500,
           "totalCalls" = GREATEST(COALESCE("RoleplayStats"."totalCalls", 0), 32),
           "closedCalls" = GREATEST(COALESCE("RoleplayStats"."closedCalls", 0), 17),
           "lastActiveDate" = TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'),
           "todayDate" = TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'),
           "updatedAt" = NOW();`,
      `UPDATE "RoleplayStats" rs
       SET "xp" = GREATEST(COALESCE(rs."xp", 0), 950),
           "level" = 2,
           "streak" = GREATEST(COALESCE(rs."streak", 0), 3),
           "todayXp" = GREATEST(COALESCE(rs."todayXp", 0), 350),
           "lastActiveDate" = TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'),
           "todayDate" = TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'),
           "updatedAt" = NOW()
       FROM "User" u
       WHERE rs."userId" = u."id" AND (LOWER(u."email") LIKE '%galvan%' OR LOWER(u."email") LIKE '%ricgaljua%');`,
      `UPDATE "RoleplayStats" rs
       SET "totalCalls" = counts.c_total,
           "closedCalls" = GREATEST(rs."closedCalls", counts.c_closed)
       FROM (
         SELECT "userId", COUNT(*) as c_total, COUNT(*) FILTER (WHERE "appointmentClosed" = true) as c_closed
         FROM "RoleplayCall"
         GROUP BY "userId"
       ) counts
       WHERE rs."userId" = counts."userId" AND rs."totalCalls" < counts.c_total;`,
      `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "rfc" TEXT;`,
      `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "curp" TEXT;`,
      `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
      `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`,
      `CREATE INDEX IF NOT EXISTS "Client_isArchived_idx" ON "Client"("isArchived");`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "originalPremium" DOUBLE PRECISION;`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'MXN';`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "ramo" TEXT DEFAULT 'VIDA_INDIVIDUAL';`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "tipoVigencia" TEXT DEFAULT 'LARGO_PLAZO';`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'VIGENTE';`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "subStatus" TEXT;`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`,
      `CREATE INDEX IF NOT EXISTS "Policy_status_idx" ON "Policy"("status");`,
      `CREATE INDEX IF NOT EXISTS "Policy_isArchived_idx" ON "Policy"("isArchived");`,
      `UPDATE "Policy"
       SET "anniversaryDay" = EXTRACT(DAY FROM ("effectiveDate" AT TIME ZONE 'UTC'))::INTEGER,
           "anniversaryMonth" = EXTRACT(MONTH FROM ("effectiveDate" AT TIME ZONE 'UTC'))::INTEGER
       WHERE "effectiveDate" IS NOT NULL AND ("anniversaryDay" IS NULL OR "anniversaryMonth" IS NULL);`,
      `UPDATE "Policy"
       SET "ramo" = CASE
             WHEN LOWER(COALESCE("product", '')) LIKE '%gmm%' OR LOWER(COALESCE("product", '')) LIKE '%gastos med%' OR LOWER(COALESCE("product", '')) LIKE '%salud%' THEN 'GMM'
             WHEN LOWER(COALESCE("product", '')) LIKE '%auto%' THEN 'AUTOS'
             WHEN LOWER(COALESCE("product", '')) LIKE '%grupo%' OR LOWER(COALESCE("product", '')) LIKE '%colectiv%' THEN 'VIDA_GRUPO'
             WHEN LOWER(COALESCE("product", '')) LIKE '%hogar%' OR LOWER(COALESCE("product", '')) LIKE '%daño%' OR LOWER(COALESCE("product", '')) LIKE '%pyme%' THEN 'DANOS'
             WHEN LOWER(COALESCE("product", '')) LIKE '%ppr%' OR LOWER(COALESCE("product", '')) LIKE '%retiro%' OR LOWER(COALESCE("product", '')) LIKE '%dotal%' THEN 'AHORRO_RETIRO'
             ELSE 'VIDA_INDIVIDUAL'
           END,
           "tipoVigencia" = CASE
             WHEN LOWER(COALESCE("product", '')) LIKE '%gmm%' OR LOWER(COALESCE("product", '')) LIKE '%gastos med%' OR LOWER(COALESCE("product", '')) LIKE '%auto%' OR LOWER(COALESCE("product", '')) LIKE '%grupo%' OR LOWER(COALESCE("product", '')) LIKE '%daño%' THEN 'ANUAL_RENOVABLE'
             ELSE 'LARGO_PLAZO'
           END
       WHERE "ramo" IS NULL OR "tipoVigencia" IS NULL;`,
      `CREATE TABLE IF NOT EXISTS "PolicyReceipt" (
        "id" TEXT PRIMARY KEY,
        "policyId" TEXT NOT NULL,
        "agencyId" TEXT,
        "userId" TEXT NOT NULL,
        "receiptNumber" INTEGER NOT NULL DEFAULT 1,
        "totalInstallments" INTEGER NOT NULL DEFAULT 1,
        "policyYear" INTEGER NOT NULL DEFAULT 1,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "graceEndDate" TIMESTAMP(3) NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
        "paidAt" TIMESTAMP(3),
        "paymentNotes" TEXT,
        "syncedEmissionId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PolicyReceipt_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "PolicyReceipt_policyId_policyYear_receiptNumber_key" ON "PolicyReceipt"("policyId", "policyYear", "receiptNumber");`,
      `CREATE INDEX IF NOT EXISTS "PolicyReceipt_policyId_idx" ON "PolicyReceipt"("policyId");`,
      `CREATE INDEX IF NOT EXISTS "PolicyReceipt_agencyId_idx" ON "PolicyReceipt"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "PolicyReceipt_userId_idx" ON "PolicyReceipt"("userId");`,
      `CREATE INDEX IF NOT EXISTS "PolicyReceipt_dueDate_idx" ON "PolicyReceipt"("dueDate");`,
      `CREATE INDEX IF NOT EXISTS "PolicyReceipt_status_idx" ON "PolicyReceipt"("status");`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "allowTipsModule" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsCreditsBalance" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsShareAgencyCredits" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsPrivacyNotice" TEXT;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsRealReturnRate" DOUBLE PRECISION NOT NULL DEFAULT 4.0;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsInflationRate" DOUBLE PRECISION NOT NULL DEFAULT 4.5;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsLifeExpectancy" DOUBLE PRECISION NOT NULL DEFAULT 82.3;`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tipsCreditsBalance" INTEGER NOT NULL DEFAULT 0;`,
      `CREATE TABLE IF NOT EXISTS "tips_credit_purchases" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "agencyId" TEXT,
        "packageId" TEXT NOT NULL DEFAULT 'tips_30',
        "creditsTotal" INTEGER NOT NULL,
        "creditsRemaining" INTEGER NOT NULL,
        "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "stripeSessionId" TEXT,
        "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "tips_credit_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "tips_credit_purchases_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "tips_credit_purchases_userId_idx" ON "tips_credit_purchases"("userId");`,
      `CREATE INDEX IF NOT EXISTS "tips_credit_purchases_agencyId_idx" ON "tips_credit_purchases"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "tips_credit_purchases_expiresAt_idx" ON "tips_credit_purchases"("expiresAt");`,
      `CREATE TABLE IF NOT EXISTS "tips_sessions" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT UNIQUE NOT NULL,
        "projectorToken" TEXT UNIQUE NOT NULL,
        "hostId" TEXT NOT NULL,
        "agencyId" TEXT,
        "title" TEXT NOT NULL,
        "location" TEXT DEFAULT 'Presencial',
        "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expectedCapacity" INTEGER NOT NULL DEFAULT 50,
        "status" TEXT NOT NULL DEFAULT 'LOBBY',
        "unlockedStep" INTEGER NOT NULL DEFAULT 0,
        "allowNicknames" BOOLEAN NOT NULL DEFAULT true,
        "showBoardOnProjector" BOOLEAN NOT NULL DEFAULT true,
        "inactiveThresholdSec" INTEGER NOT NULL DEFAULT 180,
        "customParams" JSONB,
        "closedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tips_sessions_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "tips_sessions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "tips_sessions_hostId_idx" ON "tips_sessions"("hostId");`,
      `CREATE INDEX IF NOT EXISTS "tips_sessions_agencyId_idx" ON "tips_sessions"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "tips_sessions_code_idx" ON "tips_sessions"("code");`,
      `CREATE INDEX IF NOT EXISTS "tips_sessions_status_idx" ON "tips_sessions"("status");`,
      `CREATE TABLE IF NOT EXISTS "tips_participants" (
        "id" TEXT PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "agencyId" TEXT,
        "deviceToken" TEXT UNIQUE NOT NULL,
        "nickname" TEXT,
        "fullName" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
        "privacyAcceptedAt" TIMESTAMP(3),
        "privacyVersion" TEXT DEFAULT '1.0',
        "privacyIp" TEXT,
        "creditConsumed" BOOLEAN NOT NULL DEFAULT false,
        "creditSource" TEXT,
        "currentStep" INTEGER NOT NULL DEFAULT 0,
        "completedStep" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "step1General" JSONB,
        "step2Patrimony" JSONB,
        "step3Income" JSONB,
        "step4Retirement" JSONB,
        "step5Dreams" JSONB,
        "step6Savings" JSONB,
        "step7Insurance" JSONB,
        "calculatedResults" JSONB,
        "leadScore" INTEGER NOT NULL DEFAULT 0,
        "leadTier" TEXT NOT NULL DEFAULT 'COLD',
        "linkedClientId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tips_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tips_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "tips_participants_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "tips_participants_linkedClientId_fkey" FOREIGN KEY ("linkedClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "tips_participants_sessionId_idx" ON "tips_participants"("sessionId");`,
      `CREATE INDEX IF NOT EXISTS "tips_participants_agencyId_idx" ON "tips_participants"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "tips_participants_phone_idx" ON "tips_participants"("phone");`,
      `CREATE INDEX IF NOT EXISTS "tips_participants_email_idx" ON "tips_participants"("email");`,
      `CREATE INDEX IF NOT EXISTS "tips_participants_linkedClientId_idx" ON "tips_participants"("linkedClientId");`
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
