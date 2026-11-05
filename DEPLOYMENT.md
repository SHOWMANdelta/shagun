# Deploying to Vercel

This project is deployed as **one Vercel project with two services**:

- **`client`** (`client/`, Vite) — built into static assets for the React SPA.
- **`server`** (`server/`, Express) — handles all `/api/...` endpoints.
- PostgreSQL is hosted separately (for example, on Neon). Vercel does not
  provide the database for this project.

`vercel.json` at the repository root uses Vercel's Multi-Service architecture:
- `/api/(.*)` routes to the `server` service.
- `/(.*)` routes to the `client` service.


## 1. Prepare a production database

1. Create a PostgreSQL database with a provider such as Neon. Prefer a pooled
   connection URL and a database region close to the Vercel Function region.
2. Keep the connection URL private. Do not commit it, paste it into source
   files, or use a production database for Preview deployments.
3. If you want sample users and records, note that the seed script creates
   demo admin, faculty, and student accounts that all share `SEED_PASSWORD`.
   Set a strong, unique password before seeding, and do not publish those
   credentials or leave demo accounts enabled for real users.

## 2. Run database migrations

From the repository root on your Windows machine:

1. Open the ignored root `.env` file (create it if needed) and set these
   variables to the **production database** values for this one-time setup:

   ```dotenv
   DATABASE_URL=your-pooled-postgresql-connection-url
   DB_SSL=true
   DB_SCHEMA=erp
   SESSION_SECRET=your-unique-random-secret-at-least-32-characters-long
   COOKIE_SECURE=true
   SEED_PASSWORD=your-strong-unique-initial-password
   ```

   Do not use the example values from `.env.example`. The root `.env` is ignored
   by Git; still check `git status` before committing.
2. In PowerShell, install the locked dependencies and run the migrations:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm --filter server db:migrate
   pnpm --filter server db:verify
   ```

3. If you want the sample users and records, seed them now:

   ```powershell
   pnpm --filter server db:seed
   ```

   Keep the initial password private. After seeding, sign in as `admin` and
   change the password; review or replace the sample records before opening the
   app to real users. The seed command is optional.
4. Restore your local development `.env` values afterward if you changed them.

Migrations and seeding are manual commands; deploying to Vercel does not run
them automatically.

## 3. Import the project into Vercel

1. Push the deployment changes to the Git branch you intend to deploy.
2. In Vercel, choose **Add New > Project** and import this Git repository.
3. Set **Root Directory** to the repository root (the directory containing
   `vercel.json`), not `client` or `server`.
4. Keep the build settings controlled by `vercel.json`:
   - Build command: `pnpm build`
   - Install command: `pnpm install --frozen-lockfile`
   - Output directory: `client/dist`
5. Add the following Environment Variables in Project Settings > Environment
   Variables:

   | Name | Production value |
   | --- | --- |
   | `DATABASE_URL` | The same production PostgreSQL pooled URL used for migration |
   | `DB_SSL` | `true` |
   | `DB_SCHEMA` | `erp` |
   | `SESSION_SECRET` | A new unique random value of at least 32 characters |
   | `COOKIE_SECURE` | `true` |
   | `NODE_ENV` | `production` |
   | `SEED_PASSWORD` | Required: strong password of at least 12 characters for seed/default-user operations |

   Add production secrets to **Production**. For **Preview**, use a separate
   test database and its own session secret; do not point Preview at production.
   The server refuses to start in production without `SEED_PASSWORD`; it is used
   for seeded accounts and when creating users without an explicitly supplied
   password. Never set it to the example password.
6. Deploy. Vercel builds both workspaces and publishes the client and API from
   the same project.

## 4. Verify the deployment

Use the deployed Vercel domain for these checks:

1. Open `/api/health`. Expect HTTP 200 and JSON containing
   `"status":"ok"`. A 503 indicates the Function cannot reach the database or
   the environment variables are missing/incorrect.
2. Open `/login`, sign in, and load a page that reads data.
3. Test a write operation, then sign out and verify the session is cleared.
4. Refresh a non-root client route directly. It should load the client app,
   while `/api/...` requests should return API responses and not HTML.
5. Check Vercel **Runtime Logs** for Function errors if any check fails. Confirm
   migrations were applied to the same database named in Vercel's `DATABASE_URL`.

## 5. Optional production setup

- Add a custom domain under Vercel Project > Settings > Domains and follow the
  DNS instructions Vercel provides.
- Select a Vercel Function region near the database in Project Settings to
  reduce database latency.
- Keep backups enabled with the database provider and avoid using production
  data in Preview deployments.

## Updating the live site

After connecting the Git repository, pushes to the production branch trigger a
new deployment. Review the Vercel build and runtime logs after each release.
Database migrations remain a separate, deliberate step and should be run
against the intended database before deploying code that depends on them.
