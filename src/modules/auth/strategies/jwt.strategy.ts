import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '@/common/decorators/user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Validates access tokens and normalizes the payload into the
 * `AuthUser` shape used by controllers.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('auth.jwtSecret');
    if (!secret) {
      throw new Error('auth.jwtSecret is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
