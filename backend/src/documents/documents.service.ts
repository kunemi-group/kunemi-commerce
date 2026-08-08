import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { computeOrderTotals } from '../common/money';
import type { AuthUser } from '../common/types/auth-user';
import { Business } from '../database/entities/business.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { InvoiceItem } from '../database/entities/invoice-item.entity';
import { Quotation } from '../database/entities/quotation.entity';
import { QuotationItem } from '../database/entities/quotation-item.entity';
import {
  CreateDocumentDto,
  DocumentLineDto,
  UpdateDocumentStatusDto,
} from './dto/document.dto';

function shortRef(prefix: string, id: string) {
  return `${prefix}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function parseMethods(json: string): Array<'transfer' | 'card'> {
  try {
    const arr = JSON.parse(json) as string[];
    return arr.filter(
      (m): m is 'transfer' | 'card' => m === 'transfer' || m === 'card',
    );
  } catch {
    return ['transfer'];
  }
}

import { MailService } from '../mail/mail.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Quotation)
    private readonly quotations: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly quotationItems: Repository<QuotationItem>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItems: Repository<InvoiceItem>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    private readonly mailService: MailService,
  ) {}

  // ── Quotations ──────────────────────────────────────────────────────────

  async listQuotations(user: AuthUser) {
    await this.markExpiredQuotes(user.businessId);
    const rows = await this.quotations.find({
      where: { businessId: user.businessId },
      relations: { items: true, agent: true },
      order: { createdAt: 'DESC' },
    });
    return { quotations: rows.map((q) => this.toQuoteDto(q)) };
  }

  async getQuotation(id: string, user: AuthUser) {
    const q = await this.findQuote(id, user.businessId);
    return this.toQuoteDto(q);
  }

  async createQuotation(dto: CreateDocumentDto, user: AuthUser) {
    const business = await this.requireBusiness(user.businessId);
    const lines = this.normalizeLines(dto.items);
    const totals = this.totalsFor(business, lines, dto.shippingFeeCents);
    const methods = dto.paymentMethods?.length
      ? dto.paymentMethods
      : (['transfer'] as Array<'transfer' | 'card'>);

    const quote = this.quotations.create({
      businessId: user.businessId,
      agentId: user.sub,
      reference: 'QT-TEMP',
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone?.trim() || null,
      customerEmail: dto.customerEmail?.trim() || null,
      deliveryAddress: dto.deliveryAddress?.trim() || null,
      status: 'draft',
      validUntil: dto.validUntil ? new Date(dto.validUntil) : this.defaultValidUntil(),
      channel: dto.channel ?? 'whatsapp',
      paymentMethodsJson: JSON.stringify(methods),
      shippingFeeCents: totals.shippingFeeCents,
      taxCents: totals.taxCents,
      subtotalCents: totals.subtotalCents,
      totalCents: totals.totalCents,
      notes: dto.notes?.trim() || null,
    });
    await this.quotations.save(quote);
    quote.reference = shortRef('QT', quote.id);
    await this.quotations.save(quote);

    const items = lines.map((l) =>
      this.quotationItems.create({
        quotationId: quote.id,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        taxExempt: l.taxExempt,
      }),
    );
    await this.quotationItems.save(items);
    return this.getQuotation(quote.id, user);
  }

  async markQuotationSent(id: string, user: AuthUser) {
    const q = await this.findQuote(id, user.businessId);
    if (q.status === 'converted' || q.status === 'expired') {
      throw new BadRequestException(`Cannot send a ${q.status} quotation`);
    }
    q.status = 'sent';
    await this.quotations.save(q);

    if (q.customerEmail) {
      const biz = await this.businesses.findOne({ where: { id: user.businessId } });
      void this.mailService.sendQuotationEmail(
        q.customerEmail,
        q.customerName,
        q.reference,
        q.totalCents,
        biz?.currency || 'NGN',
        q.validUntil?.toISOString(),
      );
    }

    return this.toQuoteDto(q);
  }

  async markQuotationAccepted(id: string, user: AuthUser) {
    const q = await this.findQuote(id, user.businessId);
    if (!['draft', 'sent'].includes(q.status)) {
      throw new BadRequestException(`Cannot accept a ${q.status} quotation`);
    }
    q.status = 'accepted';
    await this.quotations.save(q);
    return this.toQuoteDto(q);
  }

  async convertQuotationToInvoice(id: string, user: AuthUser) {
    const q = await this.findQuote(id, user.businessId);
    if (q.status === 'converted' && q.convertedInvoiceId) {
      return this.getInvoice(q.convertedInvoiceId, user);
    }
    if (!['accepted', 'sent', 'draft'].includes(q.status)) {
      throw new BadRequestException(
        `Cannot convert a ${q.status} quotation to invoice`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Invoice);
      const invItemRepo = manager.getRepository(InvoiceItem);
      const quoteRepo = manager.getRepository(Quotation);

      const inv = invRepo.create({
        businessId: user.businessId,
        agentId: user.sub,
        reference: 'INV-TEMP',
        customerName: q.customerName,
        customerPhone: q.customerPhone,
        customerEmail: q.customerEmail,
        deliveryAddress: q.deliveryAddress,
        status: 'draft',
        dueAt: this.defaultDueAt(),
        channel: q.channel,
        paymentMethodsJson: q.paymentMethodsJson,
        shippingFeeCents: q.shippingFeeCents,
        taxCents: q.taxCents,
        subtotalCents: q.subtotalCents,
        totalCents: q.totalCents,
        amountPaidCents: 0,
        quotationId: q.id,
        notes: q.notes,
      });
      await invRepo.save(inv);
      inv.reference = shortRef('INV', inv.id);
      await invRepo.save(inv);

      const items = (q.items ?? []).map((line) =>
        invItemRepo.create({
          invoiceId: inv.id,
          variantId: line.variantId,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          taxExempt: line.taxExempt,
        }),
      );
      await invItemRepo.save(items);

      q.status = 'converted';
      q.convertedInvoiceId = inv.id;
      await quoteRepo.save(q);

      const full = await invRepo.findOne({
        where: { id: inv.id },
        relations: { items: true, agent: true },
      });
      return this.toInvoiceDto(full!);
    });
  }

  // ── Invoices ────────────────────────────────────────────────────────────

  async listInvoices(user: AuthUser) {
    await this.markOverdueInvoices(user.businessId);
    const rows = await this.invoices.find({
      where: { businessId: user.businessId },
      relations: { items: true, agent: true },
      order: { createdAt: 'DESC' },
    });
    return { invoices: rows.map((i) => this.toInvoiceDto(i)) };
  }

  async getInvoice(id: string, user: AuthUser) {
    const inv = await this.findInvoice(id, user.businessId);
    return this.toInvoiceDto(inv);
  }

  async createInvoice(dto: CreateDocumentDto, user: AuthUser) {
    const business = await this.requireBusiness(user.businessId);
    const lines = this.normalizeLines(dto.items);
    const totals = this.totalsFor(business, lines, dto.shippingFeeCents);
    const methods = dto.paymentMethods?.length
      ? dto.paymentMethods
      : (['transfer'] as Array<'transfer' | 'card'>);

    const inv = this.invoices.create({
      businessId: user.businessId,
      agentId: user.sub,
      reference: 'INV-TEMP',
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone?.trim() || null,
      customerEmail: dto.customerEmail?.trim() || null,
      deliveryAddress: dto.deliveryAddress?.trim() || null,
      status: 'draft',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : this.defaultDueAt(),
      channel: dto.channel ?? 'whatsapp',
      paymentMethodsJson: JSON.stringify(methods),
      shippingFeeCents: totals.shippingFeeCents,
      taxCents: totals.taxCents,
      subtotalCents: totals.subtotalCents,
      totalCents: totals.totalCents,
      amountPaidCents: 0,
      notes: dto.notes?.trim() || null,
    });
    await this.invoices.save(inv);
    inv.reference = shortRef('INV', inv.id);
    await this.invoices.save(inv);

    const items = lines.map((l) =>
      this.invoiceItems.create({
        invoiceId: inv.id,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        taxExempt: l.taxExempt,
      }),
    );
    await this.invoiceItems.save(items);
    return this.getInvoice(inv.id, user);
  }

  async markInvoiceSent(id: string, user: AuthUser) {
    const inv = await this.findInvoice(id, user.businessId);
    if (inv.status === 'void' || inv.status === 'paid') {
      throw new BadRequestException(`Cannot send a ${inv.status} invoice`);
    }
    inv.status = 'sent';
    await this.invoices.save(inv);

    if (inv.customerEmail) {
      const biz = await this.businesses.findOne({ where: { id: user.businessId } });
      void this.mailService.sendInvoiceEmail(
        inv.customerEmail,
        inv.customerName,
        inv.reference,
        inv.totalCents,
        biz?.currency || 'NGN',
        inv.dueAt?.toISOString(),
      );
    }

    return this.toInvoiceDto(inv);
  }

  async markInvoicePaid(id: string, user: AuthUser, dto?: UpdateDocumentStatusDto) {
    const inv = await this.findInvoice(id, user.businessId);
    if (inv.status === 'void') {
      throw new BadRequestException('Cannot mark a void invoice as paid');
    }
    const paid =
      dto?.amountPaidCents !== undefined
        ? dto.amountPaidCents
        : inv.totalCents;
    inv.amountPaidCents = Math.min(paid, inv.totalCents);
    if (inv.amountPaidCents >= inv.totalCents) {
      inv.status = 'paid';
      inv.amountPaidCents = inv.totalCents;
    } else if (inv.amountPaidCents > 0) {
      inv.status = 'partial';
    }
    if (dto?.notes) inv.notes = dto.notes;
    await this.invoices.save(inv);
    return this.toInvoiceDto(inv);
  }

  async voidInvoice(id: string, user: AuthUser) {
    const inv = await this.findInvoice(id, user.businessId);
    if (inv.status === 'paid') {
      throw new BadRequestException('Cannot void a paid invoice');
    }
    inv.status = 'void';
    await this.invoices.save(inv);
    return this.toInvoiceDto(inv);
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private async requireBusiness(businessId: string) {
    const b = await this.businesses.findOne({ where: { id: businessId } });
    if (!b) throw new NotFoundException('Business not found');
    return b;
  }

  private normalizeLines(items: DocumentLineDto[]) {
    return items.map((item, i) => {
      const description = item.description?.trim();
      if (!description) {
        throw new BadRequestException(`Item ${i + 1}: description required`);
      }
      if (item.quantity < 1) {
        throw new BadRequestException(`Item ${i + 1}: quantity must be ≥ 1`);
      }
      if (item.unitPriceCents < 0) {
        throw new BadRequestException(`Item ${i + 1}: invalid unit price`);
      }
      return {
        variantId: item.variantId ?? null,
        description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        taxExempt: Boolean(item.taxExempt),
      };
    });
  }

  private totalsFor(
    business: Business,
    lines: Array<{ unitPriceCents: number; quantity: number; taxExempt: boolean }>,
    shippingFeeCents?: number,
  ) {
    return computeOrderTotals({
      lines,
      shippingFeeCents: shippingFeeCents ?? business.defaultShippingFeeCents ?? 0,
      taxEnabled: business.taxEnabled,
      taxRatePercent: Number(business.taxRatePercent ?? 0),
    });
  }

  private defaultValidUntil() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  }

  private defaultDueAt() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  private async markExpiredQuotes(businessId: string) {
    const now = new Date();
    await this.quotations
      .createQueryBuilder()
      .update(Quotation)
      .set({ status: 'expired' })
      .where('business_id = :businessId', { businessId })
      .andWhere('status IN (:...statuses)', { statuses: ['draft', 'sent'] })
      .andWhere('valid_until IS NOT NULL')
      .andWhere('valid_until < :now', { now })
      .execute();
  }

  private async markOverdueInvoices(businessId: string) {
    const now = new Date();
    await this.invoices
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: 'overdue' })
      .where('business_id = :businessId', { businessId })
      .andWhere('status IN (:...statuses)', { statuses: ['sent', 'partial'] })
      .andWhere('due_at IS NOT NULL')
      .andWhere('due_at < :now', { now })
      .execute();
  }

  private async findQuote(id: string, businessId: string) {
    const q = await this.quotations.findOne({
      where: { id, businessId },
      relations: { items: true, agent: true },
    });
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  private async findInvoice(id: string, businessId: string) {
    const inv = await this.invoices.findOne({
      where: { id, businessId },
      relations: { items: true, agent: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  private toQuoteDto(q: Quotation) {
    return {
      id: q.id,
      reference: q.reference,
      status: q.status,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      customerEmail: q.customerEmail,
      deliveryAddress: q.deliveryAddress,
      validUntil: q.validUntil?.toISOString() ?? null,
      channel: q.channel,
      paymentMethods: parseMethods(q.paymentMethodsJson),
      shippingFeeCents: q.shippingFeeCents,
      taxCents: q.taxCents,
      subtotalCents: q.subtotalCents,
      totalCents: q.totalCents,
      notes: q.notes,
      convertedInvoiceId: q.convertedInvoiceId,
      ownerName: q.agent?.fullName ?? null,
      items: (q.items ?? []).map((i) => ({
        id: i.id,
        variantId: i.variantId,
        description: i.description,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        taxExempt: i.taxExempt,
      })),
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    };
  }

  private toInvoiceDto(inv: Invoice) {
    return {
      id: inv.id,
      reference: inv.reference,
      status: inv.status,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerEmail: inv.customerEmail,
      deliveryAddress: inv.deliveryAddress,
      dueAt: inv.dueAt?.toISOString() ?? null,
      channel: inv.channel,
      paymentMethods: parseMethods(inv.paymentMethodsJson),
      shippingFeeCents: inv.shippingFeeCents,
      taxCents: inv.taxCents,
      subtotalCents: inv.subtotalCents,
      totalCents: inv.totalCents,
      amountPaidCents: inv.amountPaidCents,
      quotationId: inv.quotationId,
      orderId: inv.orderId,
      notes: inv.notes,
      ownerName: inv.agent?.fullName ?? null,
      items: (inv.items ?? []).map((i) => ({
        id: i.id,
        variantId: i.variantId,
        description: i.description,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        taxExempt: i.taxExempt,
      })),
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    };
  }
}
