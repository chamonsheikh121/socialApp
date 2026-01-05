/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateUserDtos } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { emailQueue } from '@/lib/bullmq/email.queue';
import { JwtService } from '@nestjs/jwt';
import { jwtPayloadDto } from './dto/jwtPayload.dto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Counter } from 'prom-client';
import { register } from 'prom-client';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '../common/error';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AuthService {
  private salultRounds: number;
  private readonly userRegistrations: Counter<string>;
  private readonly userLogins: Counter<string>;
  private readonly otpVerifications: Counter<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    @Inject('ACCESS_JWT') private readonly accessTokenService: JwtService,
    @Inject('REFRESH_JWT') private readonly refreshTokenService: JwtService,
    @Inject('RESET_PASS_JWT')
    private readonly resetPassTokenService: JwtService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {
    this.salultRounds = Number(configService.get<number>('SALT_ROUNDS')) || 10;

    // Custom metrics
    this.userRegistrations = new Counter({
      name: 'social_app_user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['status'],
    });

    this.userLogins = new Counter({
      name: 'social_app_user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['status'],
    });

    this.otpVerifications = new Counter({
      name: 'social_app_otp_verifications_total',
      help: 'Total number of OTP verifications',
      labelNames: ['status'],
    });

    // Register metrics
    register.registerMetric(this.userRegistrations);
    register.registerMetric(this.userLogins);
    register.registerMetric(this.otpVerifications);
  }

  async register(userData: CreateUserDtos) {
    const startTime = Date.now();

    try {
      this.logger.info(
        { email: userData.email, username: userData.username },
        'Attempting user registration',
      );

      // Check if user exists
      const existingUser = await this.prisma.client.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { username: userData.username }],
        },
      });

      if (existingUser) {
        this.logger.warn(
          { email: userData.email, username: userData.username },
          'User already exists',
        );
        this.userRegistrations.inc({ status: 'failed' });
        throw new BadRequestError('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        userData.password,
        this.salultRounds,
      );

      this.logger.debug('Password hashed successfully');

      // Create user
      const user = await this.prisma.client.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
        },
      });

      this.logger.info(
        { userId: user.id, email: user.email },
        'User created successfully',
      );

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in Redis with 10 minutes TTL
      await this.redis.set(`otp:${user.email}`, otp, 600);

      this.logger.debug({ email: user.email }, 'OTP stored in Redis');

      await emailQueue.add('send-otp-email', {
        type: 'otp',
        to: user.email,
        otp,
      });

      this.logger.info({ email: user.email }, 'OTP email queued for sending');

      this.metricsService.incrementUserRegistration();

      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      this.metricsService.recordUserRegistrationDuration(duration);

      return {
        message:
          'User registered successfully. Please verify your email it may take 1 min or less',
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      this.metricsService.recordUserRegistrationDuration(duration);
      throw error;
    }
  }

  async verifyOtp(email: string, otp: string) {
    this.logger.info({ email }, 'Verifying OTP');

    const storedOtp = await this.redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      this.logger.warn({ email, providedOtp: otp }, 'OTP verification failed');
      throw new BadRequestError('Invalid or expired OTP');
    }

    this.logger.info({ email }, 'OTP verified successfully');

    // Get user information for welcome email
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.error({ email }, 'User not found after OTP verification');
      throw new NotFoundError('User not found');
    }

    // Mark user as verified
    await this.prisma.client.user.update({
      where: { email },
      data: { isVerified: true },
    });

    // Send welcome email via queue (fire and forget)
    emailQueue
      .add('send-welcome-email', {
        type: 'welcome',
        to: user.email,
        username: user.username,
      })
      .catch((error) => {
        this.logger.error(
          { email: user.email, error },
          'Failed to queue welcome email',
        );
      });

    // Delete OTP from Redis
    await this.redis.del(`otp:${email}`);

    const payload: jwtPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    try {
      const accessToken = this.createAccessToken(payload);
      const refreshToken = await this.createRefreshToken(payload);

      this.logger.info({ email: user.email }, 'Tokens created successfully');

      this.otpVerifications.inc({ status: 'success' });

      return {
        message: 'Email verified successfully. Welcome to our social app!',
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error({ email: user.email, error }, 'Error creating tokens');
      this.otpVerifications.inc({ status: 'failed' });
      throw new BadRequestError('Failed to create authentication tokens');
    }
  }

  async login(loginData: LoginDto) {
    this.logger.info({ email: loginData.email }, 'Login attempt');

    // Find user by email
    const user = await this.prisma.client.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user) {
      this.logger.warn({ email: loginData.email }, 'User not found');
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      this.logger.warn({ email: user.email }, 'Invalid password');
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
      this.logger.warn({ email: user.email }, 'User not verified');
      // Delete OTP from Redis if it exists
      const exists = await this.redis.get(`otp:${user.email}`);

      if (exists) {
        this.logger.info({ email: loginData.email }, 'removing old otp');
        await this.redis.del(`otp:${user.email}`);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP in Redis with 10 minutes TTL
      await this.redis.set(`otp:${user.email}`, otp, 600);

      this.logger.debug({ email: user.email }, 'OTP stored in Redis');

      await emailQueue.add('send-otp-email', {
        type: 'otp',
        to: user.email,
        otp,
      });

      throw new UnauthorizedError(
        'Check your email for OTP to verify your account',
      );
    }

    this.logger.info({ email: user.email }, 'Login successful');

    // Create JWT payload
    const payload: jwtPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    try {
      const accessToken = this.createAccessToken(payload);
      const refreshToken = await this.createRefreshToken(payload);

      this.logger.info(
        { email: user.email },
        'Login tokens created successfully',
      );

      this.userLogins.inc({ status: 'success' });

      return {
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        { email: user.email, error },
        'Error creating login tokens',
      );
      this.userLogins.inc({ status: 'failed' });
      throw new Error('Failed to create authentication tokens');
    }
  }

  async forgetPassword(email: string) {
    this.logger.info({ email }, 'Password reset requested');

    // Check if user exists
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(
        { email },
        'Password reset requested for non-existent user',
      );
      // Don't reveal if user exists or not for security
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const payload: jwtPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate reset token
    const resetToken = this.generateResetToken(payload);

    // Store reset token in Redis with 5min TTL
    await this.redis.set(`reset:${resetToken}`, user.email, 300);

    this.logger.debug({ email }, 'Reset token stored in Redis');

    // Send password reset email via queue
    await emailQueue.add('send-password-reset-email', {
      type: 'password-reset',
      to: user.email,
      resetToken,
    });

    this.logger.info({ email }, 'Password reset email queued for sending');

    return {
      message: 'If the email exists, a password reset link has been sent.',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    this.logger.info('Password reset attempt');

    // Get email from Redis
    const email = await this.redis.get(`reset:${token}`);
    if (!email) {
      this.logger.warn({ token }, 'Invalid or expired reset token');
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Find user
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.error({ email }, 'User not found during password reset');
      throw new NotFoundError('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.salultRounds);

    // Update password
    await this.prisma.client.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    // Delete reset token from Redis
    await this.redis.del(`reset:${token}`);

    this.logger.info({ email }, 'Password reset successfully');

    return { message: 'Password reset successfully' };
  }

  createAccessToken(payload: jwtPayloadDto) {
    return this.accessTokenService.sign(payload);
  }

  async createRefreshToken(payload: jwtPayloadDto) {
    const refreshToken = this.refreshTokenService.sign(payload);

    // Persist refresh token in the database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const existing = await this.prisma.client.refreshToken.findFirst({
      where: { userId: payload.userId, revoked: false },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await this.prisma.client.refreshToken.update({
        where: { id: existing.id },
        data: {
          token: refreshToken,
          expiresAt,
        },
      });
    } else {
      await this.prisma.client.refreshToken.create({
        data: {
          userId: payload.userId,
          token: refreshToken,
          expiresAt,
        },
      });
    }

    return refreshToken;
  }

  async refreshAccessToken(refreshToken: string) {
    this.logger.info('Refresh token request received');

    if (!refreshToken) {
      this.logger.warn('No refresh token provided');
      throw new UnauthorizedError('Refresh token is required');
    }

    let decoded: jwtPayloadDto & { exp?: number; iat?: number };
    try {
      decoded = this.refreshTokenService.verify<
        jwtPayloadDto & { exp?: number; iat?: number }
      >(refreshToken);
    } catch (error) {
      this.logger.warn({ error }, 'Invalid refresh token during verify');
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenRecord = await this.prisma.client.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      this.logger.warn('Refresh token not found in database');
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (tokenRecord.revoked) {
      this.logger.warn({ id: tokenRecord.id }, 'Refresh token is revoked');
      throw new UnauthorizedError('Refresh token is revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      this.logger.warn({ id: tokenRecord.id }, 'Refresh token is expired');
      throw new UnauthorizedError('Refresh token has expired');
    }

    const payload: jwtPayloadDto = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const accessToken = this.createAccessToken(payload);

    this.logger.info(
      { userId: payload.userId },
      'Access token refreshed successfully',
    );

    return { accessToken };
  }

  async logout(userId: string) {
    this.logger.info({ userId }, 'Logout attempt');

    try {
      const refreshToken = await this.prisma.client.refreshToken.findFirst({
        where: { userId, revoked: false },
      });

      if (!refreshToken) {
        this.logger.warn({ userId }, 'No active refresh token found');
        return { message: 'Logged out successfully' };
      }

      await this.prisma.client.refreshToken.update({
        where: { id: refreshToken.id },
        data: { revoked: true },
      });

      this.logger.info(
        { userId, tokenId: refreshToken.id },
        'Refresh token revoked successfully',
      );

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error({ userId, error }, 'Error during logout');
      throw new BadRequestError('Failed to logout');
    }
  }

  private generateResetToken(payload: jwtPayloadDto): string {
    return this.resetPassTokenService.sign(payload);
  }
}
