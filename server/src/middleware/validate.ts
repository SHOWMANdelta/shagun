import { Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schema: RequestValidationSchema) {
  return async (req: Request, _res: Response, next: (error?: unknown) => void) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        Object.defineProperty(req, 'query', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: await schema.query.parseAsync(req.query),
        });
      }
      if (schema.params) {
        Object.defineProperty(req, 'params', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: await schema.params.parseAsync(req.params),
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
}
