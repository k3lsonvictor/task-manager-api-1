import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  MAIL_QUEUE,
  SEND_PASSWORD_RESET_EMAIL_JOB,
  SEND_VERIFICATION_EMAIL_JOB,
} from '../mail.constants';
import type { SendVerificationEmailJob } from '../dto/send-verification-email.job';
import type { SendPasswordResetEmailJob } from '../dto/send-password-reset-email.job';

type MailJob = SendVerificationEmailJob | SendPasswordResetEmailJob;

@Injectable()
@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly transporter: Transporter;

  constructor(
    @InjectQueue('emails-dlq')
    private readonly dlqQueue: Queue,
    private readonly configService: ConfigService
  ) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: this.mailAuth(),
    });
  }

  async process(job: Job<MailJob>) {
    this.logger.debug(
      `Processing job ${job.id} (${job.name}) - Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`,
    );

    switch (job.name) {
      case SEND_VERIFICATION_EMAIL_JOB:
        await this.sendVerificationEmail(job);
        return;
      case SEND_PASSWORD_RESET_EMAIL_JOB:
        await this.sendPasswordResetEmail(job.data);
        return;
      default:
        this.logger.warn(`Ignoring unknown mail job: ${job.name}`);
    }
  }

  private async sendVerificationEmail(job: Job<SendVerificationEmailJob>) {
    const { email, name, code, expiresAt } = job.data;
    const from =
      this.configService.get<string>('MAIL_FROM') ??
      'Task Manager <no-reply@task-manager.local>';

    try {
      if (
        this.configService.get<string>('MAIL_FORCE_VERIFICATION_ERROR') === 'true'
      ) {
        throw new Error('Forced verification email failure for testing');
      }

      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Confirme seu e-mail',
        text: [
          `Olá, ${name}.`,
          '',
          `Seu código de verificação é: ${code}`,
          `Ele expira em ${new Date(expiresAt).toLocaleString('pt-BR')}.`,
        ].join('\n'),
        html: `
          <p>Olá, ${this.escapeHtml(name)}.</p>
          <p>Seu código de verificação é:</p>
          <p><strong style="font-size: 24px; letter-spacing: 4px;">${code}</strong></p>
          <p>Ele expira em ${new Date(expiresAt).toLocaleString('pt-BR')}.</p>
        `,
      });
    } catch (error) {
      const isLastAttempt = job.attemptsMade + 1 >= job.opts.attempts!;
      this.logger.error(
        `Job ${job.id} failed (Attempt ${job.attemptsMade + 1}/${job.opts.attempts}) - ${isLastAttempt ? 'Moving to DLQ' : 'Will retry'}`,
        (error as Error).message,
      );

      if (isLastAttempt) {
        this.logger.error(`Failed to send verification email to ${email}`, error as Error);
        await this.dlqQueue.add('failed-email', {
          originalJobId: job.id,
          data: job.data,
          reason: (error as Error).message,
        });
      }

      throw error;
    }
  }

  private async sendPasswordResetEmail(data: SendPasswordResetEmailJob) {
    const { email, name, code, expiresAt } = data;
    const from =
      this.configService.get<string>('MAIL_FROM') ??
      'Task Manager <no-reply@task-manager.local>';

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Redefina sua senha',
      text: [
        `Olá, ${name}.`,
        '',
        `Seu código para redefinir a senha é: ${code}`,
        `Ele expira em ${new Date(expiresAt).toLocaleString('pt-BR')}.`,
        '',
        'Se você não solicitou essa alteração, ignore este email.',
      ].join('\n'),
      html: `
        <p>Olá, ${this.escapeHtml(name)}.</p>
        <p>Seu código para redefinir a senha é:</p>
        <p><strong style="font-size: 24px; letter-spacing: 4px;">${code}</strong></p>
        <p>Ele expira em ${new Date(expiresAt).toLocaleString('pt-BR')}.</p>
        <p>Se você não solicitou essa alteração, ignore este email.</p>
      `,
    });
  }

  private mailAuth() {
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (!user || !pass) {
      return undefined;
    }

    return { user, pass };
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
