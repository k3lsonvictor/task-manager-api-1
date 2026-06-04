import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailService } from '../mail/mail.service';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateUserDto) {
    const userAlreadyExists = await this.usersRepository.findByEmail(dto.email);

    if (userAlreadyExists) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const verificationExpiresAt = this.verificationExpiresAt();

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      verificationCodeHash,
      verificationExpiresAt,
    });

    await this.mailService.enqueueVerificationEmail({
      email: user.email,
      name: user.name,
      code: verificationCode,
      expiresAt: verificationExpiresAt,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerified) {
      return { emailVerified: true };
    }

    if (
      !user.verificationCodeHash ||
      !user.verificationExpiresAt ||
      user.verificationExpiresAt < new Date()
    ) {
      throw new BadRequestException('Verification code expired');
    }

    const codeMatches = await bcrypt.compare(
      dto.code,
      user.verificationCodeHash,
    );

    if (!codeMatches) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersRepository.updateById(user.id, {
      emailVerified: true,
      verificationCodeHash: null,
      verificationExpiresAt: null,
    });

    return { emailVerified: true };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user || user.emailVerified) {
      return { sent: true };
    }

    const verificationCode = this.generateVerificationCode();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const verificationExpiresAt = this.verificationExpiresAt();

    await this.usersRepository.updateById(user.id, {
      verificationCodeHash,
      verificationExpiresAt,
    });

    await this.mailService.enqueueVerificationEmail({
      email: user.email,
      name: user.name,
      code: verificationCode,
      expiresAt: verificationExpiresAt,
    });

    return { sent: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      return { sent: true };
    }

    const resetCode = this.generateVerificationCode();
    const passwordResetCodeHash = await bcrypt.hash(resetCode, 10);
    const passwordResetExpiresAt = this.passwordResetExpiresAt();

    await this.usersRepository.updateById(user.id, {
      passwordResetCodeHash,
      passwordResetExpiresAt,
    });

    await this.mailService.enqueuePasswordResetEmail({
      email: user.email,
      name: user.name,
      code: resetCode,
      expiresAt: passwordResetExpiresAt,
    });

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (
      !user ||
      !user.passwordResetCodeHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const codeMatches = await bcrypt.compare(
      dto.code,
      user.passwordResetCodeHash,
    );

    if (!codeMatches) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.usersRepository.updateById(user.id, {
      passwordHash,
      passwordResetCodeHash: null,
      passwordResetExpiresAt: null,
      refreshTokenHash: null,
    });

    return { passwordUpdated: true };
  }

  private generateVerificationCode() {
    return randomInt(100000, 1000000).toString();
  }

  private verificationExpiresAt() {
    const expiresInMinutes = Number(
      process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES ?? 15,
    );

    return new Date(Date.now() + expiresInMinutes * 60 * 1000);
  }

  private passwordResetExpiresAt() {
    const expiresInMinutes = Number(
      process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 15,
    );

    return new Date(Date.now() + expiresInMinutes * 60 * 1000);
  }
}
