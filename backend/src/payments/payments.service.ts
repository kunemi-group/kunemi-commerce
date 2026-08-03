import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../common/types/auth-user';
import { Business } from '../database/entities/business.entity';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { Payment } from '../database/entities/payment.entity';
import { ProductVariant } from '../database/entities/product-variant.entity';
import { normalizeCurrency } from '../common/currency';
import { StorageService } from '../storage/storage.service';
import { ClaimPaymentDto, RejectPaymentDto } from './dto/payment.dto';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const MAX_PROOF_BYTES = 4 * 1024 * 1024;

@Injectable()
export class PaymentsService {
  private readonly useRowLocks: boolean;
  private readonly frontendBase: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    private readonly storage: StorageService,
    private readonly paymentProviders: PaymentProviderRegistry,
  ) {
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    this.useRowLocks = dbType !== 'sqlite' && dbType !== 'better-sqlite3';
    this.frontendBase =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private findOpts(base: Record<string, any>): any {
    if (!this.useRowLocks) return base;
    return { ...base, lock: { mode: 'pessimistic_write' as const } };
  }

  /** Called from OrdersService when an order is created */
  async createForOrder(
    manager: DataSource['manager'],
    opts: {
      businessId: string;
      orderId: string;
      amountCents: number;
    },
  ): Promise<Payment> {
    const paymentRepo = manager.getRepository(Payment);
    const businessRepo = manager.getRepository(Business);
    const business = await businessRepo.findOne({
      where: { id: opts.businessId },
    });
    const provider = business
      ? this.paymentProviders.resolveForBusiness(business)
      : this.paymentProviders.get('bank_transfer')!;

    const reference = `KW-${opts.orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const paymentToken = `pay_${randomBytes(12).toString('hex')}`;

    const payment = paymentRepo.create({
      businessId: opts.businessId,
      orderId: opts.orderId,
      method: provider.id as Payment['method'],
      status: 'awaiting_transfer',
      amountCents: opts.amountCents,
      reference,
      paymentToken,
      claimedAt: null,
      customerNote: null,
      proofPath: null,
      proofFilename: null,
      proofMimeType: null,
      verifiedBy: null,
      verifiedAt: null,
      rejectReason: null,
    });
    const saved = await paymentRepo.save(payment);
    return saved;
  }

  paymentUrl(token: string) {
    return `${this.frontendBase}/pay/${token}`;
  }

  async list(user: AuthUser) {
    const rows = await this.payments.find({
      where: { businessId: user.businessId },
      relations: { order: true },
      order: { updatedAt: 'DESC' },
      take: 100,
    });
    return {
      payments: rows.map((p) => this.toBusinessDto(p)),
      note: 'Default method is bank transfer. Order becomes paid only after you verify.',
    };
  }

  async getOne(id: string, user: AuthUser) {
    const p = await this.payments.findOne({
      where: { id, businessId: user.businessId },
      relations: { order: { items: true } },
    });
    if (!p) throw new NotFoundException('Payment not found');
    return this.toBusinessDto(p, true);
  }

  /**
   * Public customer payment page: bank details + countdown + order summary.
   */
  async getPublicByToken(token: string) {
    const payment = await this.payments.findOne({
      where: { paymentToken: token },
      relations: { order: { items: true }, business: true },
    });
    if (!payment) throw new NotFoundException('Payment link not found');

    const order = payment.order;
    const business = payment.business;
    const now = Date.now();
    const due = order.reservedUntil
      ? new Date(order.reservedUntil).getTime()
      : null;
    const secondsRemaining =
      due && order.status === 'pending'
        ? Math.max(0, Math.floor((due - now) / 1000))
        : null;

    const currency = normalizeCurrency(business.currency);
    const provider =
      this.paymentProviders.get(payment.method) ??
      this.paymentProviders.resolveForBusiness(business);
    const customerView = provider.buildCustomerView(payment, business, order);

    return {
      token: payment.paymentToken,
      method: payment.method,
      providerLabel: customerView.providerLabel,
      paymentStatus: payment.status,
      orderStatus: order.status,
      reference: payment.reference,
      amountCents: payment.amountCents,
      currency,
      paymentDueAt: order.reservedUntil?.toISOString() ?? null,
      secondsRemaining,
      expired:
        order.status === 'expired' ||
        payment.status === 'expired' ||
        (order.status === 'pending' &&
          due !== null &&
          due < now),
      canClaim:
        order.status === 'pending' &&
        payment.status === 'awaiting_transfer' &&
        customerView.requiresManualClaim &&
        (due === null || due >= now),
      underReview: order.status === 'payment_review',
      paid: order.status === 'paid' || ['shipped', 'delivered'].includes(order.status),
      rejectReason: payment.rejectReason,
      checkoutUrl: customerView.checkoutUrl,
      requiresManualClaim: customerView.requiresManualClaim,
      business: {
        name: business.name,
        whatsapp: business.whatsappNumber,
        currency,
        bankName: customerView.bank?.bankName ?? business.bankName,
        bankAccountName:
          customerView.bank?.accountName ?? business.bankAccountName,
        bankAccountNumber:
          customerView.bank?.accountNumber ?? business.bankAccountNumber,
      },
      order: {
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        shippingFeeCents: order.shippingFeeCents,
        totalCents: order.totalCents,
        currency,
        items: (order.items ?? []).map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
      },
      instructions: customerView.instructions,
      availablePaymentMethods: this.paymentProviders.listAvailable(business),
    };
  }

  /** Customer claims they transferred */
  async claimByToken(token: string, dto: ClaimPaymentDto) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const orderRepo = manager.getRepository(Order);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      const payment = await paymentRepo.findOne(
        this.findOpts({ where: { paymentToken: token } }),
      );
      if (!payment) throw new NotFoundException('Payment link not found');

      const order = await orderRepo.findOne(
        this.findOpts({ where: { id: payment.orderId } }),
      );
      if (!order) throw new NotFoundException('Order not found');

      if (order.status === 'expired' || payment.status === 'expired') {
        throw new BadRequestException('This payment link has expired');
      }
      if (['paid', 'shipped', 'delivered', 'cancelled'].includes(order.status)) {
        throw new BadRequestException(
          `Order is already ${order.status} — no claim needed`,
        );
      }
      if (order.status === 'payment_review' || payment.status === 'claimed') {
        throw new BadRequestException(
          'Payment already submitted — waiting for the business to verify',
        );
      }
      if (order.status !== 'pending' || payment.status !== 'awaiting_transfer') {
        throw new BadRequestException(
          `Cannot claim payment in order status ${order.status}`,
        );
      }

      if (order.reservedUntil && order.reservedUntil.getTime() < Date.now()) {
        throw new BadRequestException(
          'Payment window has expired. Ask the seller for a new order.',
        );
      }

      let proofPath: string | null = null;
      let proofFilename: string | null = null;
      let proofMimeType: string | null = null;

      if (dto.proofBase64?.trim()) {
        const saved = await this.saveProof(
          payment.id,
          dto,
          payment.businessId,
        );
        proofPath = saved.path;
        proofFilename = saved.filename;
        proofMimeType = saved.mimeType;
      }

      payment.status = 'claimed';
      payment.claimedAt = new Date();
      payment.customerNote = dto.customerNote?.trim() || null;
      payment.proofPath = proofPath;
      payment.proofFilename = proofFilename;
      payment.proofMimeType = proofMimeType;
      payment.rejectReason = null;
      await paymentRepo.save(payment);

      const from = order.status;
      order.status = 'payment_review';
      await orderRepo.save(order);

      await historyRepo.save(
        historyRepo.create({
          orderId: order.id,
          fromStatus: from,
          toStatus: 'payment_review',
          changedBy: null,
          reason: proofPath
            ? 'Customer claimed bank transfer with proof'
            : 'Customer claimed bank transfer (no proof uploaded)',
        }),
      );

      return {
        ok: true,
        paymentStatus: payment.status,
        orderStatus: order.status,
        message:
          'Thanks — the business will verify your transfer and confirm the order.',
      };
    });
  }

  /** Business confirms transfer → order paid + stock finalized */
  async verify(id: string, user: AuthUser, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);
      const variantRepo = manager.getRepository(ProductVariant);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      const payment = await paymentRepo.findOne(
        this.findOpts({
          where: { id, businessId: user.businessId },
        }),
      );
      if (!payment) throw new NotFoundException('Payment not found');

      if (!['claimed', 'awaiting_transfer'].includes(payment.status)) {
        throw new BadRequestException(
          `Cannot verify payment in status ${payment.status}`,
        );
      }

      const order = await orderRepo.findOne(
        this.findOpts({
          where: { id: payment.orderId, businessId: user.businessId },
        }),
      );
      if (!order) throw new NotFoundException('Order not found');

      if (!['pending', 'payment_review'].includes(order.status)) {
        throw new BadRequestException(
          `Order cannot be confirmed from status ${order.status}`,
        );
      }

      // Finalize catalog stock holds → sold
      const items = await itemRepo.find({ where: { orderId: order.id } });
      for (const item of items) {
        if (!item.variantId) continue;
        const variant = await variantRepo.findOne(
          this.findOpts({
            where: { id: item.variantId, businessId: user.businessId },
          }),
        );
        if (variant) {
          variant.stockReserved = Math.max(
            0,
            variant.stockReserved - item.quantity,
          );
          variant.stockOnHand = Math.max(0, variant.stockOnHand - item.quantity);
          await variantRepo.save(variant);
        }
      }

      const fromOrder = order.status;
      order.status = 'paid';
      order.reservedUntil = null;
      await orderRepo.save(order);

      payment.status = 'verified';
      payment.verifiedBy = user.sub;
      payment.verifiedAt = new Date();
      payment.rejectReason = null;
      await paymentRepo.save(payment);

      await historyRepo.save(
        historyRepo.create({
          orderId: order.id,
          fromStatus: fromOrder,
          toStatus: 'paid',
          changedBy: user.sub,
          reason:
            note?.trim() ||
            'Bank transfer verified by business — order confirmed',
        }),
      );

      return this.toBusinessDto(
        (await paymentRepo.findOne({
          where: { id: payment.id },
          relations: { order: true },
        }))!,
      );
    });
  }

  /** Reject claim — customer may re-transfer / re-claim if still in window */
  async reject(id: string, user: AuthUser, dto: RejectPaymentDto) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const orderRepo = manager.getRepository(Order);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      const payment = await paymentRepo.findOne(
        this.findOpts({
          where: { id, businessId: user.businessId },
        }),
      );
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status !== 'claimed') {
        throw new BadRequestException(
          `Only claimed payments can be rejected (current: ${payment.status})`,
        );
      }

      const order = await orderRepo.findOne(
        this.findOpts({
          where: { id: payment.orderId, businessId: user.businessId },
        }),
      );
      if (!order) throw new NotFoundException('Order not found');

      // Drop previous proof file if any
      if (payment.proofPath) {
        this.safeUnlink(payment.proofPath);
      }

      const reason = dto.reason?.trim() || 'Transfer not verified — please recheck and try again';

      payment.status = 'awaiting_transfer';
      payment.claimedAt = null;
      payment.customerNote = null;
      payment.proofPath = null;
      payment.proofFilename = null;
      payment.proofMimeType = null;
      payment.rejectReason = reason;
      await paymentRepo.save(payment);

      const stillInWindow =
        !order.reservedUntil || order.reservedUntil.getTime() > Date.now();

      if (order.status === 'payment_review') {
        const next = stillInWindow ? 'pending' : 'expired';
        const from = order.status;
        order.status = next as Order['status'];
        if (next === 'expired') {
          order.reservedUntil = null;
          // stock release is handled by expiry path; do light release here for reserved
          await this.releaseStock(manager, order.id, user.businessId);
        }
        await orderRepo.save(order);
        await historyRepo.save(
          historyRepo.create({
            orderId: order.id,
            fromStatus: from,
            toStatus: next,
            changedBy: user.sub,
            reason: `Payment rejected: ${reason}`,
          }),
        );
      }

      return this.toBusinessDto(
        (await paymentRepo.findOne({
          where: { id: payment.id },
          relations: { order: true },
        }))!,
      );
    });
  }

  async getProofFile(id: string, user: AuthUser) {
    const p = await this.payments.findOne({
      where: { id, businessId: user.businessId },
    });
    if (!p) throw new NotFoundException('Payment not found');
    if (!p.proofPath) throw new NotFoundException('No proof uploaded');

    // Legacy local relative paths under uploads/
    const obj = await this.storage.getObject(p.proofPath);
    if (obj) {
      return {
        buffer: obj.buffer,
        filename: p.proofFilename ?? 'proof',
        mimeType: p.proofMimeType ?? obj.contentType,
        url: this.storage.publicUrl(p.proofPath),
      };
    }

    // Fallback: legacy disk path relative to cwd
    try {
      const { existsSync, readFileSync } = await import('fs');
      const { join } = await import('path');
      const abs = join(process.cwd(), p.proofPath);
      if (existsSync(abs)) {
        return {
          buffer: readFileSync(abs),
          filename: p.proofFilename ?? 'proof',
          mimeType: p.proofMimeType ?? 'application/octet-stream',
          url: null,
        };
      }
    } catch {
      /* ignore */
    }
    throw new NotFoundException('Proof file missing');
  }

  /** Mark payment expired when order hold expires */
  async markExpiredForOrders(orderIds: string[]) {
    if (!orderIds.length) return;
    await this.payments.update(
      {
        orderId: In(orderIds),
        status: In(['awaiting_transfer', 'claimed']),
      },
      { status: 'expired' },
    );
  }

  private async releaseStock(
    manager: DataSource['manager'],
    orderId: string,
    businessId: string,
  ) {
    const itemRepo = manager.getRepository(OrderItem);
    const variantRepo = manager.getRepository(ProductVariant);
    const items = await itemRepo.find({ where: { orderId } });
    for (const item of items) {
      if (!item.variantId) continue;
      const variant = await variantRepo.findOne(
        this.findOpts({
          where: { id: item.variantId, businessId },
        }),
      );
      if (variant) {
        variant.stockReserved = Math.max(
          0,
          variant.stockReserved - item.quantity,
        );
        await variantRepo.save(variant);
      }
    }
  }

  private async saveProof(
    paymentId: string,
    dto: ClaimPaymentDto,
    businessId: string,
  ): Promise<{ path: string; filename: string; mimeType: string }> {
    const stored = await this.storage.uploadBase64({
      businessId,
      purpose: 'payment_proof',
      base64: dto.proofBase64!,
      contentType: dto.proofMimeType || 'image/jpeg',
      filename: dto.proofFilename || `proof-${paymentId}`,
      maxBytes: MAX_PROOF_BYTES,
      allowedMime: ALLOWED_MIME,
    });
    return {
      path: stored.key,
      filename: stored.filename,
      mimeType: stored.contentType,
    };
  }

  private safeUnlink(relativePath: string) {
    void this.storage.delete(relativePath);
  }

  private toBusinessDto(p: Payment, detail = false) {
    return {
      id: p.id,
      orderId: p.orderId,
      method: p.method,
      status: p.status,
      amountCents: p.amountCents,
      reference: p.reference,
      paymentToken: p.paymentToken,
      paymentUrl: this.paymentUrl(p.paymentToken),
      claimedAt: p.claimedAt?.toISOString() ?? null,
      customerNote: p.customerNote,
      hasProof: Boolean(p.proofPath),
      proofFilename: p.proofFilename,
      proofUrl: p.proofPath ? `/payments/${p.id}/proof` : null,
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
      rejectReason: p.rejectReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      order: p.order
        ? {
            id: p.order.id,
            status: p.order.status,
            customerName: p.order.customerName,
            customerPhone: p.order.customerPhone,
            customerEmail: p.order.customerEmail,
            totalCents: p.order.totalCents,
            reservedUntil: p.order.reservedUntil?.toISOString() ?? null,
            ...(detail && p.order.items
              ? {
                  items: p.order.items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPriceCents: i.unitPriceCents,
                  })),
                }
              : {}),
          }
        : undefined,
    };
  }
}
