import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

enum RoleEnum {
  ADMIN,
  USER,
}

export class CreateUserDtos {
  @ApiProperty({ example: 'johnDoe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'johnDoe@@722' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  role?: RoleEnum = RoleEnum.USER;
}
