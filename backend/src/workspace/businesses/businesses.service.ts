import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Business } from '../../database/entities/business.entity';
import type { AuthUser } from '../../common/types/auth-user';
import { onboardingStatus } from '../../common/onboarding';
import {
  isSupportedCurrency,
  normalizeCurrency,
} from '../../common/currency';
import { StorageService } from '../../shared/storage/storage.service';
import { TenantProvisionerService } from '../../common/services/tenant-provisioner.service';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    private readonly storage: StorageService,
    private readonly tenantProvisioner: TenantProvisionerService,
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
    if (dto.storeSlug !== undefined) {
      const slug = dto.storeSlug?.trim().toLowerCase() || null;
      if (slug) {
        const taken = await this.businesses.findOne({
          where: { storeSlug: slug, id: Not(business.id) },
        });
        if (taken) {
          throw new ConflictException('Store slug already in use');
        }
      }
      business.storeSlug = slug;
    }
    if (dto.storeEnabled !== undefined) {
      business.storeEnabled = dto.storeEnabled;
    }
    if (dto.logoKey !== undefined) {
      if (dto.logoKey === null && business.logoKey) {
        await this.storage.delete(business.logoKey);
      }
      business.logoKey = dto.logoKey;
    }
    if (dto.currency !== undefined) {
      const c = normalizeCurrency(dto.currency);
      if (!isSupportedCurrency(c)) {
        throw new BadRequestException(
          `Unsupported currency ${c}. Use a supported ISO code.`,
        );
      }
      business.currency = c;
    }
    if (dto.defaultPaymentMethod !== undefined) {
      business.defaultPaymentMethod = dto.defaultPaymentMethod;
    }
    if (dto.enabledPaymentMethods !== undefined) {
      const methods = dto.enabledPaymentMethods.length
        ? dto.enabledPaymentMethods
        : ['bank_transfer'];
      if (!methods.includes('bank_transfer')) {
        methods.unshift('bank_transfer');
      }
      business.enabledPaymentMethodsJson = JSON.stringify(methods);
    }

    await this.businesses.save(business);

    // Sync updated tenant slug mapping in Cloudflare KV
    if (business.storeSlug) {
      void this.tenantProvisioner.registerTenant({
        tenantId: business.id,
        slug: business.storeSlug,
        name: business.name,
      });
    }

    return this.toDto(business);
  }

  private toDto(business: Business) {
    let enabledPaymentMethods: string[] = ['bank_transfer'];
    try {
      const parsed = JSON.parse(
        business.enabledPaymentMethodsJson || '["bank_transfer"]',
      ) as string[];
      if (Array.isArray(parsed) && parsed.length) enabledPaymentMethods = parsed;
    } catch {
      /* keep default */
    }

    return {
      id: business.id,
      name: business.name,
      whatsappNumber: business.whatsappNumber,
      email: business.email,
      address: business.address,
      tier: business.subscriptionTier,
      inventoryOptional: true,
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
}
