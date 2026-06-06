import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  // WhatsApp — optional until messaging providers are implemented
  WHATSAPP_PROVIDER: z.enum(['twilio', 'meta']).optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  META_WHATSAPP_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`[config] Missing or invalid environment variables:\n${missing}`);
}

export const env = parsed.data;
