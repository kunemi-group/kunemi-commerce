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

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'store';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly storage: StorageService,
    private readonly tenantProvisioner: TenantProvisionerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Bank details intentionally empty — owner must complete onboarding before selling.
    let storeSlug = slugify(dto.businessName);
    const slugTaken = await this.businesses.findOne({ where: { storeSlug } });
    if (slugTaken) {
      storeSlug = `${storeSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const business = this.businesses.create({
      name: dto.businessName,
      whatsappNumber: dto.whatsappNumber?.trim() || null,
      email: dto.email.toLowerCase(),
      subscriptionTier: 'starter',
      taxEnabled: true,
      taxRatePercent: 7.5,
      taxLabel: 'VAT',
      defaultShippingFeeCents: 250000,
      bankName: null,
      bankAccountName: null,
      bankAccountNumber: null,
      brandColor: '#4f6bed',
      currency: 'NGN', // default only — changeable per business (global product)
      defaultPaymentMethod: 'bank_transfer',
      enabledPaymentMethodsJson: '["bank_transfer"]',
      storeSlug,
      storeEnabled: true,
      logoKey: null,
    });
    await this.businesses.save(business);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      businessId: business.id,
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      role: 'owner',
    });
    await this.users.save(user);

    // Provision tenant domain/subdomain mapping in Cloudflare KV
    void this.tenantProvisioner.registerTenant({
      tenantId: business.id,
      slug: storeSlug,
      name: business.name,
    });

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
    return this.tokenResponse(user);
  }

  /** Legacy alias for registerUser */
  async registerBuyer(dto: RegisterUserDto) {
    return this.registerUser(dto);
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
    if (result.user.role === 'user' || result.user.role === 'super_admin') {
      throw new UnauthorizedException(
        'Business accounts sign in on Kunemi Workspace',
      );
    }
    return result;
  }

  /**
   * End User/Buyer Login — ShopFlow users only
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
   * Super Admin Login — Platform operators only
   */
  async adminLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (result.user.role !== 'super_admin') {
      throw new UnauthorizedException(
        'Super admin credentials required',
      );
    }
    return result;
  }

  /** Legacy alias for userLogin */
  async loginBuyer(dto: LoginDto) {
    return this.userLogin(dto);
  }

  /** Legacy alias for businessLogin */
  async loginWorkspace(dto: LoginDto) {
    return this.businessLogin(dto);
  }

  async me(authUser: AuthUser) {
    const user = await this.users.findOne({
      where: { id: authUser.sub },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'user' || user.role === 'super_admin' || !user.businessId) {
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

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
      },
      business: this.businessProfile(business),
    };
  }

  businessProfile(business: Business) {
    let enabledPaymentMethods: string[] = ['bank_transfer'];
    try {
      const parsed = JSON.parse(
        business.enabledPaymentMethodsJson || '["bank_transfer"]',
      ) as string[];
      if (Array.isArray(parsed) && parsed.length) {
        enabledPaymentMethods = parsed;
      }
    } catch {
      /* default */
    }

    return {
      id: business.id,
      name: business.name,
      whatsappNumber: business.whatsappNumber,
      email: business.email,
      address: business.address,
      tier: business.subscriptionTier,
      currency: normalizeCurrency(business.currency),
      payments: {
        defaultMethod: business.defaultPaymentMethod || 'bank_transfer',
        enabledMethods: enabledPaymentMethods,
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
      brandColor: business.brandColor,
      store: {
        slug: business.storeSlug,
        enabled: business.storeEnabled,
        publicPath: business.storeSlug
          ? `/api/store/${business.storeSlug}`
          : null,
      },
      logoKey: business.logoKey,
      logoUrl: this.storage.publicUrl(business.logoKey),
      onboarding: onboardingStatus(business),
    };
  }

  private tokenResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      // Buyers: empty string so staff-scoped services keep string typing
      businessId: user.businessId ?? '',
      role: user.role,
      email: user.email,
    };
    return {
      accessToken: this.jwt.sign(payload),
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
