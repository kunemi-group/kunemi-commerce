import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Business } from '../database/entities/business.entity';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Payment } from '../database/entities/payment.entity';
import { TenantProvisionerService } from '../common/services/tenant-provisioner.service';
import {
  AdminBusinessQueryDto,
  CreatePlatformAdminDto,
  SetCustomDomainDto,
  UpdateBusinessStatusDto,
  UpdateBusinessTierDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    private readonly tenantProvisioner: TenantProvisionerService,
  ) {}

  /**
   * Calculates platform-wide executive metrics
   */
  async getPlatformMetrics() {
    const totalBusinesses = await this.businesses.count();
    const activeBusinesses = await this.businesses.count({
      where: { status: 'active' },
    });
    const suspendedBusinesses = await this.businesses.count({
      where: { status: 'suspended' },
    });

    const totalUsers = await this.users.count();
    const totalOrders = await this.orders.count();

    // Sum paid orders for total platform GMV
    const paidOrders = await this.orders.find({
      where: { status: 'paid' },
      select: { totalCents: true },
    });

    const globalGmvCents = paidOrders.reduce(
      (sum, o) => sum + (o.totalCents || 0),
      0,
    );

    // Count custom domains active
    const businessesWithCustomDomain = await this.businesses.count({
      where: { customDomainStatus: 'verified' },
    });

    // Recent signups
    const recentSignups = await this.businesses.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      overview: {
        totalBusinesses,
        activeBusinesses,
        suspendedBusinesses,
        totalUsers,
        totalOrders,
        globalGmvCents,
        activeCustomDomains: businessesWithCustomDomain,
      },
      recentMerchants: recentSignups.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        tier: b.subscriptionTier,
        status: b.status || 'active',
        storeSlug: b.storeSlug,
        createdAt: b.createdAt,
      })),
    };
  }

  /**
   * Paginated business listing with search and filters
   */
  async listBusinesses(query: AdminBusinessQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.businesses.createQueryBuilder('b');

    if (query.search) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(b.name) LIKE :s OR LOWER(b.email) LIKE :s OR LOWER(b.storeSlug) LIKE :s)',
        { s },
      );
    }

    if (query.tier) {
      qb.andWhere('b.subscriptionTier = :tier', { tier: query.tier });
    }

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    qb.orderBy('b.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Map items with staff count and order volume
    const enriched = await Promise.all(
      items.map(async (b) => {
        const staffCount = await this.users.count({
          where: { businessId: b.id },
        });
        const orderCount = await this.orders.count({
          where: { businessId: b.id },
        });

        return {
          id: b.id,
          name: b.name,
          email: b.email,
          whatsappNumber: b.whatsappNumber,
          tier: b.subscriptionTier,
          status: b.status || 'active',
          storeSlug: b.storeSlug,
          customDomain: b.customDomain,
          customDomainStatus: b.customDomainStatus,
          currency: b.currency,
          staffCount,
          orderCount,
          createdAt: b.createdAt,
        };
      }),
    );

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed profile for a single merchant
   */
  async getBusinessDetail(id: string) {
    const business = await this.businesses.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    const staff = await this.users.find({
      where: { businessId: id },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });

    const ordersCount = await this.orders.count({ where: { businessId: id } });
    const paidOrders = await this.orders.find({
      where: { businessId: id, status: 'paid' },
      select: { totalCents: true },
    });

    const totalRevenueCents = paidOrders.reduce(
      (sum, o) => sum + (o.totalCents || 0),
      0,
    );

    return {
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        whatsappNumber: business.whatsappNumber,
        address: business.address,
        tier: business.subscriptionTier,
        status: business.status || 'active',
        currency: business.currency,
        storeSlug: business.storeSlug,
        storeEnabled: business.storeEnabled,
        customDomain: business.customDomain,
        customDomainStatus: business.customDomainStatus,
        bank: {
          bankName: business.bankName,
          accountName: business.bankAccountName,
          accountNumber: business.bankAccountNumber,
        },
        createdAt: business.createdAt,
      },
      stats: {
        staffCount: staff.length,
        ordersCount,
        totalRevenueCents,
      },
      staff,
    };
  }

  /**
   * Update store status (active, suspended, pending) & sync with Cloudflare KV
   */
  async updateBusinessStatus(id: string, dto: UpdateBusinessStatusDto) {
    const business = await this.businesses.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    business.status = dto.status;
    await this.businesses.save(business);

    // Sync with Cloudflare Edge KV
    if (business.storeSlug) {
      if (dto.status === 'suspended') {
        await this.tenantProvisioner.unregisterTenant(business.id);
      } else {
        await this.tenantProvisioner.registerTenant({
          tenantId: business.id,
          slug: business.storeSlug,
          name: business.name,
          customDomain: business.customDomain,
        });
      }
    }

    return {
      id: business.id,
      name: business.name,
      status: business.status,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update merchant subscription tier
   */
  async updateBusinessTier(id: string, dto: UpdateBusinessTierDto) {
    const business = await this.businesses.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    business.subscriptionTier = dto.subscriptionTier;
    await this.businesses.save(business);

    return {
      id: business.id,
      name: business.name,
      tier: business.subscriptionTier,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Set and verify custom vanity domain (e.g., shop.lagosthreads.co)
   */
  async setCustomDomain(id: string, dto: SetCustomDomainDto) {
    const business = await this.businesses.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    const domain = dto.customDomain?.trim().toLowerCase() || null;

    if (domain) {
      const taken = await this.businesses.findOne({
        where: { customDomain: domain, id: Not(id) },
      });
      if (taken) {
        throw new ConflictException('Custom domain already linked to another business');
      }
      business.customDomain = domain;
      business.customDomainStatus = 'verified';
    } else {
      business.customDomain = null;
      business.customDomainStatus = null;
    }

    await this.businesses.save(business);

    // Sync with Cloudflare KV
    if (business.storeSlug) {
      await this.tenantProvisioner.registerTenant({
        tenantId: business.id,
        slug: business.storeSlug,
        name: business.name,
        customDomain: business.customDomain,
      });
    }

    return {
      id: business.id,
      customDomain: business.customDomain,
      customDomainStatus: business.customDomainStatus,
    };
  }

  /**
   * Create a platform admin or super_admin account (Super Admin only)
   */
  async createPlatformAdmin(dto: CreatePlatformAdminDto) {
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
      role: dto.role,
    });

    await this.users.save(user);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * List all platform admins and super_admins
   */
  async listPlatformAdmins() {
    const admins = await this.users.find({
      where: [{ role: 'admin' }, { role: 'super_admin' }],
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      order: { createdAt: 'DESC' },
    });
    return { admins };
  }

  /**
   * Remove a platform admin account (Super Admin only)
   */
  async deletePlatformAdmin(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Platform admin user not found');
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new BadRequestException('User is not a platform admin');
    }

    await this.users.remove(user);
    return { message: 'Platform admin user deleted successfully', id };
  }

  /**
   * Seed Super Admin Account (`admin@kunemi.com` / `admin123`)
   */
  async seedSuperAdmin() {
    const email = 'admin@kunemi.com';
    let user = await this.users.findOne({ where: { email } });

    if (user) {
      user.role = 'super_admin';
      await this.users.save(user);
      return { message: 'Super admin updated', email: user.email };
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    user = this.users.create({
      businessId: null,
      email,
      passwordHash,
      fullName: 'Kunemi Platform Admin',
      role: 'super_admin',
    });

    await this.users.save(user);
    this.logger.log(`Created default Super Admin account: ${email}`);

    return {
      message: 'Super admin account created successfully',
      email: user.email,
      password: 'password123 (please change in prod)',
    };
  }
}
