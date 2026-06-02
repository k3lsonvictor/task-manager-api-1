import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthService,
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_NAME,
} from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import type { CookieOptions, Request, Response } from 'express';

type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    this.setAuthCookies(response, accessToken, refreshToken);

    return { accessToken, user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.extractCookie(request, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie not provided');
    }

    const tokens = await this.authService.refresh(refreshToken);

    this.setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

    return { refreshed: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.extractCookie(request, REFRESH_COOKIE_NAME);

    await this.authService.logout(refreshToken);

    response.clearCookie(AUTH_COOKIE_NAME, this.authCookieBaseOptions());
    response.clearCookie(REFRESH_COOKIE_NAME, this.refreshCookieBaseOptions());
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    response.cookie(AUTH_COOKIE_NAME, accessToken, this.authCookieOptions());
    response.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      this.refreshCookieOptions(),
    );
  }

  private authCookieOptions(): CookieOptions {
    return {
      ...this.authCookieBaseOptions(),
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    };
  }

  private authCookieBaseOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    };
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      ...this.refreshCookieBaseOptions(),
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    };
  }

  private refreshCookieBaseOptions(): CookieOptions {
    return {
      ...this.authCookieBaseOptions(),
      path: '/auth',
    };
  }

  private extractCookie(
    request: RequestWithCookies,
    cookieName: string,
  ): string | undefined {
    const parsedCookie = request.cookies?.[cookieName];

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
      .find((cookie) => cookie.startsWith(`${cookieName}=`))
      ?.split('=')
      .slice(1)
      .join('=');
  }
}
