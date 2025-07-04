import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenPayload } from './token-payload/token-payload.auth';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(user, response);
  }

  @Post('logout')
  logout(@Res() response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: true,
    });

    return response.send({ message: 'Logged out successfully' });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body() payload: { currentPassword: string; newPassword: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.authService.changePassword(payload, user);
  }
}
