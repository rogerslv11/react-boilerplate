import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenPairDto {
  @ApiProperty()
  public accessToken!: string;

  @ApiProperty({ required: false })
  public refreshToken?: string;

  @ApiProperty({ example: 900 })
  public accessExpiresIn!: number;

  @ApiProperty({ example: 604800 })
  public refreshExpiresIn!: number;

  @ApiProperty({ enum: ['Bearer'] })
  public tokenType!: string;
}

export class AuthenticatedUserDto {
  @ApiProperty({ format: 'uuid' })
  public id!: string;

  @ApiProperty({ example: 'jane@example.com' })
  public email!: string;

  @ApiProperty()
  public name!: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  public role!: 'user' | 'admin';
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthTokenPairDto })
  public tokens!: AuthTokenPairDto;

  @ApiProperty({ type: AuthenticatedUserDto })
  public user!: AuthenticatedUserDto;
}

export class RegisterResponseDto {
  @ApiProperty({ type: AuthTokenPairDto })
  public tokens!: AuthTokenPairDto;

  @ApiProperty({ type: AuthenticatedUserDto })
  public user!: AuthenticatedUserDto;
}
