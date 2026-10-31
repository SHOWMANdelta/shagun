import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import pino from 'pino';

const logger = pino({ name: 'error-handler' });

interface PostgresDatabaseError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = req.id || (req.headers['x-request-id'] as string) || 'unknown';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  const pgErr = err as PostgresDatabaseError;
  if (pgErr && typeof pgErr.code === 'string') {
    // 23505: Unique violation
    if (pgErr.code === '23505') {
      return res.status(409).json({
        error: {
          code: 'UNIQUE_VIOLATION',
          message: 'A record with these details already exists.',
          details: pgErr.detail,
          requestId,
        },
      });
    }

    // 23503: Foreign key violation
    if (pgErr.code === '23503') {
      return res.status(409).json({
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Operation cannot be completed because a referenced record does not exist or is in use.',
          details: pgErr.detail,
          requestId,
        },
      });
    }

    // 23514: Check constraint violation
    if (pgErr.code === '23514') {
      return res.status(422).json({
        error: {
          code: 'CHECK_VIOLATION',
          message: 'The submitted data violates a business rule constraint.',
          details: pgErr.constraint,
          requestId,
        },
      });
    }

    // 22P02: Invalid text representation (e.g., malformed UUID)
    if (pgErr.code === '22P02') {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT_SYNTAX',
          message: 'Invalid input syntax provided.',
          details: pgErr.message,
          requestId,
        },
      });
    }
  }

  logger.error({ err, requestId, url: req.originalUrl, method: req.method }, 'Unhandled server error');

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred.',
      requestId,
    },
  });
}
