import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { TokenService } from './services/token.service';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let loginUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    loginUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: loginUseCase,
        },
        {
          provide: LogoutUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: TokenService,
          useValue: { refresh: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the access token in the login response body', async () => {
    loginUseCase.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        name: 'Kelson',
        email: 'kelson@gmail.com',
        emailVerified: true,
      },
    });

    const response = {
      cookie: jest.fn(),
    };

    await expect(
      controller.login(
        { email: 'kelson@gmail.com', password: '12345678' },
        response as unknown as Response,
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-id',
        name: 'Kelson',
        email: 'kelson@gmail.com',
        emailVerified: true,
      },
    });
  });
});
