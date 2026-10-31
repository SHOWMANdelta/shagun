// Phase 1 Gate: Preflight database connectivity check
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  process.stderr.write('ERROR: DATABASE_URL not set in .env\n');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

async function check() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT version()');
    process.stdout.write(`\n✅ Phase 1 Gate PASSED\n`);
    process.stdout.write(`   PostgreSQL: ${res.rows[0].version}\n\n`);
    return true;
  } catch (err) {
    process.stderr.write(`\n❌ Phase 1 Gate FAILED: ${(err as Error).message}\n\n`);
    return false;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

check().then((ok) => process.exit(ok ? 0 : 1));
