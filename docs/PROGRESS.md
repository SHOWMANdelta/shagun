# Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

## 15-Line Plan and Risk Assessment
1. Plan Phase 1: Scaffold pnpm monorepo workspace (client, server), configuration, gitattributes, linting, env validation, Vite proxy, and health check.
2. Plan Phase 2: Design raw SQL migrations (tables, constraints, triggers, views), deterministic seed, type parsers, and verification script.
3. Plan Phase 3: Implement session-based auth with connect-pg-simple, rate limiting, lockout, and comprehensive RBAC matrix test suite.
4. Plan Phase 4: Build academic setup (programs, batches, subjects, promotions) and student/faculty management with CSV preview/confirm import.
5. Plan Phase 5: Develop attendance tracking with IST date handling, edit window rule, atomic bulk save, roster view, and register exports.
6. Plan Phase 6: Build notices module with multi-level targeting (role, batch, semester), expiry logic, unread tracking, and search.
7. Plan Phase 7: Implement marks entry grid, 10-point scale grading, SGPA calculation, published-only student visibility, and reports.
8. Plan Phase 8: Construct responsive institutional UI dashboards for Admin, Faculty, and Student, settings panel, and audit trail viewer.
9. Plan Phase 9: Implement production build, unified server SPA hosting, graceful shutdown, request logging, and query timing checks.
10. Plan Phase 10: Complete comprehensive viva documentation, SRS, architecture diagrams, data dictionary, manual, and test reports.
11. Risk 1 (Database Provider): Switching from Supabase to alternative PostgreSQL (Neon / local Postgres) requires robust connection and SSL management.
12. Risk 2 (IST Timezone Boundary): Late-night attendance marking could drift across days; strictly normalize all calendar dates to Asia/Kolkata.
13. Risk 3 (Data Precision): Postgres int8 and numeric types serialize as strings in pg driver; must register custom type parsers upfront.
14. Risk 4 (Concurrency in Attendance/Marks): Race conditions on rapid attendance submits; resolve using transaction isolation and ON CONFLICT.
15. Risk 5 (Authorisation Leakage): Unauthorised queries leaking existence; enforce strict 3-tier checks returning 404 for inaccessible foreign records.

## Status Log
- Current Phase: Phase 1 - Scaffold and Preflight
- Done:
  - Git repository initialized with .gitattributes and LF normalization.
  - pnpm workspace established with `client` (Vite, React, Tailwind, Lucide, Recharts) and `server` (Express, TypeScript, pg, session, helmet, pino).
  - All workspace dependencies installed and build scripts approved (`pnpm approve-builds --all`).
  - Strict TypeScript compilation configured and passing (`pnpm -r typecheck` -> 0 errors).
  - Linting configured and passing (`pnpm -r lint` -> 0 errors).
  - Environment schema and validation created; secure SESSION_SECRET generated and written to `.env`.
  - Vite API proxy configured (`/api` -> `http://localhost:4000`).
  - `/api/health` endpoint implemented in Express.
- Decisions: Documented in docs/DECISIONS.md.
- Open Issues: Blocked on Phase 1 secret (`DATABASE_URL`). Awaiting PostgreSQL connection URI in `.env`.
- Next Command: Once `DATABASE_URL` is provided, execute the Phase 1 Gate check.
