import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Load .env from root or current dir
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_SSL: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  DB_SCHEMA: z.string().default('erp'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters long'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  PORT: z
    .string()
    .optional()
    .transform((val) => {
      const parsedPort = val ? parseInt(val, 10) : NaN;
      if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        process.stderr.write(
          `WARNING: PORT value "${val ?? '(unset)'}" is not a valid port; using default 4000.\n`
        );
        return 4000;
      }
      return parsedPort;
    }),
  SEED_PASSWORD: z
    .string()
    .min(12, 'SEED_PASSWORD must be at least 12 characters long')
    .default('DemoPassword123!'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Email OTP (Resend). Optional: OTP login reports EMAIL_NOT_CONFIGURED when missing.
  RESEND_API_KEY: z.string().optional(),
  OTP_SENDER_EMAIL: z.string().default('onboarding@resend.dev'),
  OTP_SENDER_NAME: z.string().default('Mini College ERP'),
});

const parsed = envSchema.safeParse(process.env);

export const envValidationIssues: string | null = !parsed.success
  ? parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
  : null;

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  process.stderr.write(`\nEnvironment validation failed:\n${issues}\n\n`);
  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : (process.env as unknown as z.infer<typeof envSchema>);

