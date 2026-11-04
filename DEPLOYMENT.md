# Deploying to Vercel

The project deploys as one Vercel project: Vite serves the frontend, and the
Express API runs as a Vercel Function. Keep the Vercel project's **Root
Directory** set to the repository root.

## Before deploying

1. Create a production PostgreSQL database (for example, on Neon). Use its
   pooled connection string for `DATABASE_URL`.
2. Apply the schema to that database from the repository root:

   ```sh
   pnpm install --frozen-lockfile
   pnpm --filter server db:migrate
   ```

   Set `DATABASE_URL` in the shell before running the migration command, or
   place it in the ignored root `.env` file. Do not commit credentials.
3. In the Vercel project settings, add these environment variables for
   Production and Preview as appropriate:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL pooled connection string |
   | `DB_SSL` | `true` |
   | `DB_SCHEMA` | `erp` |
   | `SESSION_SECRET` | A unique random secret of at least 32 characters |
   | `COOKIE_SECURE` | `true` |
   | `SEED_PASSWORD` | A strong password, only if using the seed command |

   Vercel sets `NODE_ENV=production` for production deployments. Do not use
   the example/demo password for any production seed data.
4. Import the repository in Vercel and deploy. The checked-in `vercel.json`
   sets the install/build commands, publishes `client/dist`, routes API
   requests to the Express function, and sends frontend routes to the Vite
   entry point.

## Verify

- Open `/api/health`; a healthy database returns JSON with `status: "ok"`.
- Sign in and verify a page that reads and writes data so the session cookie
  and database-backed session store are exercised.
- If the health endpoint reports a database error, recheck the Vercel
  environment variables and confirm that migrations ran against that same
  database.

Use the database provider's pooled URL and, where possible, select a Vercel
Function region close to the database to reduce connection overhead and
latency.
