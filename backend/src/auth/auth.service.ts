import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Business } from '../database/entities/business.entity';
import { User } from '../database/entities/user.entity';
import type { AuthUser, JwtPayload } from '../common/types/auth-user';
import { onboardingStatus } from '../common/onboarding';
import { normalizeCurrency } from '../common/currency';
import { StorageService } from '../storage/storage.service';
import { TenantProvisionerService } from '../common/services/tenant-provisioner.service';
import { LoginDto, RegisterUserDto, RegisterDto } from './dto/auth.dto';

import { MailService } from '../mail/mail.service';

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

    const user = this.users.create({
      businessId: business.id,
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: 'owner',
    });

    await this.users.save(user);

    // Provision tenant domain/subdomain mapping in Cloudflare KV
    void this.tenantProvisioner.registerTenant({
      tenantId: business.id,
      slug: storeSlug,
      name: business.name,
    });

    // Send Welcome / Registration email via SendByte
    void this.mailService.sendRegistrationVerification(
      user.email,
      user.fullName,
      'VERIFIED',
    );

    return this.tokenResponse(user);
  }

  /** ShopFlow end user registration — no business, no Workspace access */
  async registerUser(dto: RegisterUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      businessId: null,
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: 'user',
    });
    await this.users.save(user);

    // Send Welcome / Registration email via SendByte
    void this.mailService.sendRegistrationVerification(
      user.email,
      user.fullName,
      'VERIFIED',
    );

    return this.tokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokenResponse(user);
  }

  /**
   * Business/Seller Login — staff accounts only (owner/manager/sales/ops)
   */
  async businessLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (result.user.role === 'user' || result.user.role === 'super_admin' || result.user.role === 'admin') {
      throw new UnauthorizedException(
        'Business accounts sign in on Kunemi Workspace',
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
      throw new UnauthorizedException(
        'Platform admin credentials required',
      );
    }
    return result;
  }

  async me(authUser: AuthUser) {
    const user = await this.users.findOne({
      where: { id: authUser.sub },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'user' || user.role === 'super_admin' || user.role === 'admin' || !user.businessId) {
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          businessId: null,
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

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: business.id,
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
        onboarding: onboardingStatus(business),
      },
    };
  }

  private tokenResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      businessId: user.businessId ?? '',
      role: user.role,
      email: user.email,
    };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
      },
    };
  }
}
