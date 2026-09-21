import { ApiProperty } from '@nestjs/swagger';

import type { UserRole } from '../users.entity';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  public id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  public name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  public email!: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  public role!: UserRole;

  @ApiProperty()
  public isActive!: boolean;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  public lastLoginAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  public createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  public updatedAt!: Date;
}
