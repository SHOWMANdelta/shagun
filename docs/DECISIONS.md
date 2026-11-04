# Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

## Architectural and Implementation Decisions

- [2026-10-31] Decision: User confirmed using PostgreSQL hosted on Supabase (accessed as plain Postgres via pg driver without Supabase SDK, in dedicated erp schema) as specified in original project prompt. Reason: User has an active Supabase account ready to connect.
- [2026-10-31] Decision: Use Windows PowerShell compatible command syntax and pnpm workspace structure. Reason: Operating environment constraints outlined in project prompt.
- [2026-11-02] Decision: Reverted pg Pool max from 20 back to the specified 10. Reason: Project spec and Supabase connection limits; slower remote tests are acceptable.
- [2026-11-02] Decision: PORT now validated via zod pipe (integer 1-65535) so an invalid value fails fast. Reason: The dev shell exported PORT=0 and dotenv never overrides existing variables, so the server silently bound an ephemeral port; the spec requires fail-fast env validation.
- [2026-11-02] Decision: Marks and students test suites clean up their own leftovers at start when run repeatedly. Reason: Tests run against a persistent shared database, so repeated runs must stay deterministic.
- [2026-11-03] Decision: Invalid PORT values warn and fall back to 4000 instead of failing validation, and the raw-process.env fallback is no longer reachable via PORT. Reason: The dev shell exports PORT=0; the earlier strict pipe turned every session cookie off in tests because the fallback path exposed COOKIE_SECURE as the string "false" (truthy), making express-session withhold cookies over HTTP.
- [2026-11-03] Decision: Landing page and sign-in page are separate routes (/ and /login); post-login navigates straight to the role console instead of / redirecting. Reason: The user asked for a marketing-style landing page distinct from authentication.
- [2026-11-03] Decision: Email OTP sign-in added via Resend (hashed single-use codes in erp.auth_otp, 60s cooldown, 5-per-hour cap, 5 wrong attempts disable the code; sender defaults onboarding@resend.dev). Password login kept as a secondary tab. Reason: User requested passwordless email sign-in backed by their own Resend account; BCA credit caption removed from the public pages at user request.
