// Danger zone: drops the erp schema and replays every migration from scratch.
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// Usage: pnpm db:reset  (then run: pnpm db:seed)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DATABASE_URL = process.env.DATABASE_URL!;
const DB_SCHEMA = process.env.DB_SCHEMA || 'erp';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    process.stdout.write(`⚠️  Dropping schema "${DB_SCHEMA}" and all data...\n`);
    await client.query(`DROP SCHEMA IF EXISTS "${DB_SCHEMA}" CASCADE`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA}"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${DB_SCHEMA}".migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      process.stdout.write(`  [RUN ] ${file} ...\n`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO "${DB_SCHEMA}".migrations(filename) VALUES ($1)`,
          [file]
        );
        await client.query('COMMIT');
        process.stdout.write(`  [OK  ] ${file}\n`);
      } catch (err) {
        await client.query('ROLLBACK');
        process.stderr.write(`  [FAIL] ${file}: ${(err as Error).message}\n`);
        throw err;
      }
    }

    process.stdout.write(`\n✅ Reset complete. Schema rebuilt from ${files.length} migration(s).\n`);
    process.stdout.write('   Next step: run `pnpm db:seed` to restore the demo dataset.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  process.stderr.write(`\n❌ Reset failed: ${err.message}\n`);
  process.exit(1);
});
