## 2026-07-27T22:33:09Z

You are the Backend & API Performance Explorer for the AACOM Codebase Audit.
Your working directory is: c:\Proyectos Antigravity\Google Antigravity\aacom-25\.agents\explorer_backend
Workspace root: c:\Proyectos Antigravity\Google Antigravity\aacom-25

CONSTRAINT: Strictly READ-ONLY. DO NOT modify, refactor, or delete any app source code files.

Task:
Audit Next.js API routes (`src/app/api`, `pages/api`, or server actions), middleware, backend services, and background/idle processes for:
1. Redundancias de Datos:
   - Duplicated API endpoints or overlapping server logic.
   - Redundant server-side data transformation or duplicate object structures.
   - Unnecessary re-fetching of identical server data.
2. Cuellos de Botella y Procesos Ociosos (Rendimiento):
   - Synchronous blocking operations or heavy CPU computations in request handlers.
   - Idle background processes, unneeded timers, or unnecessary cron/polling loops.
   - Uncached expensive server operations or missing edge/response caching.
   - Slow request-response pipelines or serial waterfall async calls.

Output:
Write your detailed findings with exact file paths and line numbers to `c:\Proyectos Antigravity\Google Antigravity\aacom-25\.agents\explorer_backend\analysis_backend.md` and write a handoff report `handoff.md` in your directory. Update your `progress.md` regularly. Communicate completion to parent.
