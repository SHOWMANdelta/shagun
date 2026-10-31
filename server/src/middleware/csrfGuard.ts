import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

// Require X-Requested-With: erp header on all mutating requests (CSRF defense)
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.headers['x-requested-with'] !== 'erp') {
      return next(new AppError('Missing X-Requested-With header', 403, 'CSRF_FORBIDDEN'));
    }
  }
  next();
}
