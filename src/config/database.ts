// src/config/database.ts - For Prisma v7+
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Logger } from './logger';

// For Prisma v7, you need to provide an adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn', 'info'] 
    : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection
prisma.$connect()
  .then(() => {
    Logger.info('✅ Database connected successfully');
  })
  .catch((error) => {
    Logger.error('❌ Database connection failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await pool.end();
  Logger.info('Database disconnected');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await pool.end();
  Logger.info('Database disconnected');
});

export default prisma;