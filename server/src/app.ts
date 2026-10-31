import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pool } from './db/pool.js';

export function buildApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const result = await pool.query('SELECT 1 as healthy');
      res.json({
        data: {
          status: 'ok',
          database: result.rows[0]?.healthy === 1 ? 'up' : 'unknown',
          timestamp: new Date().toISOString(),
        },
        meta: {},
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error';
      res.status(503).json({
        error: {
          code: 'DB_UNAVAILABLE',
          message,
          requestId: req.headers['x-request-id'] || 'system',
        },
      });
    }
  });

  return app;
}
