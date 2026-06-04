import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  MAIL_QUEUE,
  SEND_PASSWORD_RESET_EMAIL_JOB,
  SEND_VERIFICATION_EMAIL_JOB,
} from './mail.constants';
import type { SendVerificationEmailJob } from './dto/send-verification-email.job';
import type { SendPasswordResetEmailJob } from './dto/send-password-reset-email.job';

type MailJob = SendVerificationEmailJob | SendPasswordResetEmailJob;

@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue<MailJob>,
  ) {}

  enqueueVerificationEmail(data: SendVerificationEmailJob) {
    return this.mailQueue.add(
      SEND_VERIFICATION_EMAIL_JOB,
      data,
      this.jobOptions(),
    );
  }

  enqueuePasswordResetEmail(data: SendPasswordResetEmailJob) {
    return this.mailQueue.add(
      SEND_PASSWORD_RESET_EMAIL_JOB,
      data,
      this.jobOptions(),
    );
  }

  private jobOptions() {
    return {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    } as const;
  }
}
