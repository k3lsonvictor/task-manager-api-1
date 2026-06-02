import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { AUTH_COOKIE_NAME } from '../auth.service';

//Resumo do fluxo:

//Request chega
//↓
//Guard roda
//↓
//Pega token do cookie HTTPOnly
//↓
//Valida com JwtService
//↓
//Se inválido → 401
//↓
//Se válido → request.user = payload
//↓
//Controller executa

type JwtPayload = {
  sub: string;
  email: string;
};

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
  cookies?: Record<string, string>;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      this.extractTokenFromCookie(request) ??
      this.extractTokenFromAuthorizationHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication cookie not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromCookie(
    request: AuthenticatedRequest,
  ): string | undefined {
    const parsedCookie = request.cookies?.[AUTH_COOKIE_NAME];

    if (parsedCookie) {
      return parsedCookie;
    }

    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
      ?.split('=')
      .slice(1)
      .join('=');
  }

  private extractTokenFromAuthorizationHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
