import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const MEMBER_ROLES = ['manager', 'sales', 'ops'] as const;

export class InviteMemberDto {
  @ApiProperty({ example: 'bisi@lagosthreads.co', description: 'Staff Email Address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Bisi Akande', description: 'Staff Full Name' })
  @IsString()
  @MinLength(1)
  fullName!: string;

  @ApiProperty({ example: 'sales', enum: ['manager', 'sales', 'ops'], description: 'Staff Role' })
  @IsIn(MEMBER_ROLES)
  role!: 'manager' | 'sales' | 'ops';

  @ApiPropertyOptional({ example: 'TempPass123!', description: 'Optional initial password (min 8 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'manager', enum: ['owner', 'manager', 'sales', 'ops'], description: 'Updated role' })
  @IsIn(['owner', 'manager', 'sales', 'ops'])
  role!: 'owner' | 'manager' | 'sales' | 'ops';
}
