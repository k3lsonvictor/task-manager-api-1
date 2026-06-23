import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    emailVerified?: boolean;
    verificationCodeHash?: string;
    verificationExpiresAt?: Date;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  updateById(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      passwordHash: string;
      emailVerified: boolean;
      verificationCodeHash: string | null;
      verificationExpiresAt: Date | null;
      passwordResetCodeHash: string | null;
      passwordResetExpiresAt: Date | null;
      refreshTokenHash: string | null;
    }>,
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  updateRefreshTokenHash(id: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  deleteById(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
