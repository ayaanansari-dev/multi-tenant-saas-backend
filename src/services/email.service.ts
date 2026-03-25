// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { Logger } from '../config/logger';
import { EmailLogRepository } from '../repositories/emailLog.repository';
import { emailTemplates } from '../templates';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private emailLogRepo: EmailLogRepository) {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: parseInt(env.SMTP_PORT),
            secure: parseInt(env.SMTP_PORT) === 465,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
    }

    async sendEmail(to: string, type: string, data: any, tenantId: string, jobId: string) {
        const template = emailTemplates[type as keyof typeof emailTemplates];
        if (!template) {
            throw new Error(`Email template not found: ${type}`);
        }

        const { subject, html, text } = template(data);

        try {
            const info = await this.transporter.sendMail({
                from: env.EMAIL_FROM,
                to,
                subject,
                html,
                text,
            });

            // Fix: Pass tenantId directly instead of tenant connect object
            await this.emailLogRepo.create({
                jobId,
                type,
                recipient: to,
                status: 'success',
                metadata: { messageId: info.messageId },
                tenantId  // Pass tenantId directly
            });

            Logger.info(`Email sent: ${type} to ${to}`, { messageId: info.messageId });
            return info;
        } catch (error) {
            // Fix: Pass tenantId directly instead of tenant connect object
            await this.emailLogRepo.create({
                jobId,
                type,
                recipient: to,
                status: 'failed',
                error: error instanceof Error ? error.message : String(error),
                tenantId  // Pass tenantId directly
            });

            Logger.error(`Email failed: ${type} to ${to}`, error);
            throw error;
        }
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            Logger.error('SMTP connection failed', error);
            return false;
        }
    }
}