import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/** Workspace: create business + owner */
export class RegisterDto {
  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}

/** ShopFlow: buyer only (no business) */
export class RegisterBuyerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
