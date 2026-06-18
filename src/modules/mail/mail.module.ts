import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailProcessor } from './processors/mail.processor';
import { MAIL_QUEUE } from './mail.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(configService.get<string>('REDIS_PORT') ?? 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(configService.get<string>('REDIS_DB') ?? 0),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: MAIL_QUEUE },
      { name: 'emails-dlq' },
    ),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule { }
