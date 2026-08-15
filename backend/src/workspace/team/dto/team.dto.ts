import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Product: Team only. */
const MEMBER_ROLES = ['team'] as const;

export class InviteMemberDto {
  @ApiProperty({
    example: 'bisi@lagosthreads.co',
    description: 'Staff Email Address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Bisi Akande', description: 'Staff Full Name' })
  @IsString()
  @MinLength(1)
  fullName!: string;

  @ApiProperty({
    example: 'team',
    enum: ['team'],
    description: 'Product role: Team',
  })
  @IsIn(MEMBER_ROLES)
  role!: 'team';

  @ApiPropertyOptional({
    example: 'TempPass123!',
    description: 'Optional initial password (min 8 chars)',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    example: 'team',
    enum: ['owner', 'team'],
    description: 'Product roles: Owner or Team',
  })
  @IsIn(['owner', 'team'])
  role!: 'owner' | 'team';
}
