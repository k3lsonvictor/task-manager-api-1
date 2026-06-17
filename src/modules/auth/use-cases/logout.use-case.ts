import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "src/modules/users/users.repository";
import { JwtPayload, TokenService } from "../services/token.service";

@Injectable()
export class LogoutUseCase {
    constructor (
        private readonly usersRepository: UsersRepository,
        private readonly tokenService: TokenService,
    ) {}

    async execute(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      await this.usersRepository.updateRefreshTokenHash(payload.sub, null);
    } catch {
      return;
    }
  }
}