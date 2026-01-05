import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDtos } from './dto/register.dto';
import { verifyOtpDto } from './dto/verifyOtp.dto';
import { LoginDto } from './dto/login.dto';
import { ForgetPasswordDto } from './dto/forgetPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { jwtPayloadDto } from './dto/jwtPayload.dto';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async register(@Body() userData: CreateUserDtos) {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() loginData: LoginDto) {
    const result = await this.authService.login(loginData);

    // Remove refreshToken from response body since it's in the cookie
    return result;
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: verifyOtpDto) {
    const result = await this.authService.verifyOtp(body.email, body.otp);

    return result;
  }

  @Post('forget-password')
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    return this.authService.forgetPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: jwtPayloadDto) {
    return this.authService.logout(user.userId);
  }
}
