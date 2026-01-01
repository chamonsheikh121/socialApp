import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDtos } from './dto/register.dto';
import { verifyOtpDto } from './dto/verifyOtp.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async register(@Body() userData: CreateUserDtos) {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() loginData: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginData);

    res.cookie('refresh-token', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove refreshToken from response body since it's in the cookie
    const { refreshToken, ...response } = result;
    return res.json(response);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: verifyOtpDto, @Res() res: Response) {
    const result = await this.authService.verifyOtp(body.email, body.otp);

    res.cookie('refresh-token', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Remove refreshToken from response body since it's in the cookie
    const { refreshToken, ...response } = result;
    return res.json(response);
  }
}
