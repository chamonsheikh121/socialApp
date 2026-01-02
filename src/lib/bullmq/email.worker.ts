/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Job, Worker } from 'bullmq';
import { MailService } from '../mail/mail.service';

// Note: This worker needs to be initialized with proper DI in a module
// For now, this is a placeholder - proper implementation would require
// creating a BullMQ module with proper service injection

export const createEmailWorker = (mailService: MailService) => {
  return new Worker(
    'email-queue',
    async (job: Job<Record<string, any>>) => {
      const { type, ...data } = job.data;

      switch (type) {
        case 'otp':
          await mailService.sendOtpEmail(data.to, data.otp);
          break;
        case 'welcome':
          await mailService.sendWelcomeEmail(data.to, data.username);
          break;
        case 'password-reset':
          await mailService.sendPasswordResetEmail(data.to, data.resetToken);
          break;
        default:
          console.log('from mail worker');
          break;
      }

      console.log(`Email sent to ${data.to}`);
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    },
  );
};
