import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDtos } from './dto/register.dto';
import { verifyOtpDto } from './dto/verifyOtp.dto';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async register(@Body() userData: CreateUserDtos) {
    return this.authService.register(userData);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: verifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.otp);
  }
}
