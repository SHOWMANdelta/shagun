import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200)
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9])/,
      'Password must contain at least one letter and one number'
    ),
});

export const requestOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code').min(6).max(6),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
