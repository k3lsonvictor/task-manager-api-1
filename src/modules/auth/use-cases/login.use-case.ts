import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersRepository } from "src/modules/users/users.repository";
import { LoginDto } from "../dto/login.dto";
import * as bcrypt from 'bcrypt';
import { TokenService } from "../services/token.service";

@Injectable()
export class LoginUseCase {
    constructor (
        private readonly usersRespository: UsersRepository,
        private readonly tokenService: TokenService,
    ) {}

    async execute(dto: LoginDto) {
        const user = await this.usersRespository.findByEmail(dto.email);

        if(!user) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const passwordMatches = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        )

        if(!passwordMatches) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        if(!user.emailVerified) {
            throw new ForbiddenException('Email not verified');
        }

        const accessToken = await this.tokenService.generateAccessToken ({
            sub: user.id,
            email: user.email,
        });
        
        const refreshToken = await this.tokenService.generateRefreshToken({
            sub: user.id,
            email: user.email,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
            },
        };
        
    }
}