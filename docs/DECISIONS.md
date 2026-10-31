# Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

## Architectural and Implementation Decisions

- [2026-10-31] Decision: User confirmed using PostgreSQL hosted on Supabase (accessed as plain Postgres via pg driver without Supabase SDK, in dedicated erp schema) as specified in original project prompt. Reason: User has an active Supabase account ready to connect.
- [2026-10-31] Decision: Use Windows PowerShell compatible command syntax and pnpm workspace structure. Reason: Operating environment constraints outlined in project prompt.
