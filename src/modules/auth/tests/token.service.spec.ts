import { JwtService } from '@nestjs/jwt';

import { TokenService, type TokenConfig } from '../services/token.service';

describe('TokenService', () => {
  const config: TokenConfig = {
    accessSecret: 'a'.repeat(32),
    accessTtl: '15m',
    refreshSecret: 'b'.repeat(32),
    refreshTtl: '7d',
  };
  const jwtService = new JwtService({ secret: config.accessSecret });
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService(jwtService, config);
  });

  describe('ttl conversions', () => {
    it('exposes access ttl in seconds', () => {
      expect(service.accessTtlSeconds).toBe(900);
    });

    it('exposes refresh ttl in seconds', () => {
      expect(service.refreshTtlSeconds).toBe(7 * 86400);
    });
  });

  describe('access tokens', () => {
    it('signs and verifies an access token', () => {
      const { token, expiresIn } = service.signAccessToken({
        sub: 'user-id',
        email: 'a@b.com',
        role: 'user',
      });
      expect(token).toBeDefined();
      expect(expiresIn).toBe(900);

      const decoded = service.verifyAccessToken(token);
      expect(decoded.sub).toBe('user-id');
      expect(decoded.type).toBe('access');
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.role).toBe('user');
    });

    it('rejects access tokens signed with the refresh secret', () => {
      const refreshJwt = new JwtService({ secret: config.refreshSecret });
      const bad = refreshJwt.sign({ sub: 'x' }, { expiresIn: '1h' });
      expect(() => service.verifyAccessToken(bad)).toThrow();
    });
  });

  describe('refresh tokens', () => {
    it('signs and verifies a refresh token with jti', () => {
      const { token, expiresIn } = service.signRefreshToken({
        sub: 'user-id',
        jti: 'jti-1',
      });
      expect(expiresIn).toBe(7 * 86400);

      const decoded = service.verifyRefreshToken(token);
      expect(decoded.sub).toBe('user-id');
      expect(decoded.jti).toBe('jti-1');
      expect(decoded.type).toBe('refresh');
    });
  });
});
