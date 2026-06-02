import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    guard = new JwtAuthGuard(jwtService as JwtService, reflector as Reflector);
  });

  it('authenticates requests with a bearer token', async () => {
    const request = {
      headers: {
        authorization: 'Bearer access-token',
      },
    };
    const payload = {
      sub: 'user-id',
      email: 'kelson@gmail.com',
    };

    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('access-token');
    expect(request).toEqual({
      headers: {
        authorization: 'Bearer access-token',
      },
      user: payload,
    });
  });

  it('rejects requests without a cookie or bearer token', async () => {
    await expect(guard.canActivate(createContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
