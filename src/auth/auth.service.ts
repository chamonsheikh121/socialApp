import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { MailService } from '../lib/mail/mail.service';
import { CreateUserDtos } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { emailQueue } from '@/lib/bullmq/email.queue';
import { JwtService } from '@nestjs/jwt';
import { jwtPayloadDto } from './dto/jwtPayload.dto';

@Injectable()
export class AuthService {
  private salultRounds: number;
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @Inject('ACCESS_JWT') private readonly accessTokenService: JwtService,
    @Inject('REFRESH_JWT') private readonly refreshTokenService: JwtService,
  ) {
    this.salultRounds = configService.get<number>('SALT_ROUNDS') || 10;
  }

  async register(userData: CreateUserDtos) {
    // Check if user exists
    const existingUser = await this.prisma.client.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    console.log(existingUser);

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      userData.password,
      this.salultRounds,
    );

    console.log('Salt rounds:', this.salultRounds);

    // Create user
    const user = await this.prisma.client.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        fullName: userData.fullName,
        bio: userData.bio,
        role: userData.role === 0 ? 'ADMIN' : 'USER',
      },
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis with 10 minutes TTL
    await this.redis.set(`otp:${user.email}`, otp, 600);

    await emailQueue.add('send-otp-email', {
      type: 'otp',
      to: user.email,
      otp,
    });

    // Send OTP email
    // await this.sendOtpEmail(user.email, otp);

    return {
      message:
        'User registered successfully. Please verify your email it may take 1 min or less',
    };
  }

  async verifyOtp(email: string, otp: string) {
    console.log(`Verifying OTP for email: ${email}`);

    const storedOtp = await this.redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      console.log(`OTP verification failed for ${email}: stored=${storedOtp}, provided=${otp}`);
      throw new Error('Invalid or expired OTP');
    }

    console.log(`OTP verified successfully for ${email}`);

    // Get user information for welcome email
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      throw new Error('User not found');
    }

    console.log(`Found user: ${user.id}, marking as verified`);

    // Mark user as verified
    await this.prisma.client.user.update({
      where: { email },
      data: { isVerified: true },
    });

    console.log(`User ${user.id} marked as verified`);

    // Send welcome email via queue (fire and forget)
    emailQueue.add('send-welcome-email', {
      type: 'welcome',
      to: user.email,
      username: user.username,
    }).catch((error) => {
      console.error('Failed to queue welcome email:', error);
    });

    // Delete OTP from Redis
    await this.redis.del(`otp:${email}`);
    console.log(`OTP deleted from Redis for ${email}`);

    const payload: jwtPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    console.log(`Creating tokens for user ${user.id}`);

    try {
      const accessToken = await this.createAccessToken(payload);
      const refreshToken = await this.createRefreshToken(payload);

      console.log('Tokens created successfully for user:', user.email);

      return {
        message: 'Email verified successfully. Welcome to our social app!',
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error creating tokens:', error);
      throw new Error('Failed to create authentication tokens');
    }
  }

async  createAccessToken(payload: jwtPayloadDto) {
    return await this.accessTokenService.sign(payload);
  }
async  createRefreshToken(payload: jwtPayloadDto) {
    return await this.refreshTokenService.sign(payload);
  }

  async login(loginData: LoginDto) {
    console.log(`Login attempt for email: ${loginData.email}`);

    // Find user by email
    const user = await this.prisma.client.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user) {
      console.log(`User not found for email: ${loginData.email}`);
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${user.email}`);
      throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log(`User ${user.email} is not verified`);
      throw new Error('Please verify your email before logging in');
    }

    console.log(`Login successful for user: ${user.email}`);

    // Create JWT payload
    const payload: jwtPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    try {
      const accessToken = await this.createAccessToken(payload);
      const refreshToken = await this.createRefreshToken(payload);

      console.log('Login tokens created successfully for user:', user.email);

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
      console.error('Error creating login tokens:', error);
      throw new Error('Failed to create authentication tokens');
    }
  }
}
