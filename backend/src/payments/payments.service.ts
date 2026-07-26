import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../common/types/auth-user';
import { Business } from '../database/entities/business.entity';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { Payment } from '../database/entities/payment.entity';
import { ProductVariant } from '../database/entities/product-variant.entity';
import { ClaimPaymentDto, RejectPaymentDto } from './dto/payment.dto';

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
  private readonly uploadsRoot: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
  ) {
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    this.useRowLocks = dbType !== 'sqlite' && dbType !== 'better-sqlite3';
    this.frontendBase =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    this.uploadsRoot = join(process.cwd(), 'uploads', 'payment-proofs');
    if (!existsSync(this.uploadsRoot)) {
      mkdirSync(this.uploadsRoot, { recursive: true });
    }
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
    const reference = `SF-${opts.orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const paymentToken = `pay_${randomBytes(12).toString('hex')}`;

    const payment = paymentRepo.create({
      businessId: opts.businessId,
      orderId: opts.orderId,
      method: 'bank_transfer',
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
    return paymentRepo.save(payment);
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

    return {
      token: payment.paymentToken,
      method: payment.method,
      paymentStatus: payment.status,
      orderStatus: order.status,
      reference: payment.reference,
      amountCents: payment.amountCents,
      currency: 'NGN',
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
        (due === null || due >= now),
      underReview: order.status === 'payment_review',
      paid: order.status === 'paid' || ['shipped', 'delivered'].includes(order.status),
      rejectReason: payment.rejectReason,
      business: {
        name: business.name,
        whatsapp: business.whatsappNumber,
        bankName: business.bankName,
        bankAccountName: business.bankAccountName,
        bankAccountNumber: business.bankAccountNumber,
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
        items: (order.items ?? []).map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
      },
      instructions: [
        'Transfer the exact amount to the business account below.',
        `Use reference ${payment.reference} in the transfer narration.`,
        'Tap “I have made payment” when done (receipt upload optional).',
        'Your order is confirmed only after the business verifies the transfer.',
      ],
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
        const saved = this.saveProof(payment.id, dto);
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

  async getProofAbsolutePath(id: string, user: AuthUser) {
    const p = await this.payments.findOne({
      where: { id, businessId: user.businessId },
    });
    if (!p) throw new NotFoundException('Payment not found');
    if (!p.proofPath) throw new NotFoundException('No proof uploaded');
    const abs = join(process.cwd(), p.proofPath);
    if (!existsSync(abs)) throw new NotFoundException('Proof file missing');
    return {
      absolutePath: abs,
      filename: p.proofFilename ?? 'proof',
      mimeType: p.proofMimeType ?? 'application/octet-stream',
    };
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

  private saveProof(
    paymentId: string,
    dto: ClaimPaymentDto,
  ): { path: string; filename: string; mimeType: string } {
    let raw = dto.proofBase64!.trim();
    let mime = dto.proofMimeType?.trim() || 'image/jpeg';

    const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(raw);
    if (dataUrl) {
      mime = dataUrl[1];
      raw = dataUrl[2];
    }

    if (!ALLOWED_MIME.has(mime)) {
      throw new BadRequestException(
        'Proof must be JPEG, PNG, WebP, or PDF',
      );
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(raw, 'base64');
    } catch {
      throw new BadRequestException('Invalid proof encoding');
    }
    if (!buffer.length || buffer.length > MAX_PROOF_BYTES) {
      throw new BadRequestException(
        `Proof must be between 1 byte and ${MAX_PROOF_BYTES / (1024 * 1024)}MB`,
      );
    }

    const ext =
      mime === 'application/pdf'
        ? '.pdf'
        : mime === 'image/png'
          ? '.png'
          : mime === 'image/webp'
            ? '.webp'
            : '.jpg';

    const safeName = (dto.proofFilename || `proof${ext}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const stored = `${paymentId}_${Date.now()}${extname(safeName) || ext}`;
    const abs = join(this.uploadsRoot, stored);
    writeFileSync(abs, buffer);

    return {
      path: join('uploads', 'payment-proofs', stored).replace(/\\/g, '/'),
      filename: safeName,
      mimeType: mime,
    };
  }

  private safeUnlink(relativePath: string) {
    try {
      const abs = join(process.cwd(), relativePath);
      if (existsSync(abs)) unlinkSync(abs);
    } catch {
      /* ignore */
    }
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
