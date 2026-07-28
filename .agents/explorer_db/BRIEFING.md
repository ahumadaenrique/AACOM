# BRIEFING — 2026-07-28T04:34:10Z

## Mission
Audit database schema (`prisma/schema.prisma` or similar) and Prisma query usages across the AACOM codebase for data redundancies, missing indexes, N+1 queries, and performance bottlenecks.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Database & Prisma Schema Explorer
- Working directory: c:\Proyectos Antigravity\Google Antigravity\aacom-25\.agents\explorer_db
- Original parent: ef8e8aeb-b75f-4874-bc99-b0b964f58794
- Milestone: Codebase Audit - Database & Prisma Schema

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or edit application source code/schemas.
- Produce structured findings in `analysis_db.md` and `handoff.md`.
- Keep heartbeat updated in `progress.md`.

## Current Parent
- Conversation ID: ef8e8aeb-b75f-4874-bc99-b0b964f58794
- Updated: 2026-07-28T04:34:10Z

## Investigation State
- **Explored paths**: `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/app/actions.ts`, `src/app/(dashboard)/*`, `src/app/api/*`.
- **Key findings**:
  1. Over 25 models lack `@index` on foreign keys (`agencyId`, `userId`, `clientId`, etc.), causing full table scans in PostgreSQL.
  2. Data redundancies: triplicated branding in `Agency`/`User`/`CompanyProfile`, duplicated voice balances in `User`, disconnected email-based tables in Cédula A.
  3. Query anti-patterns: un-scoped `knowledgeAsset.findMany()`, N+1 loops in CSV imports and daily plans, in-memory `.reduce()` on unpaginated queries, and serverless PrismaClient re-instantiation in production.
- **Unexplored areas**: None, full audit completed.

## Key Decisions Made
- Audited all 35 Prisma models and query usages across app actions, cron routes, and dashboards.
- Synthesized findings into `analysis_db.md` and `handoff.md`.

## Artifact Index
- `.agents/explorer_db/ORIGINAL_REQUEST.md` — Original prompt request.
- `.agents/explorer_db/BRIEFING.md` — Current briefing.
- `.agents/explorer_db/progress.md` — Progress & heartbeat log.
- `.agents/explorer_db/analysis_db.md` — Comprehensive Database & Prisma Audit Report.
- `.agents/explorer_db/handoff.md` — Final Handoff report.
