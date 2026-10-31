import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export type UserRole = 'admin' | 'faculty' | 'student';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: UserRole;
    identifier: string;
    displayName: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.session.role as UserRole)) {
      return next(new AppError('Access denied', 403, 'FORBIDDEN'));
    }
    next();
  };
}
