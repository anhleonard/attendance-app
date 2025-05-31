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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
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
    };

    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      secure: true,
      httpOnly: true,
      expires,
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
}
