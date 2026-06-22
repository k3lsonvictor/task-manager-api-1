import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456'
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    example: 'newpassword123'
  })
  @IsString()
  @MinLength(6)
  password: string;
}
