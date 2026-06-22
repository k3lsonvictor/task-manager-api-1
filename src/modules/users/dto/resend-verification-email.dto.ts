import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationEmailDto {
  @ApiProperty({
    example: 'john.doe@example.com'
  })
  @IsEmail()
  email: string;
}
