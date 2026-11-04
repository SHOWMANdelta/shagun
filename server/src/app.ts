import express, { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import pino from 'pino';

import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { requestId } from './middleware/requestId.js';
import { csrfGuard } from './middleware/csrfGuard.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

import { authRouter } from './modules/auth/auth.routes.js';
import { studentsRouter } from './modules/students/students.routes.js';
import { facultyRouter } from './modules/faculty/faculty.routes.js';
import { academicRouter } from './modules/academic/academic.routes.js';
import { attendanceRouter } from './modules/attendance/attendance.routes.js';
import { marksRouter } from './modules/marks/marks.routes.js';
import { noticesRouter } from './modules/notices/notices.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';

const PgStore = connectPgSimple(session);
const logger = pino({ name: 'app' });

export interface AppOptions {
  skipRateLimit?: boolean;
}

export function buildApp(options: AppOptions = {}): Express {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS — allow Vite dev server
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'X-Request-Id'],
  }));

  // Request parsing
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));

  // Request ID header
  app.use(requestId);

  // HTTP request logging (only when not in test)
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  // Session store
  const sessionStore = new PgStore({
    pool,
    tableName: 'session',
    schemaName: 'erp',
    createTableIfMissing: false,
    pruneSessionInterval: 60 * 15, // prune every 15 min
  });

  app.use(session({
    store: sessionStore,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
    name: 'erp.sid',
  }));

  // Rate limiters (injectable / disabled in test mode for deterministic execution)
  if (!options.skipRateLimit && env.NODE_ENV !== 'test') {
    app.use('/api', rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
    }));

    app.use('/api/auth/login', rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 15,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Wait 15 minutes.' } },
    }));

    app.use('/api/auth/otp/request', rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many code requests. Wait 15 minutes.' } },
    }));
  }

  // CSRF guard (mutating requests need X-Requested-With: erp)
  app.use('/api', csrfGuard);

  // Health check (no auth required)
  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ data: { status: 'ok', timestamp: new Date().toISOString() }, meta: {} });
    } catch {
      res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable', requestId: req.id } });
    }
  });

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/faculty', facultyRouter);
  app.use('/api/academic', academicRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/marks', marksRouter);
  app.use('/api/notices', noticesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/settings', settingsRouter);

  // Production SPA static file serving
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });

  // 404 and error handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
