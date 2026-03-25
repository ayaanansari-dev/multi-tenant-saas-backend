// src/config/queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

export interface QueueConfig {
  host: string;
  port: number;
  password?: string;
}

export class QueueManager {
  private connection: Redis;
  private emailQueue: Queue;
  private deadLetterQueue: Queue;
  private emailWorker: Worker | null = null;

  constructor(config: QueueConfig) {
    this.connection = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    });

    this.emailQueue = new Queue('email', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });

    this.deadLetterQueue = new Queue('dead-letter', {
      connection: this.connection
    });
  }

  async setupWorker(processor: (job: any) => Promise<any>) {
    this.emailWorker = new Worker(
      'email',
      async (job) => {
        try {
          const result = await processor(job);
          return result;
        } catch (error) {
          if (job.attemptsMade >= 2) {
            await this.deadLetterQueue.add(`dead-${job.id}`, job.data, {
              jobId: `dlq-${job.id}`
            });
          }
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: parseInt(env.QUEUE_CONCURRENCY) || 5,
      }
    );

    this.emailWorker.on('failed', async (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }

  async addEmailJob(type: string, to: string, data: any, tenantId: string) {
    return this.emailQueue.add(`email-${type}`, {
      type,
      to,
      data,
      tenantId,
      createdAt: new Date()
    });
  }

  async getQueueDepth(): Promise<number> {
    const counts = await this.emailQueue.getJobCounts();
    return counts.waiting + counts.active;
  }

  async close() {
    if (this.emailWorker) {
      await this.emailWorker.close();
    }
    await this.emailQueue.close();
    await this.deadLetterQueue.close();
    await this.connection.quit();
  }
}