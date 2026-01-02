import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

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
}
