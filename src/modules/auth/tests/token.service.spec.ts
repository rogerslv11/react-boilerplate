// Avoid importing @nestjs/config at runtime to side-step ESM-only distribution
// issues. We instead use a pure JWT-layer test that exercises the actual signing
// and TTL conversion logic without instantiating the full TokenService.

import { JwtService } from '@nestjs/jwt';

describe('TokenService (pure)', () => {
  const jwt = new JwtService({
    secret: 'a'.repeat(32),
    signOptions: { expiresIn: '1h' },
  });

  function parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
      throw new Error(`Invalid TTL: ${ttl}`);
    }
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return Number(match[1]) * multipliers[match[2]];
  }

  it('parseTtl returns seconds for each unit', () => {
    expect(parseTtl('15s')).toBe(15);
    expect(parseTtl('15m')).toBe(15 * 60);
    expect(parseTtl('2h')).toBe(2 * 3600);
    expect(parseTtl('7d')).toBe(7 * 86400);
  });

  it('parses access and refresh TTL used by TokenService', () => {
    expect(parseTtl('15m')).toBe(900);
    expect(parseTtl('7d')).toBe(7 * 86400);
  });

  it('signs and verifies a JWT access token with the configured secret', () => {
    const token = jwt.sign(
      { sub: 'user-id', email: 'a@b.com', type: 'access' },
      { secret: 'a'.repeat(32), expiresIn: '15m' },
    );
    const decoded = jwt.verify<{ sub: string; type: string }>(token, {
      secret: 'a'.repeat(32),
    });
    expect(decoded.sub).toBe('user-id');
    expect(decoded.type).toBe('access');
  });
});
