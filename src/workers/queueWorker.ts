// src/workers/queueWorker.ts
import { getRedisClient } from '../config/redis';
import { EmailService } from '../services/email.service';
import { EmailLogRepository } from '../repositories/emailLog.repository';
import { EmailWorker } from '../queues/email.worker';
import { Logger } from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

const startWorker = async () => {
  try {
    Logger.info('Starting queue worker...');
    
    const redis = getRedisClient();
    const emailLogRepo = new EmailLogRepository();
    const emailService = new EmailService(emailLogRepo);
    
    const worker = new EmailWorker(redis, emailService);
    await worker.start();
    
    Logger.info('Queue worker started successfully');
    
    process.on('SIGTERM', async () => {
      Logger.info('Worker shutting down...');
      await worker.stop();
      process.exit(0);
    });
  } catch (error) {
    Logger.error('Failed to start worker:', error);
    process.exit(1);
  }
};

startWorker();