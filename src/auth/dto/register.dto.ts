import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDtos {
  @ApiProperty({ example: 'Chamon' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  password: string;
}
