import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateUserDtos } from './dto/register.dto';
import  bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(configService.get<string>('EMAIL_PORT') || '587'),
      secure: false,
      auth: {
        user: configService.get<string>('EMAIL_USER'),
        pass: configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async register(userData: CreateUserDtos) {
    // Check if user exists
    const existingUser = await this.prisma.client.user.findFirst({
      where: { OR: [{ email: userData.email }, { username: userData.username }] },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await this.prisma.client.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        bio: userData.bio,
        role: userData.role === 0 ? 'ADMIN' : 'USER',
      },
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis with 10 minutes TTL
    await this.redis.set(`otp:${user.email}`, otp, 600);

    // Send OTP email
    await this.sendOtpEmail(user.email, otp);

    return { message: 'User registered successfully. Please verify your email with the OTP sent.' };
  }

  private async sendOtpEmail(email: string, otp: string) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP for Email Verification',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = await this.redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark user as verified
    await this.prisma.client.user.update({
      where: { email },
      data: { isVerified: true },
    });

    // Delete OTP from Redis
    await this.redis.del(`otp:${email}`);

    return { message: 'Email verified successfully' };
  }
}
