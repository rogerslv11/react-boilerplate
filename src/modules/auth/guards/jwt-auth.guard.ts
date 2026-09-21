import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard Bearer JWT guard. Throws 401 if the token is missing,
 * malformed, expired or otherwise invalid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
