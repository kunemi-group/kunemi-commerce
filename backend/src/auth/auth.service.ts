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
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Bank details intentionally empty — owner must complete onboarding before selling.
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

  async me(authUser: AuthUser) {
    const user = await this.users.findOne({
      where: { id: authUser.sub, businessId: authUser.businessId },
    });
    if (!user) throw new NotFoundException('User not found');

    const business = await this.businesses.findOne({
      where: { id: authUser.businessId },
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
    return {
      id: business.id,
      name: business.name,
      whatsappNumber: business.whatsappNumber,
      email: business.email,
      address: business.address,
      tier: business.subscriptionTier,
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
      onboarding: onboardingStatus(business),
    };
  }

  private tokenResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      businessId: user.businessId,
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
