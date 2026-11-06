import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request & { cookies?: Record<string, string> }) => {
                return request?.cookies?.access_token ?? null;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: {
        sub: string;
        email: string,
        nomUtilisateur: string;
    }) {
        const user = await this.usersService.findById(payload.sub);
        if(!user){
            throw new UnauthorizedException
        }
        return {
            id: user.id,
            email: user.email,
            nomUtilisateur: user.nomUtilisateur,
        };
    }
}



