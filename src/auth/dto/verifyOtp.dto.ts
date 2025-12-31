import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

enum RoleEnum {
  ADMIN,
  USER,
}

export class verifyOtpDto {
  @ApiProperty({ example: 'johnDoe@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}
