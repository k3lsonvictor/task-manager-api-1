import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
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

  constructor(private readonly configService: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: this.mailAuth(),
    });
  }

  async process(job: Job<MailJob>) {
    switch (job.name) {
      case SEND_VERIFICATION_EMAIL_JOB:
        await this.sendVerificationEmail(job.data);
        return;
      case SEND_PASSWORD_RESET_EMAIL_JOB:
        await this.sendPasswordResetEmail(job.data);
        return;
      default:
        this.logger.warn(`Ignoring unknown mail job: ${job.name}`);
    }
  }

  private async sendVerificationEmail(data: SendVerificationEmailJob) {
    const { email, name, code, expiresAt } = data;
    const from =
      this.configService.get<string>('MAIL_FROM') ??
      'Task Manager <no-reply@task-manager.local>';

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
