import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenPayload } from './token-payload/token-payload.auth';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log("🔐 Backend received login request");
    console.log("👤 User:", user?.email || 'No user');
    console.log("📅 Timestamp:", new Date().toISOString());
    return this.authService.login(user, response);
  }

  @Post('logout')
  logout(@Res() response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: true,
      sameSite: 'none',
    });

    return response.send({ message: 'Logged out successfully' });
  }

  // thay đổi password
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body() payload: { currentPassword: string; newPassword: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.authService.changePassword(payload, user);
  }

  // send email để reset password
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  // reset khi không nhớ password
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
