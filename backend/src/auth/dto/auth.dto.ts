import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Workspace: create business + owner */
export class RegisterDto {
  @ApiProperty({ example: 'Lagos Threads', description: 'Business/Store Name' })
  @IsString()
  @MinLength(2)
  businessName!: string;

  @ApiProperty({ example: 'owner@lagosthreads.co', description: 'Owner Email Address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Owner Account Password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Adeola Johnson', description: 'Owner Full Name' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional({ example: '+2348012345678', description: 'Business WhatsApp Phone Number' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}

/** ShopFlow: end user only (no business) */
export class RegisterUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User Email Address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'userpass123', description: 'User Account Password' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Chidi Okafor', description: 'User Full Name' })
  @IsString()
  @MinLength(2)
  fullName!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'owner@lagosthreads.co', description: 'Account Email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Account Password' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'owner@lagosthreads.co', description: 'Account Email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '849201', description: '6-digit OTP Verification Code' })
  @IsString()
  @MinLength(6)
  otp!: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'owner@lagosthreads.co', description: 'Account Email' })
  @IsEmail()
  email!: string;
}
