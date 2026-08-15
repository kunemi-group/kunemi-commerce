import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Product surface: Team only. Stored as `sales` for backward compatibility. */
const MEMBER_ROLES = ['sales'] as const;

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
    example: 'sales',
    enum: ['sales'],
    description: 'Team role (product: Team; stored as sales)',
  })
  @IsIn(MEMBER_ROLES)
  role!: 'sales';

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
    example: 'sales',
    enum: ['owner', 'sales'],
    description:
      'Owner or Team (sales). Legacy manager/ops may still exist in DB.',
  })
  @IsIn(['owner', 'sales'])
  role!: 'owner' | 'sales';
}
