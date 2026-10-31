import pg from 'pg';
import { env } from '../config/env.js';
import pino from 'pino';

const logger = pino({ name: 'db-pool' });

// Register type parsers
// int8 (type ID 20) -> number
pg.types.setTypeParser(20, (val: string) => (val === null ? null : parseInt(val, 10)));
// numeric (type ID 1700) -> number
pg.types.setTypeParser(1700, (val: string) => (val === null ? null : parseFloat(val)));
// date (type ID 1082) -> YYYY-MM-DD string
pg.types.setTypeParser(1082, (val: string) => val);

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected idle client error on PostgreSQL pool');
});

pool.on('connect', (client) => {
  const schema = env.DB_SCHEMA || 'erp';
  // Set search_path on every new connection
  client.query(`SET search_path TO "${schema}", public`);
});

/**
 * Executes a query with execution time measurement and slow query logging.
 */
export async function query<R extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<R>> {
  const start = Date.now();
  try {
    const res = await pool.query<R>(text, params);
    const duration = Date.now() - start;
    if (duration > 200) {
      logger.warn({ text, duration, rows: res.rowCount }, 'Slow query detected (>200ms)');
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error({ text, duration, error }, 'Database query error');
    throw error;
  }
}
