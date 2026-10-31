# Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

## Architectural and Implementation Decisions

- [2026-10-31] Decision: Replace Supabase with Standard PostgreSQL (Neon / direct PostgreSQL instance). Reason: User requirement specified avoiding Supabase; using Neon or any standard PostgreSQL instance maintains 100% compatibility with standard pg driver and raw SQL migrations without proprietary SDKs.
- [2026-10-31] Decision: Use Windows PowerShell compatible command syntax and pnpm workspace structure. Reason: Operating environment constraints outlined in project prompt.
