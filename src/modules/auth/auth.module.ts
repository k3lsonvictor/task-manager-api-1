import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenService } from './services/token.service';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';

@Module({
  providers: [JwtAuthGuard, TokenService, LoginUseCase, LogoutUseCase],
  exports: [JwtAuthGuard, JwtModule],
  controllers: [AuthController],
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
  ],
})
export class AuthModule {}
