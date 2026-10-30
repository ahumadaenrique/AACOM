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
      `CREATE TABLE IF NOT EXISTS "Project200Contact" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "agencyId" TEXT,
        "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "relationship" TEXT NOT NULL,
        "estimatedSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "closingProbability" TEXT NOT NULL DEFAULT 'MEDIA',
        "classification" TEXT NOT NULL DEFAULT 'PROSPECTO',
        "disqualificationReason" TEXT,
        "status" TEXT NOT NULL DEFAULT 'POR_CONTACTAR',
        "priorityScore" INTEGER NOT NULL DEFAULT 50,
        "attemptsCount" INTEGER NOT NULL DEFAULT 0,
        "lastAttemptAt" TIMESTAMP(3),
        "nextActionAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "scheduledMeetingAt" TIMESTAMP(3),
        "source" TEXT NOT NULL DEFAULT 'EXCEL',
        "referredByName" TEXT,
        "surveyReferralId" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Project200Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Project200Contact_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "Project200Contact_userId_idx" ON "Project200Contact"("userId");`,
      `CREATE INDEX IF NOT EXISTS "Project200Contact_agencyId_idx" ON "Project200Contact"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "Project200Contact_classification_idx" ON "Project200Contact"("classification");`,
      `CREATE INDEX IF NOT EXISTS "Project200Contact_status_idx" ON "Project200Contact"("status");`,
      `CREATE INDEX IF NOT EXISTS "Project200Contact_priorityScore_idx" ON "Project200Contact"("priorityScore");`,
      `CREATE TABLE IF NOT EXISTS "Project200Log" (
        "id" TEXT PRIMARY KEY,
        "contactId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "agencyId" TEXT,
        "actionType" TEXT NOT NULL,
        "outcome" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Project200Log_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Project200Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Project200Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Project200Log_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "Project200Log_contactId_idx" ON "Project200Log"("contactId");`,
      `CREATE INDEX IF NOT EXISTS "Project200Log_userId_idx" ON "Project200Log"("userId");`,
      `CREATE INDEX IF NOT EXISTS "Project200Log_agencyId_idx" ON "Project200Log"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "Project200Log_createdAt_idx" ON "Project200Log"("createdAt");`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "maxAdmins" INTEGER DEFAULT 2;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "allowAcademyModule" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "Agency" ALTER COLUMN "allowAcademyModule" SET DEFAULT true;`,
      `UPDATE "Agency" SET "allowAcademyModule" = true WHERE "allowAcademyModule" = false OR "allowAcademyModule" IS NULL;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "shareAacomAcademyVideos" BOOLEAN DEFAULT false;`,
      `CREATE TABLE IF NOT EXISTS "AcademyVideo" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "youtubeUrl" TEXT NOT NULL,
        "youtubeId" TEXT NOT NULL,
        "thumbnailUrl" TEXT,
        "category" TEXT NOT NULL DEFAULT 'General',
        "duration" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "isAacomOfficial" BOOLEAN NOT NULL DEFAULT false,
        "agencyId" TEXT NOT NULL,
        "createdById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AcademyVideo_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AcademyVideo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "AcademyVideo_agencyId_idx" ON "AcademyVideo"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "AcademyVideo_category_idx" ON "AcademyVideo"("category");`,
      `CREATE INDEX IF NOT EXISTS "AcademyVideo_createdAt_idx" ON "AcademyVideo"("createdAt");`,
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
       SET "xpEarned" = LEAST(500, FLOOR("score" * 1.5)::INTEGER + CASE WHEN "appointmentClosed" = true THEN 50 ELSE 0 END)
       WHERE "score" > 0
         AND COALESCE("xpEarned", 0) = 0
         AND ("createdAt" AT TIME ZONE 'America/Mexico_City')::date = (NOW() AT TIME ZONE 'America/Mexico_City')::date;`,
      `UPDATE "RoleplayStats" rs
       SET "todayXp" = LEAST(500, COALESCE(today_summary.xp_today, 0)),
           "todayCallsCount" = COALESCE(today_summary.calls_today, 0),
           "todayDate" = TO_CHAR(NOW() AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD')
       FROM (
         SELECT u."id" AS "userId",
                SUM(COALESCE(rc."xpEarned", 0)) FILTER (
                  WHERE (rc."createdAt" AT TIME ZONE 'America/Mexico_City')::date = (NOW() AT TIME ZONE 'America/Mexico_City')::date
                )::INTEGER AS xp_today,
                COUNT(rc."id") FILTER (
                  WHERE (rc."createdAt" AT TIME ZONE 'America/Mexico_City')::date = (NOW() AT TIME ZONE 'America/Mexico_City')::date
                )::INTEGER AS calls_today
         FROM "User" u
         LEFT JOIN "RoleplayCall" rc ON rc."userId" = u."id"
         GROUP BY u."id"
       ) today_summary
       WHERE rs."userId" = today_summary."userId";`,
      `UPDATE "RoleplayStats" rs
       SET "totalCalls" = counts.c_total,
           "closedCalls" = GREATEST(rs."closedCalls", counts.c_closed),
           "xp" = GREATEST(rs."xp", counts.total_xp),
           "streak" = CASE
             WHEN counts.active_days > rs."streak" THEN counts.active_days
             WHEN rs."streak" = 0 AND counts.c_total > 0 THEN 1
             ELSE rs."streak"
           END
       FROM (
         SELECT "userId",
                COUNT(*)::INTEGER as c_total,
                COUNT(*) FILTER (WHERE "appointmentClosed" = true)::INTEGER as c_closed,
                COALESCE(SUM("xpEarned"), 0)::INTEGER as total_xp,
                COUNT(DISTINCT ("createdAt" AT TIME ZONE 'America/Mexico_City')::date) FILTER (
                  WHERE "createdAt" >= NOW() - INTERVAL '7 days' AND "durationSeconds" >= 15
                )::INTEGER as active_days
         FROM "RoleplayCall"
         GROUP BY "userId"
       ) counts
       WHERE rs."userId" = counts."userId";`,
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
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsShareAgencyCredits" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "Agency" ALTER COLUMN "tipsShareAgencyCredits" SET DEFAULT false;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "tipsAllowedAgentIds" TEXT;`,
      `UPDATE "Agency" SET "tipsShareAgencyCredits" = false WHERE "tipsAllowedAgentIds" IS NULL;`,
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
      `CREATE INDEX IF NOT EXISTS "tips_participants_linkedClientId_idx" ON "tips_participants"("linkedClientId");`,
      `CREATE TABLE IF NOT EXISTS "market_cg_documents" (
        "id" TEXT PRIMARY KEY,
        "fileKey" TEXT UNIQUE NOT NULL,
        "aseguradora" TEXT NOT NULL,
        "ramo" TEXT NOT NULL,
        "producto" TEXT NOT NULL,
        "year" INTEGER NOT NULL DEFAULT 2025,
        "productPageUrl" TEXT,
        "downloadUrl" TEXT,
        "notes" TEXT,
        "charCount" INTEGER NOT NULL DEFAULT 0,
        "chunkCount" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "isGlobalAuthorized" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS "market_cg_documents_aseguradora_idx" ON "market_cg_documents"("aseguradora");`,
      `CREATE INDEX IF NOT EXISTS "market_cg_documents_ramo_idx" ON "market_cg_documents"("ramo");`,
      `CREATE INDEX IF NOT EXISTS "market_cg_documents_active_idx" ON "market_cg_documents"("active");`,
      `CREATE INDEX IF NOT EXISTS "market_cg_documents_isGlobalAuthorized_idx" ON "market_cg_documents"("isGlobalAuthorized");`,
      `CREATE TABLE IF NOT EXISTS "market_cg_chunks" (
        "id" TEXT PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "chunkIndex" INTEGER NOT NULL DEFAULT 0,
        "aseguradora" TEXT NOT NULL,
        "ramo" TEXT NOT NULL,
        "producto" TEXT NOT NULL,
        "year" INTEGER NOT NULL DEFAULT 2025,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "market_cg_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "market_cg_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "market_cg_chunks_documentId_idx" ON "market_cg_chunks"("documentId");`,
      `CREATE INDEX IF NOT EXISTS "market_cg_chunks_aseguradora_idx" ON "market_cg_chunks"("aseguradora");`,
      `CREATE INDEX IF NOT EXISTS "market_cg_chunks_fts_idx" ON "market_cg_chunks" USING GIN (to_tsvector('spanish', "aseguradora" || ' ' || "producto" || ' ' || "content"));`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "allowProyecto200Module" BOOLEAN NOT NULL DEFAULT false;`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referidorCommissionPct" DOUBLE PRECISION DEFAULT 30;`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referidorBonusPct" DOUBLE PRECISION DEFAULT 0;`,
      `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "allowCorporateEmailModule" BOOLEAN NOT NULL DEFAULT false;`,
      `CREATE TABLE IF NOT EXISTS "agency_email_subscriptions" (
        "id" TEXT PRIMARY KEY,
        "agencyId" TEXT UNIQUE NOT NULL,
        "domainName" TEXT UNIQUE NOT NULL,
        "registrarOrderId" TEXT,
        "titanOrderId" TEXT,
        "maxSeats" INTEGER NOT NULL DEFAULT 20,
        "storageGbPerSeat" INTEGER NOT NULL DEFAULT 10,
        "wholesaleDomainCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 12.50,
        "monthlyPriceMxn" DOUBLE PRECISION NOT NULL DEFAULT 999,
        "billingMode" TEXT NOT NULL DEFAULT 'STRIPE',
        "stripeSubscriptionId" TEXT,
        "dnsConfigured" BOOLEAN NOT NULL DEFAULT true,
        "dnsRecordsJson" JSONB,
        "whoisCustodyProfile" TEXT NOT NULL DEFAULT 'AACOMSOFT_ZERO_TOUCH_PRIVACY',
        "status" TEXT NOT NULL DEFAULT 'active',
        "renewsAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "agency_email_subscriptions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "agency_email_subscriptions_agencyId_idx" ON "agency_email_subscriptions"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "agency_email_subscriptions_status_idx" ON "agency_email_subscriptions"("status");`,
      `CREATE TABLE IF NOT EXISTS "agency_mailboxes" (
        "id" TEXT PRIMARY KEY,
        "subscriptionId" TEXT NOT NULL,
        "agencyId" TEXT NOT NULL,
        "agentUserId" TEXT,
        "displayName" TEXT NOT NULL,
        "isDepartmental" BOOLEAN NOT NULL DEFAULT false,
        "emailAddress" TEXT UNIQUE NOT NULL,
        "titanAccountId" TEXT,
        "encryptedImapCredentials" TEXT NOT NULL,
        "storageUsedMb" INTEGER NOT NULL DEFAULT 120,
        "status" TEXT NOT NULL DEFAULT 'active',
        "releasedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "agency_mailboxes_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "agency_email_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "agency_mailboxes_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "agency_mailboxes_agentUserId_fkey" FOREIGN KEY ("agentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "agency_mailboxes_subscriptionId_idx" ON "agency_mailboxes"("subscriptionId");`,
      `CREATE INDEX IF NOT EXISTS "agency_mailboxes_agencyId_idx" ON "agency_mailboxes"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "agency_mailboxes_agentUserId_idx" ON "agency_mailboxes"("agentUserId");`,
      `CREATE INDEX IF NOT EXISTS "agency_mailboxes_status_idx" ON "agency_mailboxes"("status");`,
      `CREATE TABLE IF NOT EXISTS "agency_email_forwards" (
        "id" TEXT PRIMARY KEY,
        "subscriptionId" TEXT NOT NULL,
        "agencyId" TEXT NOT NULL,
        "sourceEmail" TEXT NOT NULL,
        "destinationEmail" TEXT NOT NULL,
        "formerAgentUserId" TEXT,
        "formerAgentName" TEXT,
        "titanForwardId" TEXT,
        "migratedMessagesCount" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "agency_email_forwards_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "agency_email_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "agency_email_forwards_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "agency_email_forwards_formerAgentUserId_fkey" FOREIGN KEY ("formerAgentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "agency_email_forwards_subscriptionId_idx" ON "agency_email_forwards"("subscriptionId");`,
      `CREATE INDEX IF NOT EXISTS "agency_email_forwards_agencyId_idx" ON "agency_email_forwards"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "agency_email_forwards_sourceEmail_idx" ON "agency_email_forwards"("sourceEmail");`,
      `CREATE TABLE IF NOT EXISTS "agency_domain_suggestions_cache" (
        "id" TEXT PRIMARY KEY,
        "agencyId" TEXT NOT NULL,
        "suggestedDomain" TEXT NOT NULL,
        "tld" TEXT NOT NULL,
        "isAvailable" BOOLEAN NOT NULL DEFAULT true,
        "wholesalePriceUsd" DOUBLE PRECISION NOT NULL DEFAULT 11.99,
        "isPremium" BOOLEAN NOT NULL DEFAULT false,
        "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "agency_domain_suggestions_cache_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "agency_domain_suggestions_cache_agency_domain_key" ON "agency_domain_suggestions_cache"("agencyId", "suggestedDomain");`,
      `CREATE INDEX IF NOT EXISTS "agency_domain_suggestions_cache_agencyId_idx" ON "agency_domain_suggestions_cache"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "agency_domain_suggestions_cache_checkedAt_idx" ON "agency_domain_suggestions_cache"("checkedAt");`,
      `CREATE TABLE IF NOT EXISTS "agency_email_messages" (
        "id" TEXT PRIMARY KEY,
        "agencyId" TEXT NOT NULL,
        "mailboxId" TEXT NOT NULL,
        "folder" TEXT NOT NULL DEFAULT 'INBOX',
        "fromAddress" TEXT NOT NULL,
        "fromName" TEXT,
        "toAddresses" TEXT NOT NULL,
        "ccAddresses" TEXT,
        "subject" TEXT NOT NULL,
        "snippet" TEXT,
        "bodyHtml" TEXT,
        "bodyText" TEXT,
        "attachmentsJson" JSONB,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "isStarred" BOOLEAN NOT NULL DEFAULT false,
        "relatedClientId" TEXT,
        "relatedPolicyId" TEXT,
        "migratedFrom" TEXT,
        "messageUid" TEXT,
        "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "agency_email_messages_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "agency_email_messages_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "agency_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "agency_email_messages_agencyId_idx" ON "agency_email_messages"("agencyId");`,
      `CREATE INDEX IF NOT EXISTS "agency_email_messages_mailbox_folder_idx" ON "agency_email_messages"("mailboxId", "folder");`,
      `CREATE INDEX IF NOT EXISTS "agency_email_messages_receivedAt_idx" ON "agency_email_messages"("receivedAt");`
    ];

    for (const q of queries) {
      await client.query(q);
      console.log(`Executed: ${q}`);
    }

    const cgCountRes = await client.query('SELECT COUNT(*)::int AS cnt FROM "market_cg_documents";');
    if ((cgCountRes.rows[0]?.cnt || 0) === 0) {
      const fs = require('fs');
      const path = require('path');
      const catalogPath = path.join(__dirname, 'market_cg_catalog.json');
      if (fs.existsSync(catalogPath)) {
        console.log('Seeding 604 Market Condiciones Generales into empty branch DB...');
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const BATCH = 40;
        for (let i = 0; i < catalog.length; i += BATCH) {
          const slice = catalog.slice(i, i + BATCH);
          const vals = [];
          const ph = [];
          let p = 1;
          for (const d of slice) {
            ph.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
            vals.push(d.id, d.fileKey, d.aseguradora, d.ramo, d.producto, d.year || 2025, d.productPageUrl || null, d.downloadUrl || null, d.notes || null, d.charCount || 0, d.chunkCount || 1);
          }
          await client.query(`INSERT INTO "market_cg_documents" ("id", "fileKey", "aseguradora", "ramo", "producto", "year", "productPageUrl", "downloadUrl", "notes", "charCount", "chunkCount", "active", "isGlobalAuthorized", "createdAt", "updatedAt") VALUES ${ph.join(', ')} ON CONFLICT ("fileKey") DO NOTHING;`, vals);

          const cVals = [];
          const cPh = [];
          let cp = 1;
          for (const d of slice) {
            if (d.previewChunk) {
              cPh.push(`($${cp++}, $${cp++}, 0, $${cp++}, $${cp++}, $${cp++}, $${cp++}, $${cp++}, CURRENT_TIMESTAMP)`);
              cVals.push(`${d.id}_c0`, d.id, d.aseguradora, d.ramo, d.producto, d.year || 2025, d.previewChunk);
            }
          }
          if (cPh.length > 0) {
            await client.query(`INSERT INTO "market_cg_chunks" ("id", "documentId", "chunkIndex", "aseguradora", "ramo", "producto", "year", "content", "createdAt") VALUES ${cPh.join(', ')} ON CONFLICT ("id") DO NOTHING;`, cVals);
          }
        }
        console.log('Seeded 604 Market Condiciones Generales successfully.');
      }
    }
    const initFlagRes = await client.query(`SELECT "value" FROM "Setting" WHERE "key" = 'market_cg_existing_agencies_insignia_init_v1';`);
    if (initFlagRes.rows.length === 0) {
      await client.query(`
        INSERT INTO "Setting" ("key", "value")
        SELECT 'market_cg_agency_insurers_' || a."id", '["Insignia Life"]'
        FROM "Agency" a
        WHERE a."id" <> 'aacom' AND COALESCE(a."slug", '') <> 'aacom'
        ON CONFLICT ("key") DO UPDATE SET "value" = '["Insignia Life"]';
      `);
      await client.query(`
        INSERT INTO "Setting" ("key", "value")
        VALUES ('market_cg_existing_agencies_insignia_init_v1', 'true')
        ON CONFLICT ("key") DO UPDATE SET "value" = 'true';
      `);
      console.log('Initialized existing non-AACOM agencies with ["Insignia Life"].');
    }

    const p200InitRes = await client.query(`SELECT "value" FROM "Setting" WHERE "key" = 'proyecto_200_aacom_only_init_v1';`);
    if (p200InitRes.rows.length === 0) {
      await client.query(`UPDATE "Agency" SET "allowProyecto200Module" = CASE WHEN "id" = 'aacom' OR COALESCE("slug", '') = 'aacom' THEN true ELSE false END;`);
      await client.query(`INSERT INTO "Setting" ("key", "value") VALUES ('proyecto_200_aacom_only_init_v1', 'true') ON CONFLICT ("key") DO UPDATE SET "value" = 'true';`);
      console.log('Initialized allowProyecto200Module = true ONLY for AACOM, false for all other agencies.');
    }

    const corpEmailInitRes = await client.query(`SELECT "value" FROM "Setting" WHERE "key" = 'corporate_email_aacom_only_init_v1';`);
    if (corpEmailInitRes.rows.length === 0) {
      await client.query(`UPDATE "Agency" SET "allowCorporateEmailModule" = CASE WHEN "id" = 'aacom' OR COALESCE("slug", '') = 'aacom' THEN true ELSE false END;`);
      await client.query(`INSERT INTO "Setting" ("key", "value") VALUES ('corporate_email_aacom_only_init_v1', 'true') ON CONFLICT ("key") DO UPDATE SET "value" = 'true';`);
      console.log('Initialized allowCorporateEmailModule = true ONLY for AACOM, false for all other agencies.');
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
