import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const MEMBER_ROLES = ['manager', 'sales', 'ops'] as const;

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsIn(MEMBER_ROLES)
  role!: 'manager' | 'sales' | 'ops';

  /**
   * Optional temporary password. If omitted, server generates one
   * and returns it once in the response (share out-of-band).
   */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdateMemberRoleDto {
  @IsIn(['owner', 'manager', 'sales', 'ops'])
  role!: 'owner' | 'manager' | 'sales' | 'ops';
}
