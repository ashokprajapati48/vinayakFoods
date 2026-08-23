import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  ChangePasswordDto,
  LoginDto,
  UpdateProfileDto,
} from './dto/auth.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/index.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly cookieOptions = {
    httpOnly: true,
    // Cross-origin cookie delivery in production requires HTTPS and SameSite=None.
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
      | 'none'
      | 'lax',
    path: '/',
  };

  private setAuthCookies(response: Response, tokens: { accessToken: string; refreshToken: string }) {
    // The access token is session-only; the refresh token keeps a session alive
    // across browser restarts. Neither is readable by JavaScript.
    response.cookie('access_token', tokens.accessToken, this.cookieOptions);
    response.cookie('refresh_token', tokens.refreshToken, {
      ...this.cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('access_token', this.cookieOptions);
    response.clearCookie('refresh_token', this.cookieOptions);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, ...tokens } = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );
    this.setAuthCookies(response, tokens);
    return { user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.readCookie(request, 'refresh_token');
    const { user, ...tokens } = await this.authService.refreshTokens(refreshToken || '');
    this.setAuthCookies(response, tokens);
    return { user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(userId);
    this.clearAuthCookies(response);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto.displayName);
  }

  private readCookie(request: Request, name: string): string | undefined {
    const prefix = `${name}=`;
    return request.headers.cookie
      ?.split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length);
  }
}
