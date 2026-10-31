import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { loginService, changePasswordService } from './auth.service.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await loginService(req.body);
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        req.session.role = user.role as 'admin' | 'faculty' | 'student';
        req.session.identifier = user.identifier;
        req.session.displayName = user.displayName;
        res.json({
          data: {
            id: user.id,
            role: user.role,
            identifier: user.identifier,
            displayName: user.displayName,
          },
          meta: {},
        });
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
authRouter.post(
  '/logout',
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.json({ data: { message: 'Logged out successfully' }, meta: {} });
    });
  }
);

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    data: {
      id: req.session.userId,
      role: req.session.role,
      identifier: req.session.identifier,
      displayName: req.session.displayName,
    },
    meta: {},
  });
});

// PUT /api/auth/change-password
authRouter.put(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await changePasswordService(req.session.userId!, req.body);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.json({
          data: { message: 'Password changed. Please log in again.' },
          meta: {},
        });
      });
    } catch (err) {
      next(err);
    }
  }
);


