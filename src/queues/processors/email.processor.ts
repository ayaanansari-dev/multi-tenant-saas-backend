import { Job } from 'bullmq';
import { EmailService } from '../../services/email.service';

export const emailProcessor = async (job: Job, emailService: EmailService) => {
  const { type, to, data, tenantId } = job.data;
  
  return emailService.sendEmail(to, type, data, tenantId, job.id || '');
};