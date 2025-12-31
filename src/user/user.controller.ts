import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { SetMetadata } from '@nestjs/common';



@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiProperty()
  @Post('login')
 async login(@Body() createUserDto: CreateUserDto) {
    return await this.userService.justCheck;
  }

  @ApiProperty({})
  @Post()
  async create(@Body() createUserDtos: CreateUserDto) {
    return await this.userService.create(createUserDtos);
  }
}
