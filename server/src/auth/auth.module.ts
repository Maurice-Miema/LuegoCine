
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { StringValue } from 'ms';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailModule } from '../mail/mail.module';


@Module({
  imports: [
    UsersModule,
    MailModule,

    PassportModule.register({
      session: false,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'ACCESS_TOKEN_EXPIRES_IN',
          ) as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
