import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from './user-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  public page!: number;

  @ApiProperty({ example: 20 })
  public limit!: number;

  @ApiProperty({ example: 42 })
  public total!: number;

  @ApiProperty({ example: 3 })
  public totalPages!: number;

  @ApiProperty()
  public hasNext!: boolean;

  @ApiProperty()
  public hasPrev!: boolean;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  public data!: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  public meta!: PaginationMetaDto;
}
