import { buildApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import pino from 'pino';

const logger = pino({ name: 'server' });
const app = buildApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, draining pool and shutting down...`);
  server.close(async () => {
    await pool.end();
    logger.info('Database pool drained. Process exiting.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
export { app };

