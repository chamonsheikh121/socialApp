import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('EMAIL_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        this.configService.get<string>('EMAIL_USER'),
      to: options?.to,
      subject: options?.subject,
      text: options?.text,
      html: options?.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mailOptions: MailOptions = {
      to: email,
      subject: 'Your OTP for Email Verification',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your OTP for email verification is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const mailOptions: MailOptions = {
      to: email,
      subject: 'Welcome to Our Social App!',
      text: `Welcome ${username}! Thank you for joining our social app.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Our Social App!</h2>
          <p>Hi ${username},</p>
          <p>Thank you for joining our social app! We're excited to have you as part of our community.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and share posts</li>
            <li>Connect with friends</li>
            <li>Explore content from others</li>
          </ul>
          <p>Start exploring and enjoy your experience!</p>
          <br>
          <p>Best regards,<br>The Social App Team</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions: MailOptions = {
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click this link to reset your password: ${resetUrl}. This link expires in 5 min.`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Password Reset Request</h2>
  <p>You requested a password reset for your account.</p>
  <p>Click the button below to reset your password:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="text-decoration: none;">
      <button 
        style="
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        ">
        Reset Password
      </button>
    </a>
  </div>

  <p>This link expires in 5 min.</p>
  <p>If you didn't request this, please ignore this email.</p>
  <br>
  <p>Best regards,<br>The Social App Team</p>
</div>
`,
    };

    await this.sendMail(mailOptions);
  }

  async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
  ): Promise<void> {
    const mailOptions: MailOptions = {
      to: email,
      subject: title,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${message}</p>
          <br>
          <p>Best regards,<br>The Social App Team</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }

  async sendFollowNotificationEmail(
    email: string,
    followerName: string,
  ): Promise<void> {
    const mailOptions: MailOptions = {
      to: email,
      subject: `${followerName} started following you`,
      text: `${followerName} started following you on our social app.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Follower!</h2>
          <p><strong>${followerName}</strong> started following you.</p>
          <p>Check out their profile and connect back!</p>
          <br>
          <p>Best regards,<br>The Social App Team</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }

  async sendLikeNotificationEmail(
    email: string,
    likerName: string,
    postTitle?: string,
  ): Promise<void> {
    const content = postTitle
      ? `liked your post: "${postTitle}"`
      : 'liked your post';

    const mailOptions: MailOptions = {
      to: email,
      subject: `${likerName} liked your post`,
      text: `${likerName} ${content}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Someone liked your post!</h2>
          <p><strong>${likerName}</strong> ${content}</p>
          <br>
          <p>Best regards,<br>The Social App Team</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }

  async sendCommentNotificationEmail(
    email: string,
    commenterName: string,
    comment: string,
    postTitle?: string,
  ): Promise<void> {
    const content = postTitle
      ? `commented on your post "${postTitle}": "${comment}"`
      : `commented on your post: "${comment}"`;

    const mailOptions: MailOptions = {
      to: email,
      subject: `${commenterName} commented on your post`,
      text: `${commenterName} ${content}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Comment!</h2>
          <p><strong>${commenterName}</strong> ${content}</p>
          <br>
          <p>Best regards,<br>The Social App Team</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);
  }
}
