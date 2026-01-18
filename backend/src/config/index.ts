import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(4000),
  
  // Database (postgres:// URLs don't pass strict URL validation)
  databaseUrl: z.string().min(1),
  
  // Redis (optional - will use in-memory cache if not provided)
  redisUrl: z.string().optional().default(''),
  
  // GitHub OAuth
  github: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    callbackUrl: z.string().url(),
    webhookSecret: z.string().optional(),
  }),
  
  // Anthropic
  anthropicApiKey: z.string().min(1),
  
  // JWT
  jwt: z.object({
    secret: z.string().min(32),
    expiresIn: z.string().default('7d'),
  }),
  
  // Encryption
  encryptionKey: z.string().min(32),
  
  // Frontend
  frontendUrl: z.string().url(),
  
  // Rate limiting
  rateLimit: z.object({
    windowMs: z.coerce.number().default(900000), // 15 minutes
    maxRequests: z.coerce.number().default(100),
  }),
  
  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    nodeEnv: process.env['NODE_ENV'],
    port: process.env['PORT'],
    databaseUrl: process.env['DATABASE_URL'],
    redisUrl: process.env['REDIS_URL'],
    github: {
      clientId: process.env['GITHUB_CLIENT_ID'],
      clientSecret: process.env['GITHUB_CLIENT_SECRET'],
      callbackUrl: process.env['GITHUB_CALLBACK_URL'],
      webhookSecret: process.env['GITHUB_WEBHOOK_SECRET'],
    },
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    jwt: {
      secret: process.env['JWT_SECRET'],
      expiresIn: process.env['JWT_EXPIRES_IN'],
    },
    encryptionKey: process.env['ENCRYPTION_KEY'],
    frontendUrl: process.env['FRONTEND_URL'],
    rateLimit: {
      windowMs: process.env['RATE_LIMIT_WINDOW_MS'],
      maxRequests: process.env['RATE_LIMIT_MAX_REQUESTS'],
    },
    logLevel: process.env['LOG_LEVEL'],
  });

  if (!result.success) {
    console.error('❌ Invalid configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
