// Migration runner
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
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
    // Ensure migrations tracking table exists in schema
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

    let applied = 0;
    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM erp.migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) {
        process.stdout.write(`  [SKIP] ${file} (already applied)\n`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      process.stdout.write(`  [RUN ] ${file} ...\n`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO erp.migrations(filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        process.stdout.write(`  [OK  ] ${file}\n`);
        applied++;
      } catch (err) {
        await client.query('ROLLBACK');
        process.stderr.write(`  [FAIL] ${file}: ${(err as Error).message}\n`);
        throw err;
      }
    }

    process.stdout.write(`\n✅ Migrations complete. Applied: ${applied}, Skipped: ${files.length - applied}\n\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  process.stderr.write(`\n❌ Migration failed: ${err.message}\n`);
  process.exit(1);
});
