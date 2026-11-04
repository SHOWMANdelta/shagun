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
    .transform((val) => (val ? parseInt(val, 10) : 4000)),
  SEED_PASSWORD: z
    .string()
    .min(12, 'SEED_PASSWORD must be at least 12 characters long')
    .default(process.env.NODE_ENV === 'production' ? '' : 'DemoPassword123!'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  process.stderr.write(`\nEnvironment validation failed:\n${issues}\n\n`);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof envSchema>);
