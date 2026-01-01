import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsUUID } from 'class-validator';

export class jwtPayloadDto {
  @IsUUID()
  @ApiProperty()
  userId: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @ApiProperty()
  role: string;
}



