import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  //@UseGuards(JwtAuthGuard)
  @Public()
  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }
}
