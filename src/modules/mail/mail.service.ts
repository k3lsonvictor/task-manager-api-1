import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { MAIL_QUEUE, SEND_VERIFICATION_EMAIL_JOB } from './mail.constants';
import type { SendVerificationEmailJob } from './dto/send-verification-email.job';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue<SendVerificationEmailJob>,
  ) {}

  enqueueVerificationEmail(data: SendVerificationEmailJob) {
    return this.mailQueue.add(SEND_VERIFICATION_EMAIL_JOB, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
