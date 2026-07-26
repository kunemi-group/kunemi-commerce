import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}

  async onModuleInit() {
    if (this.config.get('SEED_ON_BOOT') !== 'true') return;
    const count = await this.businesses.count();
    if (count > 0) {
      this.logger.log('Seed skipped — businesses already exist');
      return;
    }

    const business = await this.businesses.save(
      this.businesses.create({
        name: 'Lagos Threads Co.',
        whatsappNumber: '+234 801 234 5678',
        email: 'owner@lagosthreads.co',
        address: '12 Allen Ave, Ikeja, Lagos',
        subscriptionTier: 'growth',
        taxEnabled: true,
        taxRatePercent: 7.5,
        taxLabel: 'VAT',
        defaultShippingFeeCents: 250000,
        bankName: 'GTBank',
        bankAccountName: 'Lagos Threads Co.',
        bankAccountNumber: '0123456789',
        brandColor: '#4f6bed',
      }),
    );

    const passwordHash = await bcrypt.hash('password123', 10);
    await this.users.save(
      this.users.create({
        businessId: business.id,
        email: 'owner@lagosthreads.co',
        passwordHash,
        fullName: 'Amaka Obi',
        role: 'owner',
      }),
    );

    // Optional sample product (inventory is optional — seed one for demo)
    const product = await this.products.save(
      this.products.create({
        businessId: business.id,
        name: 'Ankara Maxi Dress',
        description: 'Demo catalog item',
      }),
    );
    await this.variants.save(
      this.variants.create({
        productId: product.id,
        businessId: business.id,
        sku: 'AMX-M-RED',
        attributes: { size: 'M', color: 'Red' },
        priceCents: 1850000,
        stockOnHand: 20,
        stockReserved: 0,
        taxExempt: false,
      }),
    );

    this.logger.log(
      'Seeded demo business owner@lagosthreads.co / password123 (inventory optional sample product included)',
    );
  }
}
