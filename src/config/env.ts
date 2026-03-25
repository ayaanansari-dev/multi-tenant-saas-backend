// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env file from project root
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  // Don't throw, just warn - maybe we're in production with env vars
  console.warn('Continuing with process.env only');
}

console.log('Environment loaded. Available keys:', Object.keys(process.env).filter(k => 
  ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'PORT'].includes(k)
));

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  API_KEY_SALT_ROUNDS: z.string().default('12'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  
  // Rate Limiting
  GLOBAL_RATE_LIMIT: z.string().default('1000'),
  BURST_RATE_LIMIT: z.string().default('50'),
  
  // Email
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@velozity.com'),
  
  // Monitoring
  INTERNAL_API_KEY: z.string().min(1, 'INTERNAL_API_KEY is required'),
  
  // Queue
  QUEUE_CONCURRENCY: z.string().default('5'),
  QUEUE_RETRY_ATTEMPTS: z.string().default('3'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
let env: Env;

try {
  env = envSchema.parse(process.env);
  console.log('✅ Environment variables validated successfully');
  console.log(`   Database: ${env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'SQLite'}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
} catch (error) {
  if (error instanceof z.ZodError) {
  console.error('❌ Environment validation failed:');
  error.issues.forEach((err: z.ZodIssue) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
}
  throw error;
}

export { env };