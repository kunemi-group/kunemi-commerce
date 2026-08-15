import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Business } from '../../database/entities/business.entity';
import { User } from '../../database/entities/user.entity';
import type { AuthUser, JwtPayload } from '../../common/types/auth-user';
import { onboardingStatus } from '../../common/onboarding';
import { normalizeCurrency } from '../../common/currency';
import { StorageService } from '../storage/storage.service';
import { TenantProvisionerService } from '../../common/services/tenant-provisioner.service';
import {
  LoginDto,
  RegisterUserDto,
  RegisterDto,
  VerifyEmailDto,
  ResendOtpDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

import { MailService } from '../mail/mail.service';
import { randomInt } from 'crypto';

function sixDigitOtp() {
  return randomInt(100000, 1000000).toString();
}

/** Owner or Team seat on a business (product surface; not buyer/admin). */
function isWorkspaceBusinessAccount(user: Pick<User, 'businessId' | 'role'>) {
  return (
    Boolean(user.businessId) && (user.role === 'owner' || user.role === 'team')
  );
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `store-${Date.now()}`;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    private readonly jwt: JwtService,
    private readonly storage: StorageService,
    private readonly tenantProvisioner: TenantProvisionerService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Business/Seller registration: creates business + owner user account.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const storeSlug = slugify(dto.businessName);

    const business = this.businesses.create({
      name: dto.businessName.trim(),
      email,
      whatsappNumber: dto.whatsappNumber?.trim() || null,
      address: null,
      taxEnabled: false,
      taxRatePercent: 0,
      taxLabel: 'VAT',
      defaultShippingFeeCents: 0,
      bankName: null,
      bankAccountName: null,
      bankAccountNumber: null,
      brandColor: '#4f6bed',
      storeSlug,
      storeEnabled: true,
      logoKey: null,
      subscriptionTier: 'starter',
      currency: 'NGN',
    });

    await this.businesses.save(business);

    const otp = sixDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = this.users.create({
      businessId: business.id,
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: 'owner',
      isEmailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationExpiresAt: otpExpiresAt,
      mustChangePassword: false,
    });

    await this.users.save(user);

    // Provision tenant domain/subdomain mapping in Cloudflare KV
    void this.tenantProvisioner.registerTenant({
      tenantId: business.id,
      slug: storeSlug,
      name: business.name,
    });

    // Send Welcome / Registration email with 6-digit OTP via SendByte
    void this.mailService.sendRegistrationVerification(
      user.email,
      user.fullName,
      otp,
    );

    return await this.tokenResponse(user);
  }

  /** ShopFlow end user registration — no business, no Workspace access */
  async registerUser(dto: RegisterUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otp = sixDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = this.users.create({
      businessId: null,
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: 'user',
      isEmailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationExpiresAt: otpExpiresAt,
      mustChangePassword: false,
    });
    await this.users.save(user);

    // Send Welcome / Registration email with 6-digit OTP via SendByte
    void this.mailService.sendRegistrationVerification(
      user.email,
      user.fullName,
      otp,
    );

    return await this.tokenResponse(user);
  }

  /** Confirm 6-digit email verification OTP */
  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.isEmailVerified) {
      const tokens = await this.tokenResponse(user);
      return {
        message: 'Email address is already verified',
        verified: true,
        ...tokens,
      };
    }
    if (
      !user.emailVerificationOtp ||
      user.emailVerificationOtp !== dto.otp.trim()
    ) {
      throw new BadRequestException('Invalid verification OTP code');
    }
    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Verification OTP code has expired. Please request a new code.',
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationExpiresAt = null;
    await this.users.save(user);

    const tokens = await this.tokenResponse(user);
    return {
      message: 'Email address verified successfully!',
      verified: true,
      ...tokens,
    };
  }

  /** Resend 6-digit email verification OTP */
  async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.isEmailVerified) {
      return { message: 'Email address is already verified' };
    }
    const otp = sixDigitOtp();
    user.emailVerificationOtp = otp;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.users.save(user);

    void this.mailService.sendRegistrationVerification(
      user.email,
      user.fullName,
      otp,
    );

    return {
      message:
        'A new 6-digit verification OTP code has been sent to your email.',
    };
  }

  /**
   * Change password while signed in.
   * Required after team invite (mustChangePassword).
   */
  async changePassword(authUser: AuthUser, dto: ChangePasswordDto) {
    const user = await this.users.findOne({ where: { id: authUser.sub } });
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const next = dto.newPassword.trim();
    if (next.length < 8) {
      throw new BadRequestException(
        'New password must be at least 8 characters',
      );
    }
    if (await bcrypt.compare(next, user.passwordHash)) {
      throw new BadRequestException(
        'New password must be different from your current password',
      );
    }

    user.passwordHash = await bcrypt.hash(next, 10);
    user.mustChangePassword = false;
    user.passwordResetOtp = null;
    user.passwordResetExpiresAt = null;
    // Force re-login on other devices by rotating refresh session
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.users.save(user);

    return this.tokenResponse(user);
  }

  /**
   * Start Workspace Owner/Team password reset.
   * Always returns a generic message (no account enumeration).
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const generic = {
      message:
        'If an account exists for that email, a reset code has been sent.',
    };

    const user = await this.users.findOne({ where: { email } });
    if (!user) return generic;

    // Workspace business accounts only (Owner / Team — not buyers / platform admins)
    if (!isWorkspaceBusinessAccount(user)) {
      return generic;
    }

    const otp = sixDigitOtp();
    user.passwordResetOtp = otp;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.users.save(user);

    void this.mailService.sendPasswordResetOtp(user.email, user.fullName, otp);
    return generic;
  }

  /** Complete password reset with OTP (Workspace Owner or Team). */
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.passwordResetOtp) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (!isWorkspaceBusinessAccount(user)) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (user.passwordResetOtp !== dto.otp.trim()) {
      throw new BadRequestException('Invalid or expired reset code');
    }
    if (
      user.passwordResetExpiresAt &&
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Reset code has expired. Request a new one.',
      );
    }

    const next = dto.newPassword.trim();
    if (next.length < 8) {
      throw new BadRequestException(
        'New password must be at least 8 characters',
      );
    }

    user.passwordHash = await bcrypt.hash(next, 10);
    user.mustChangePassword = false;
    user.passwordResetOtp = null;
    user.passwordResetExpiresAt = null;
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.users.save(user);

    return {
      message: 'Password updated. You can sign in with your new password.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return await this.tokenResponse(user);
  }

  /**
   * Business/Seller Login — Workspace Owner or Team only (not buyers / platform admins).
   */
  async businessLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (
      result.user.role === 'user' ||
      result.user.role === 'super_admin' ||
      result.user.role === 'admin' ||
      !result.user.businessId
    ) {
      throw new UnauthorizedException(
        'Use a Kunemi Workspace business account (Owner or Team) to sign in here',
      );
    }
    return result;
  }

  /**
   * End User Login — ShopFlow users only
   */
  async userLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (result.user.role !== 'user') {
      throw new UnauthorizedException(
        'Business accounts sign in on Kunemi Workspace, not ShopFlow',
      );
    }
    return result;
  }

  /**
   * Admin Login — Platform operators only (admin, super_admin)
   */
  async adminLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (result.user.role !== 'super_admin' && result.user.role !== 'admin') {
      throw new UnauthorizedException('Platform admin credentials required');
    }
    return result;
  }

  async me(authUser: AuthUser) {
    const user = await this.users.findOne({
      where: { id: authUser.sub },
    });
    if (!user) throw new NotFoundException('User not found');

    if (
      user.role === 'user' ||
      user.role === 'super_admin' ||
      user.role === 'admin' ||
      !user.businessId
    ) {
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          businessId: null,
          mustChangePassword: Boolean(user.mustChangePassword),
          isEmailVerified: Boolean(user.isEmailVerified),
        },
        business: null,
      };
    }

    const business = await this.businesses.findOne({
      where: { id: user.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const logoUrl = this.storage.publicUrl(business.logoKey);

    const subscriptionTier = business.subscriptionTier || 'starter';
    const currency = normalizeCurrency(business.currency);
    const enabledPaymentMethods = (() => {
      try {
        const parsed = JSON.parse(business.enabledPaymentMethodsJson || '[]');
        return Array.isArray(parsed) && parsed.length
          ? parsed
          : ['bank_transfer'];
      } catch {
        return ['bank_transfer'];
      }
    })();

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: business.id,
        mustChangePassword: Boolean(user.mustChangePassword),
        isEmailVerified: Boolean(user.isEmailVerified),
      },
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        whatsappNumber: business.whatsappNumber,
        address: business.address,
        taxEnabled: business.taxEnabled,
        taxRatePercent: Number(business.taxRatePercent),
        taxLabel: business.taxLabel,
        defaultShippingFeeCents: business.defaultShippingFeeCents,
        bankName: business.bankName,
        bankAccountName: business.bankAccountName,
        bankAccountNumber: business.bankAccountNumber,
        brandColor: business.brandColor,
        storeSlug: business.storeSlug,
        storeEnabled: business.storeEnabled,
        logoKey: business.logoKey,
        logoUrl,
        subscriptionTier,
        currency,
        tier: subscriptionTier,
        inventoryOptional: true,
        whatsapp: business.whatsappNumber,
        payments: {
          defaultMethod: business.defaultPaymentMethod || 'bank_transfer',
          enabledMethods: enabledPaymentMethods,
          bank: {
            bankName: business.bankName,
            accountName: business.bankAccountName,
            accountNumber: business.bankAccountNumber,
          },
        },
        tax: {
          enabled: business.taxEnabled,
          ratePercent: Number(business.taxRatePercent),
          label: business.taxLabel,
        },
        shipping: {
          defaultFeeCents: business.defaultShippingFeeCents,
        },
        bank: {
          bankName: business.bankName,
          accountName: business.bankAccountName,
          accountNumber: business.bankAccountNumber,
        },
        store: {
          slug: business.storeSlug,
          enabled: business.storeEnabled,
          publicPath: business.storeSlug
            ? `/api/store/${business.storeSlug}`
            : null,
        },
        branding: {
          brandColor: business.brandColor,
          logoDataUrl: null,
        },
        onboarding: onboardingStatus(business),
      },
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: { sub: string; tokenType?: string };
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    if (user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token has expired. Please sign in again.',
      );
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.tokenResponse(user);
  }

  async logout(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (user) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await this.users.save(user);
    }
    return { message: 'Logged out successfully' };
  }

  private async tokenResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      businessId: user.businessId ?? '',
      role: user.role,
      email: user.email,
    };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(
      { sub: user.id, tokenType: 'refresh' },
      { expiresIn: '7d' },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.users.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
        isEmailVerified: user.isEmailVerified,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
    };
  }
}
