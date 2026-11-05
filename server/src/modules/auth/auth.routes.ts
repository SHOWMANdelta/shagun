import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  loginSchema,
  changePasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from './auth.schema.js';
import { loginService, changePasswordService } from './auth.service.js';
import { issueOtpForEmail, verifyOtpForEmail } from './otp.service.js';
import { sendOtpEmail } from './email.js';

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

// POST /api/auth/otp/request
authRouter.post(
  '/otp/request',
  validate({ body: requestOtpSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as { email: string };
      const issued = await issueOtpForEmail(email);

      if (issued) {
        await sendOtpEmail({
          to: issued.user.email,
          code: issued.code,
          displayName: issued.user.displayName,
        });
      }

      // Same answer either way: prevents account enumeration
      res.json({
        data: { message: 'If this email is registered, a sign-in code has been sent.' },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/otp/verify
authRouter.post(
  '/otp/verify',
  validate({ body: verifyOtpSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code } = req.body as { email: string; code: string };
      const user = await verifyOtpForEmail(email, code);
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
      res.clearCookie('erp.sid');
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
        res.clearCookie('erp.sid');
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

