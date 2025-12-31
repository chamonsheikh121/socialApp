import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDtos: CreateUserDto) {
    const existingUser = await this.prisma.client.user.findFirst({
      where: { email: createUserDtos.email },
    });

    if (existingUser) {
      throw new HttpException('user already exist', 409);
    }

    // return await this.prisma.client.user.create({ data: createUserDtos });
  }

  async justCheck() {
    return 'decorate success';
  }
}
