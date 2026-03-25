// src/queues/email.worker.ts
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { EmailService } from '../services/email.service';
import { Logger } from '../config/logger';

export class EmailWorker {
  private worker: Worker | null = null;
  
  constructor(
    private redis: Redis,
    private emailService: EmailService
  ) {}

  async start() {
    this.worker = new Worker(
      'email',
      async (job) => {
        const { type, to, data, tenantId } = job.data;
        
        Logger.info(`Processing email job ${job.id}: ${type} to ${to}`);
        
        try {
          await this.emailService.sendEmail(to, type, data, tenantId, job.id || '');
          return { success: true };
        } catch (error) {
          Logger.error(`Email job ${job.id} failed`, error);
          throw error;
        }
      },
      {
        connection: this.redis,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );
    
    this.worker.on('completed', (job) => {
      Logger.info(`Job ${job.id} completed successfully`);
    });
    
    this.worker.on('failed', (job, err) => {
      Logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
    
    this.worker.on('error', (err) => {
      Logger.error('Worker error:', err);
    });
    
    Logger.info('Email worker started');
  }
  
  async stop() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      Logger.info('Email worker stopped');
    }
  }
}