import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import express from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response, Request } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setAuthCookies(
    response: express.Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    };

    response.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions = {
    httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        path: '/',
  };

  private clearAuthCookies(response: express.Response) {
    response.clearCookie('access_token', this.cookieOptions);
    response.clearCookie('refresh_token', this.cookieOptions);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.login(loginDto);

    this.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    return {
      message: 'Connexion réussie.',
      user: result.user,
    };
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true })  response: express.Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    this.setAuthCookies(
      response, 
      accessToken,
      refreshToken
    );
    return { 
      message: 'Compte créé avec succès.', 
      user 
    };
  }


  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
    async googleLogin() {
    // GoogleAuthGuard déclenche automatiquement la redirection vers Google.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const googleProfile = request.user as {
      googleId: string;
      email?: string;
      emailVerified: boolean;
      firstName?: string;
      lastName?: string;
      picture?: string;
    };

    if (!googleProfile.email || !googleProfile.emailVerified) {
      throw new UnauthorizedException(
        'Votre adresse e-mail Google doit être vérifiée.',
      );
    }

    const result = await this.authService.loginWithGoogle({
      ...googleProfile,
      email: googleProfile.email,
    });

    this.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL_DEV');

    return response.redirect(
      `${frontendUrl}/google/callback`,
    );
  }


  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
    );

    this.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    return {
      message: 'Votre mot de passe a été réinitialisé avec succès.',
      user: result.user,
    };
  }


  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token manquant.',
      );
    }

    const payload = await this.authService.verifyRefreshToken(
      refreshToken,
    );

    const result = await this.authService.refresh(
      payload.sub,
      refreshToken,
    );

    this.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    return {
      message: 'Session renouvelée avec succès.',
      user: result.user,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.profile(userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') 
    userId: string,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    await this.authService.logout(userId);

    this.clearAuthCookies(response);

    return {
      message: 'Déconnexion réussie.',
    };
  }

}



