import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './token-payload/token-payload.auth';
import ms from 'ms';
import { Permission } from 'src/utils/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async verifyUser(email: string, password: string) {
    const user = await this.usersService.findOne(email);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Password is not correct');
    return user;
  }

  async login(user: User, response: Response) {
    // Check if user is locked
    if (user.locked) {
      throw new UnauthorizedException(
        'Account is locked. Please contact administrator.',
      );
    }

    const expires = new Date();
    expires.setMilliseconds(
      expires.getMilliseconds() +
        //   ms(this.configService.get<number>('JWT_EXPIRATION')),
        parseInt(this.configService.get<string>('JWT_EXPIRATION')) * 1000,
    );

    const tokenPayload: TokenPayload = {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      permissions: user?.permissions as Permission[],
    };

    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      secure: true,
      httpOnly: true,
      expires,
      sameSite: 'none',
    });

    return {
      tokenPayload,
      token,
    };
  }

  async changePassword(
    payload: {
      currentPassword: string;
      newPassword: string;
    },
    user: TokenPayload,
  ) {
    try {
      const { currentPassword, newPassword } = payload;

      const foundUser = await this.usersService.findOne(user.email);

      const isMatch = await bcrypt.compare(currentPassword, foundUser.password);
      if (!isMatch)
        throw new UnauthorizedException('Current password is not correct');

      await this.usersService.updateUser({
        id: foundUser.id,
        password: newPassword,
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async forgotPassword(email: string) {
    try {
      // Check if user exists
      const user = await this.usersService.findOne(email);

      // Generate UUID token
      const token = uuidv4();

      // Set expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Save token to database
      await this.prismaService.passwordResetToken.create({
        data: {
          token,
          expiresAt,
          userId: user.id,
        },
      });

      // Create reset link
      const resetLink = `${this.configService.get<string>('FE_ENDPOINT')}/auth/reset-password/${token}`;

      // Send email
      const response = await axios.post(
        // `${this.configService.get<string>('N8N_ENDPOINT')}/webhook/send-mail`,
        'http://localhost:5678/webhook/send-mail',
        {
          to: email,
          subject: 'Attendance Password Reset',
          message: `
            <p>You have requested to reset your password for the Attendance system.</p>
            <p>Please click the link below to reset your password:</p>
            <p>Reset Link: <a href="${resetLink}">Reset Password</a></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>
            Attendance System Team</p>
          `
        },
      );

      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      // Don't reveal if email exists or not for security
      throw new BadRequestException(
        'If the email exists, a password reset link has been sent',
      );
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Find the reset token
      const resetToken = await this.prismaService.passwordResetToken.findUnique(
        {
          where: { token },
          include: { user: true },
        },
      );

      if (!resetToken) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Check if token is already used
      if (resetToken.used) {
        throw new BadRequestException('Reset token has already been used');
      }

      // Update user password
      await this.usersService.updateUser({
        id: resetToken.user.id,
        password: newPassword,
      });

      // Mark token as used
      await this.prismaService.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to reset password');
    }
  }
}
