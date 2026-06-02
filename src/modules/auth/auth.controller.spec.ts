import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<AuthService, 'login' | 'refresh' | 'logout'>
  >;

  beforeEach(async () => {
    const authServiceMock = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = authServiceMock;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the access token in the login response body', async () => {
    authService.login.mockResolvedValue({
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
        response as any,
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
