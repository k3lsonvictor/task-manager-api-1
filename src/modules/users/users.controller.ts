import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.usersService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification-email')
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.usersService.resendVerificationEmail(dto);
  }
}
