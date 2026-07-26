import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../database/entities/business.entity';
import type { AuthUser } from '../common/types/auth-user';
import { onboardingStatus } from '../common/onboarding';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
  ) {}

  async me(user: AuthUser) {
    const business = await this.businesses.findOne({
      where: { id: user.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return this.toDto(business);
  }

  async updateMe(user: AuthUser, dto: UpdateBusinessDto) {
    const business = await this.businesses.findOne({
      where: { id: user.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    if (dto.name !== undefined) business.name = dto.name.trim();
    if (dto.whatsappNumber !== undefined) {
      business.whatsappNumber = dto.whatsappNumber?.trim() || null;
    }
    if (dto.email !== undefined) {
      business.email = dto.email?.trim().toLowerCase() || null;
    }
    if (dto.address !== undefined) {
      business.address = dto.address?.trim() || null;
    }
    if (dto.taxEnabled !== undefined) business.taxEnabled = dto.taxEnabled;
    if (dto.taxRatePercent !== undefined) {
      business.taxRatePercent = dto.taxRatePercent;
    }
    if (dto.taxLabel !== undefined) business.taxLabel = dto.taxLabel.trim();
    if (dto.defaultShippingFeeCents !== undefined) {
      business.defaultShippingFeeCents = dto.defaultShippingFeeCents;
    }
    if (dto.bankName !== undefined) {
      business.bankName = dto.bankName?.trim() || null;
    }
    if (dto.bankAccountName !== undefined) {
      business.bankAccountName = dto.bankAccountName?.trim() || null;
    }
    if (dto.bankAccountNumber !== undefined) {
      business.bankAccountNumber = dto.bankAccountNumber?.trim() || null;
    }
    if (dto.brandColor !== undefined) {
      business.brandColor = dto.brandColor.toLowerCase();
    }

    await this.businesses.save(business);
    return this.toDto(business);
  }

  private toDto(business: Business) {
    return {
      id: business.id,
      name: business.name,
      whatsappNumber: business.whatsappNumber,
      email: business.email,
      address: business.address,
      tier: business.subscriptionTier,
      inventoryOptional: true,
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
}
