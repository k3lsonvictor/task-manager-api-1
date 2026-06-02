import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const AUTH_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const AUTH_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email not verified');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.refreshTokenSecret,
        },
      );

      await this.usersRepository.updateRefreshTokenHash(payload.sub, null);
    } catch {
      return;
    }
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshTokenSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
  }

  private get refreshTokenSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET')
    );
  }
}
