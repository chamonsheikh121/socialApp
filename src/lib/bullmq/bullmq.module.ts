import { Module, OnModuleInit } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';
import { createEmailWorker } from './email.worker';

@Module({
  imports: [MailModule],
})
export class BullMQModule implements OnModuleInit {
  constructor(private readonly mailService: MailService) {}

  onModuleInit() {
    // Initialize the email worker
    const emailWorker = createEmailWorker(this.mailService);

    // Handle worker events
    emailWorker.on('completed', (job) => {
      console.log(`Email job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(`Email job ${job?.id} failed:`, err);
    });

    console.log('Email worker initialized and ready to process jobs');
  }
}
