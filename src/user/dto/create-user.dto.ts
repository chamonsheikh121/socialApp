import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
export class CreateUserDto {
  @ApiProperty({ example: 'john Doe' })
  @IsString({ message: 'value always string require' })
  name: string;

  @ApiProperty({ example: 'johnDoe@@722' })
  @IsOptional()
  @IsString()
  password: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}
