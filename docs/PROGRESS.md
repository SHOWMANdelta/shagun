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
- Current Phase: COMPLETE (Phases 1-9 done; Phase 10 core docs done, viva pack optional)
- Done:
  - Phase 1: pnpm workspace scaffold, strict TS, lint, env validation, health check, database configured.
  - Phase 2: 6 numbered SQL migrations (erp schema), triggers, deterministic seed, db reset/verify commands.
  - Phase 3: Session auth, lockout, rate limiting, CSRF header guard, RBAC matrix tests.
  - Phase 4: Students + faculty management, CSV preview/confirm import, academic setup endpoints.
  - Phase 5: Attendance roster, atomic bulk save via ON CONFLICT, IST date handling, 7-day faculty edit window.
  - Phase 6: Notices with role/batch/semester targeting, expiry, unread tracking, audience-scoped listing.
  - Phase 7: Marks entry with max-marks trigger, publication flow, SGPA and grading.
  - Phase 8: Role-based dashboards (admin/faculty/student), settings, audit viewer.
  - Phase 9: `pnpm build` passes; Express serves the Vite SPA from client/dist; login, session, dashboard stats, students list and SPA deep routes verified over HTTP on the production build.
- Key decisions: see docs/DECISIONS.md.
- Verification record (2026-11-02):
  - `pnpm typecheck` - pass (0 errors, both packages).
  - `pnpm lint` - pass (0 errors, both packages).
  - `pnpm --filter server test` - 6 files / 32 tests passed.
  - `pnpm --filter client test` - 1 file / 1 test passed.
  - `pnpm build` - pass (client bundle with self-hosted fonts; server tsc).
  - Production e2e: `/api/health` 200, `/` 200, deep route `/notices` 200, admin login + `me` + `/api/dashboard/stats` 200, `GET /api/students` 200.
- Open Issues:
  - Remote Postgres latency shows slow-query warnings (200ms-3s) during tests; expected for a network-hosted database, not a code defect.
  - One transient test failure earlier was environmental (network drop killed the DB connection mid-suite); suite passed on re-run.
- Next Command: `pnpm dev` for the demo, or `pnpm build; pnpm start` for production mode.
