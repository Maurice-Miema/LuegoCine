import { Injectable, UnauthorizedException, BadRequestException, } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { randomBytes, createHash } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect.',
      );
    }
    return user;
  }


  private async generateTokens(userId: string,  email: string, nomUtilisateur: string) {
    const payload = {
      sub: userId,
      email,
      nomUtilisateur,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') as StringValue,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') as StringValue,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken( userId: string, refreshToken: string ) {

    const hashedToken = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedToken,
    );
  }

  private sanitizeUser(user: any) {
    const {
      password,
      hashedRefreshToken,
      ...safeUser
    } = user;

    return safeUser;
  }

  async login(loginDto: LoginDto) {

    const user = await this.validateUser(
        loginDto.email,
        loginDto.password,
    );

    const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.nomUtilisateur,
    );

    await this.updateRefreshToken(
        user.id,
        tokens.refreshToken,
    );

    return {
        user: this.sanitizeUser(user),
        ...tokens,
    };
  }

  async register(dto: CreateUserDto) {
    const { data: created } = await this.usersService.create(dto);

    const tokens = await this.generateTokens(
      created.id, 
      created.email, 
      created.nomUtilisateur
    );
    await this.updateRefreshToken(created.id, tokens.refreshToken);

    return { user: created, ...tokens };
  }

  async loginWithGoogle(profile: {
    googleId: string;
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    // Retrouver ou créer le compte utilisateur.
    const user = await this.usersService.findOrCreateGoogleUser(profile);

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.nomUtilisateur,
    );

    await this.updateRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }


  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      return {
        success: false,
        message:
          "Aucun compte LuegoCine n'est associé à cette adresse e-mail. Vérifiez votre adresse ou créez un compte.",
      };
    } 
    const resetToken = randomBytes(32).toString('hex');

    // Stocker uniquement son hash.
    const tokenHash = createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.createPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    const frontendUrl =
      this.configService.getOrThrow<string>('FRONTEND_URL_DEV');

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
    );

    return {
      success: true,
      message:
        `Un e-mail de réinitialisation vient d'être envoyé à ${user.email}. Consultez votre boîte de réception et cliquez sur le lien « Réinitialiser mon mot de passe » pour choisir un nouveau mot de passe. Ce lien est valable pendant 10 minutes.`,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let user;

    try {
      user = await this.usersService.resetPassword(
        tokenHash,
        hashedPassword,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'RESET_TOKEN_INVALID'
      ) {
        throw new BadRequestException(
          'Ce lien de réinitialisation est invalide ou expiré.',
        );
      }

      throw error;
    }

    // Créer une nouvelle session.
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.nomUtilisateur,
    );

    await this.updateRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }


  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
  
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
  
    if (!matches) {
      throw new UnauthorizedException();
    }
  
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.nomUtilisateur,
    );
  
    await this.updateRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
        ),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token invalide.',
      );
    }
  }

  async profile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    await this.usersService.updateHashedRefreshToken(
      userId,
      null,
    );
  }
}



