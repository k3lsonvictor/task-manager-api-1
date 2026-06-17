import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "src/modules/users/users.repository";
import * as bcrypt from 'bcrypt';

export const AUTH_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const AUTH_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class TokenService {
    constructor (
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersRepository: UsersRepository,
    ) {}

    async generateAccessToken(payload: JwtPayload) {
        const access_token = await this.jwtService.signAsync(
            payload, {
                expiresIn: '15m',
            });

        return access_token;
    }

    async generateRefreshToken(payload: JwtPayload) {
        const refresh_token = await this.jwtService.signAsync(
            payload, {
                secret: this.refreshTokenSecret,
                expiresIn: '7d',
            });

        return refresh_token;
    }

    async refresh(refreshToken: string) {
        let payload: JwtPayload;

        try {
            payload = await this.verifyRefreshToken(refreshToken);
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

        const accessToken = await this.generateAccessToken({
            sub: user.id,
            email: user.email,
        });

        const newRefreshToken = await this.generateRefreshToken({
            sub: user.id,
            email: user.email,
        });
        
        await this.storeRefreshToken(user.id, newRefreshToken);

        return {
            accessToken,
            refreshToken: newRefreshToken,
        }
        
    }

    async verifyRefreshToken(
        refreshToken: string,
    ): Promise<JwtPayload> {
        return this.jwtService.verifyAsync(
            refreshToken,
            {
                secret: this.refreshTokenSecret,
            },
        );

  }

    private async storeRefreshToken(userId: string, refreshToken: string) {
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await this.usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
    }

    private get refreshTokenSecret() {
        return (
            this.configService.get<string>('JWT_REFRESH_SECRET') ??
            this.configService.get<string>('JWT_SECRET')
        )
    }
}