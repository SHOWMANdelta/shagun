# Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

## Architectural and Implementation Decisions

- [2026-10-31] Decision: User confirmed using PostgreSQL hosted on Supabase (accessed as plain Postgres via pg driver without Supabase SDK, in dedicated erp schema) as specified in original project prompt. Reason: User has an active Supabase account ready to connect.
- [2026-10-31] Decision: Use Windows PowerShell compatible command syntax and pnpm workspace structure. Reason: Operating environment constraints outlined in project prompt.
- [2026-11-02] Decision: Reverted pg Pool max from 20 back to the specified 10. Reason: Project spec and Supabase connection limits; slower remote tests are acceptable.
- [2026-11-02] Decision: PORT now validated via zod pipe (integer 1-65535) so an invalid value fails fast. Reason: The dev shell exported PORT=0 and dotenv never overrides existing variables, so the server silently bound an ephemeral port; the spec requires fail-fast env validation.
- [2026-11-02] Decision: Marks and students test suites clean up their own leftovers at start when run repeatedly. Reason: Tests run against a persistent shared database, so repeated runs must stay deterministic.
