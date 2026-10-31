# Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

## Project Conventions and Architectural Standards

### 1. Technology Stack
- Runtime: Node.js 20+ LTS with TypeScript in strict mode across workspace packages.
- Monorepo: pnpm workspace with client/ and server/ directories; root-level proxy scripts.
- Database: PostgreSQL (Neon / cloud / local Postgres alternative to Supabase), accessed via plain `pg` driver using parameterised SQL queries.
- ORM Policy: Strict zero-ORM rule. Migrations written in plain `.sql` files executed via custom runner.
- Backend API: Express with JSON under `/api`, Zod schema validation, `express-session` with `connect-pg-simple` (httpOnly cookie, Postgres session store), `bcryptjs` (cost factor 12), `helmet`, `express-rate-limit`, `pino`, and `pino-http`.
- Frontend Web: React with Vite, React Router, TanStack Query, React Hook Form with Zod, Tailwind CSS with custom design tokens, Lucide React, Recharts, and self-hosted fonts via `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono`.

### 2. Server Architecture
- Directory layout:
  - `server/src/config/env.ts`: Zod-validated environment variables with early exit.
  - `server/src/db/`: Connection pool, transaction helper (`withTransaction`), migration runner, verification, seed.
  - `server/src/middleware/`: Request ID, authentication, RBAC, input validation, 404 handler, central error handler.
  - `server/src/modules/<feature>/`: Feature-scoped routes, service, repo, and Zod schemas.
  - `server/src/utils/`: AppError, IST date helpers, pagination utilities, CSV parser/formatter.
  - `server/src/app.ts`: `buildApp()` without `listen()` for Supertest integration.
  - `server/src/index.ts`: Application entry point with SIGINT/SIGTERM graceful pool draining.
- Layering constraints:
  - Routes parse and validate HTTP inputs.
  - Services orchestrate business logic, transactions, and authorisation.
  - Repositories exclusively contain parameterized SQL queries. Zero SQL outside repos; zero business rules inside repos.
- API standard:
  - Success response envelope: `{ data, meta }`
  - Error response envelope: `{ error: { code, message, details, requestId } }`
  - Postgres error mappings: 23505 -> 409 (Conflict), 23503 -> 409 (Foreign Key Conflict), 23514 -> 422 (Check Violation), 22P02 -> 400 (Bad Request). Unexpected exceptions return 500 with request ID and stripped stack traces.

### 3. Database Design Principles
- Normalization: Strictly Third Normal Form (3NF).
- Schema: Dedicated Postgres schema (`DB_SCHEMA`, default `erp`), never `public`.
- Primary keys: UUID via `gen_random_uuid()`.
- Timestamps: `timestamptz` for absolute instants, `date` for calendar days without time.
- Timezone: Asia/Kolkata (`UTC+05:30`) for all day calculations and SQL `now() AT TIME ZONE 'Asia/Kolkata'`.
- Deletion policy: Explicit `ON DELETE RESTRICT` for academic audit trails; soft deactivation via `is_active` / status flags.
- Audit trigger: Append-only `audit_log` with triggers blocking `UPDATE` and `DELETE`.
- Search path: Schema set on pool client connection; int8/numeric parsed as numbers; date parsed as `YYYY-MM-DD`.

### 4. Authentication, Authorization, and Security
- Account provisioning: Admin-created accounts; no open public registration.
- Identifiers: Enrollment number for students, employee code for faculty, `admin` for administrators.
- Passwords: Minimum 8 characters with at least one letter and one number; bcrypt cost 12. Account locks for 15 minutes after 5 consecutive failures.
- Sessions: Secure, httpOnly cookie with SameSite=Lax. Password changes invalidate concurrent active sessions.
- CSRF defense: Mutating requests require `X-Requested-With: erp` header.
- Three-tier authorization:
  1. Route level: `requireRole(...)` middleware.
  2. Service level: Ownership validation.
  3. Database query level: Tenant/assignment scoping. Inaccessible resources return 404 to avoid existence leakage.

### 5. UI and Frontend Design Standards
- Aesthetic: Institutional admin console - calm, dense, trustworthy.
- Visual tokens: Slate neutral background, deep teal or navy accent, restrained status colors (emerald, amber, rose).
- Typography: IBM Plex Sans for UI prose, IBM Plex Mono for IDs, marks, roll numbers, and dates.
- Components: Server-driven `DataTable`, Modal, ConfirmDialog, Badge, Toast, Skeleton, EmptyState, ErrorState.
- Accessibility: Keyboard navigable, explicit input labels, visible focus states, no emojis or unstyled layout shifts.
- Responsiveness: Student interface fully functional down to 360px viewport; faculty and admin optimized for 1024px+.
- Offline readiness: Fonts self-hosted; zero external CDN asset dependencies.
- Footer requirement: `Mini College ERP System - BCA Project by Shagun Kaushal`.
