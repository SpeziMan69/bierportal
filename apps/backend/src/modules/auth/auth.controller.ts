import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt.authguard';
import { GoogleAuthGuard } from './guards/google.authguard';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a user with username, email and password. Returns the new user id and email.',
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({
    summary: 'Log in with email/username and password',
    description: 'On success sets an httpOnly `token` session cookie and returns the user id/email.',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, id, email } = await this.authService.login(dto);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 15,
      path: '/',
    });
    return { id, email };
  }

  @ApiOperation({
    summary: 'Get the current authenticated user',
    description: 'Returns the user decoded from the JWT session cookie. Requires authentication.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request & { user: unknown }) {
    return req.user;
  }

  @ApiOperation({
    summary: 'Set the username for the current user',
    description: 'Used after Google sign-up to choose a username. Requires authentication.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch('set-username')
  async setUsername(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { username: string },
  ) {
    return this.authService.setUsername(req.user.id, body.username);
  }

  @ApiOperation({
    summary: 'Log out',
    description: 'Clears the httpOnly `token` session cookie.',
  })
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return { message: 'Logout erfolgreich' };
  }

  @ApiOperation({
    summary: 'Start Google OAuth login',
    description: 'Redirects to Google for authentication (handled by Passport).',
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {
    // Redirect is handled entirely by GoogleAuthGuard (Passport)
  }

  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Google redirects here after login. Sets the session cookie and redirects to the frontend.',
  })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<void> {
    const tokens = await this.authService.issueTokens(req.user);
    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 15,
      path: '/',
    });
    res.redirect(
      req.user.isUsernameSet === true
        ? `${process.env.FRONTEND_URL}/dashboard`
        : `${process.env.FRONTEND_URL}/choose-username`,
    );
  }

  @ApiOperation({
    summary: 'Delete the current account',
    description:
      'Permanently deletes the authenticated user and cascades to their reviews, likes and beer entries. Clears the session cookie. Requires authentication.',
  })
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(200)
  async deleteAccount(
    @Req() req: Request & { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.delete_user(req.user.id);
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return { message: 'Account deleted' };
  }
}
