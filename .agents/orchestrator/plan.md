# Plan — AACOM Codebase Audit

## Objective
Execute a comprehensive, strictly READ-ONLY audit of the AACOM Next.js/Prisma/PostgreSQL codebase and produce `audit_report_final.md` at workspace root containing detailed citations for:
1. Redundancias de Datos
2. Cuellos de Botella y Procesos Ociosos (Rendimiento)

## Audit Scope & Milestones

| # | Milestone | Scope | Assigned Agent | Status |
|---|-----------|-------|----------------|--------|
| 1 | DB Schema & Query Audit | `prisma/schema.prisma`, Prisma queries, unindexed queries, data model redundancy, unnormalized attributes, duplicate data storage | `teamwork_preview_explorer` (Explorer DB) | PLANNED |
| 2 | Backend & API Performance Audit | API routes (`src/app/api` / `pages/api`), server actions, middleware, background workers/jobs, idle processes, heavy sync loops | `teamwork_preview_explorer` (Explorer Backend) | PLANNED |
| 3 | Frontend & Rendering Audit | Next.js components (`src/components`, `src/app`), page fetching, state duplication, client render bottlenecks, bloated imports, unnecessary re-renders | `teamwork_preview_explorer` (Explorer Frontend) | PLANNED |
| 4 | Audit Report Generation | Synthesize findings into `audit_report_final.md` at workspace root adhering strictly to required sections and explicit file path citations | `teamwork_preview_worker` (Worker Report) | PLANNED |
| 5 | Review & Read-Only Integrity Gate | Review `audit_report_final.md` completeness, verify non-modification of application source code (git status clean) | `teamwork_preview_reviewer` (Reviewer Audit) | PLANNED |

## Guidelines & Constraints
- READ-ONLY: No modifications to `.ts`, `.tsx`, `.prisma`, `.json` or any app source file.
- Strict git status clean requirement.
- Explicit citations (file path + line/component reference) for all findings in `audit_report_final.md`.
