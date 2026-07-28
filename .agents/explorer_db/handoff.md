# Handoff Report — Database & Prisma Schema Audit (`explorer_db`)

**Agent:** `explorer_db`  
**Working Directory:** `c:\Proyectos Antigravity\Google Antigravity\aacom-25\.agents\explorer_db`  
**Workspace Root:** `c:\Proyectos Antigravity\Google Antigravity\aacom-25`  
**Date:** 2026-07-28  

---

## 1. Observation

Direct observations and evidence gathered during the codebase audit:

- **Schema Index Deficit**:
  - In `prisma/schema.prisma` (843 lines, 35 models), foreign key relations (e.g. `User.agencyId`, `Client.agencyId`, `Policy.agencyId`, `Policy.clientId`, `ActivityLog.agencyId`, `ActivityLog.userId`, `Ticket.userId`, `DraftPost.aiAgentId`) lack explicit `@index` directives. PostgreSQL does NOT automatically index foreign key columns in Prisma schemas.
  - In `prisma/schema.prisma`:
    - Line 96: `User.agencyId` -> No `@index([agencyId])`.
    - Line 232: `Client.agencyId` -> No `@index([agencyId])`.
    - Line 275: `Policy.clientId` -> No `@index([clientId])`.
    - Line 413: `ActivityLog.userId` & `dateStr` -> No `@index([userId])` or `@index([dateStr])`.
    - Line 722: `ExamenIntento.email` -> No `@index([email])`.

- **Data Redundancies & Overlapping Models**:
  - **Branding properties triplication**: `Agency` (lines 35-37: `logoUrl`, `primaryColor`, `secondaryColor`), `User` (lines 129-130: `brandColor`, `brandLogo`), and `CompanyProfile` (lines 639-641: `primaryColor`, `secondaryColor`, `logoUrl`).
  - **Voice balance duplication**: `User.voiceSecondsBalance` (line 148) vs `User.freeSecondsBalance` (line 187).
  - **Unlinked email keys**: Models `preguntas`, `estudio_progreso`, `examen_intentos`, `estudio_licencias`, `promotor_saldos` (lines 696-751) map directly to raw email strings rather than foreign key relations with `User.id`.
  - **Base64 in database**: `AdnDiagnostic.evidenciaBase64` (line 401) stores raw base64 string images inside table rows.

- **Query Performance Bottlenecks**:
  - **Unscoped database fetch**: `src/app/api/agents/chat/route.ts` line 239: `const knowledgeAssets = await prisma.knowledgeAsset.findMany()` has no `where` clause, fetching all global assets across all agents on every message.
  - **N+1 query loops**: CSV import in `src/app/(dashboard)/cartera/actions.ts` lines 370-419 executes `findFirst` and `create` inside a `for...of` loop over `parsedData` without batching/transaction. `saveDailyPlan` in `src/app/actions.ts` lines 1408-1446 executes 14 sequential `upsert` calls in a `for` loop.
  - **Unpaginated queries with in-memory JS processing**: `src/app/(dashboard)/admin/cartera/page.tsx` line 26 fetches all clients and policies for an agency, using JS `.reduce()` for global metrics instead of database aggregates. `src/app/(dashboard)/pea-prp/actions.ts` line 36 fetches all activity logs to sum `.points` in JS.
  - **Schema type mismatch**: `src/app/api/cron/daily-plan-report/route.ts` line 67 tries to parse `DailyRecord.planned` as a JSON object, whereas `DailyRecord.planned` in `prisma/schema.prisma` line 221 is an `Int`.
  - **Connection pool risk**: `src/lib/prisma.ts` line 11 skips caching `PrismaClient` in `globalForPrisma` when `NODE_ENV === "production"`.

---

## 2. Logic Chain

1. **Foreign Key Indexing in Prisma / PostgreSQL**:
   - Observation: Prisma schema maps foreign keys with `fields: [foreignKeyId]`, but omits `@index`.
   - Fact: PostgreSQL foreign key constraints enforce referential integrity but do NOT create B-Tree indexes automatically on the foreign key column.
   - Inference: Filtering by `agencyId`, `userId`, `clientId`, or performing JOINs and CASCADE DELETEs requires PostgreSQL to perform full table sequential scans. As table rows increase (e.g. ActivityLogs or Policies), query response times degrade exponentially from O(log N) to O(N).

2. **Data Redundancies & Maintenance Overhead**:
   - Observation: Multiple fields store branding colors and logos in `Agency`, `User`, and `CompanyProfile`; two fields store voice balance in `User`.
   - Inference: Developers modifying branding or voice balance in one place risk leaving stale/mismatched data in another, creating UI bugs and inconsistent user quota tracking.

3. **In-Memory JavaScript Aggregation vs SQL Engine**:
   - Observation: Action functions and pages execute `prisma.<model>.findMany()` without `take`/`skip` or `select`, then apply `.reduce()` and `.filter()` in Node.js.
   - Inference: Fetching large datasets over the network into Node.js memory consumes serverless memory, increases network payload size, and bypasses database engine indexing and query optimizer capabilities.

4. **N+1 Operations & Serverless Connection Pooling**:
   - Observation: Sequential queries run in `for...of` loops without `$transaction` or `createMany`. `PrismaClient` is re-instantiated on every request in production.
   - Inference: Bulk imports or high request concurrency will exhaust the PostgreSQL connection pool limit on Vercel/Supabase, resulting in request timeouts and database connection errors (`P1001` / `Too many connections`).

---

## 3. Caveats

- **Read-Only Scope**: No database migrations or schema files were executed or modified during this investigation.
- **Production Data Volume**: Evaluation of table sizes was performed based on static schema inspection and query pattern logic; live production table row counts were not measured directly.
- **SQLite Legacy Comments**: Comments in `schema.prisma` (e.g., lines 10, 303) refer to SQLite limitations, though the datasource provider is PostgreSQL (`provider = "postgresql"`).

---

## 4. Conclusion

The AACOM database schema and query layer contain critical performance, indexing, and structural vulnerabilities. The most urgent action items are:
1. Adding `@index` to all foreign key columns (`agencyId`, `userId`, `clientId`, `sellerId`, `aiAgentId`, `email`) in `prisma/schema.prisma`.
2. Scoping `KnowledgeAsset.findMany()` in `src/app/api/agents/chat/route.ts`.
3. Fixing `PrismaClient` global singleton caching in `src/lib/prisma.ts` for production serverless deployment.
4. Replacing in-memory `.reduce()` calls with `prisma.aggregate` / `prisma.count` and batching bulk loops into `$transaction` or bulk queries.

Detailed findings with code snippets and line references are documented in `c:\Proyectos Antigravity\Google Antigravity\aacom-25\.agents\explorer_db\analysis_db.md`.

---

## 5. Verification Method

To independently verify these findings:
1. **Inspect Prisma Schema**: Open `prisma/schema.prisma` and check lines 96, 232, 275, 413, 722 for missing `@index` annotations on foreign key fields.
2. **Inspect Query Files**:
   - Open `src/app/api/agents/chat/route.ts:239` to verify un-scoped `knowledgeAsset.findMany()`.
   - Open `src/app/(dashboard)/admin/cartera/page.tsx:26` to verify unpaginated `client.findMany()` and JS `.reduce()`.
   - Open `src/app/(dashboard)/cartera/actions.ts:370-419` to verify CSV import N+1 loop.
   - Open `src/lib/prisma.ts:11` to verify production singleton bypass.
3. **Execute Prisma Validation / Lint**:
   - Run `npx prisma validate` in terminal to confirm schema syntax validity.
