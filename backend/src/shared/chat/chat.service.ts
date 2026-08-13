import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../common/types/auth-user';
import { isBuyer, isStaff } from '../../common/types/auth-user';
import { Business } from '../../database/entities/business.entity';
import { ChatMessage } from '../../database/entities/chat-message.entity';
import { ChatThread } from '../../database/entities/chat-thread.entity';
import { User } from '../../database/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { SendMessageDto, StartChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatThread)
    private readonly threads: Repository<ChatThread>,
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly storage: StorageService,
  ) {}

  // ── Buyer (ShopFlow) ────────────────────────────────────────────────────

  async startThreadAsBuyer(user: AuthUser, dto: StartChatDto) {
    if (!isBuyer(user)) {
      throw new ForbiddenException('Only ShopFlow buyers can start chats');
    }

    const business = await this.businesses.findOne({
      where: { id: dto.businessId },
    });
    if (!business || !business.storeEnabled) {
      throw new NotFoundException('Store not found');
    }

    // Reuse latest thread for same buyer + business (+ product when set)
    const existingQb = this.threads
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.buyer', 'buyer')
      .leftJoinAndSelect('t.business', 'business')
      .leftJoinAndSelect('t.product', 'product')
      .where('t.business_id = :businessId', { businessId: dto.businessId })
      .andWhere('t.buyer_user_id = :buyerId', { buyerId: user.sub })
      .orderBy('t.updated_at', 'DESC')
      .take(1);
    if (dto.productId) {
      existingQb.andWhere('t.product_id = :productId', {
        productId: dto.productId,
      });
    }
    let thread = await existingQb.getOne();

    if (!thread) {
      thread = this.threads.create({
        businessId: dto.businessId,
        buyerUserId: user.sub,
        productId: dto.productId ?? null,
        orderId: dto.orderId ?? null,
        subject: dto.subject?.trim() || null,
        lastMessageAt: null,
        lastMessagePreview: null,
        buyerUnreadCount: 0,
        staffUnreadCount: 0,
      });
      await this.threads.save(thread);
      thread = await this.threads.findOne({
        where: { id: thread.id },
        relations: { buyer: true, business: true, product: true },
      });
    }

    if (dto.message?.trim() && thread) {
      await this.appendMessage(thread, user.sub, 'buyer', {
        body: dto.message.trim(),
      });
      thread = await this.threads.findOne({
        where: { id: thread.id },
        relations: { buyer: true, business: true, product: true },
      });
    }

    return this.toThreadDto(thread!, 'buyer');
  }

  async listBuyerThreads(user: AuthUser) {
    if (!isBuyer(user)) {
      throw new ForbiddenException('Buyer access only');
    }
    const rows = await this.threads.find({
      where: { buyerUserId: user.sub },
      relations: { business: true, product: true },
      order: { lastMessageAt: 'DESC', updatedAt: 'DESC' },
    });
    return { threads: rows.map((t) => this.toThreadDto(t, 'buyer')) };
  }

  async getBuyerThread(user: AuthUser, threadId: string) {
    const thread = await this.findThreadForBuyer(user.sub, threadId);
    const messages = await this.messages.find({
      where: { threadId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
      take: 200,
    });
    // Mark buyer-read
    if (thread.buyerUnreadCount > 0) {
      thread.buyerUnreadCount = 0;
      await this.threads.save(thread);
    }
    return {
      thread: this.toThreadDto(thread, 'buyer'),
      messages: messages.map((m) => this.toMessageDto(m)),
    };
  }

  async sendAsBuyer(user: AuthUser, threadId: string, dto: SendMessageDto) {
    if (!isBuyer(user)) {
      throw new ForbiddenException('Buyer access only');
    }
    const thread = await this.findThreadForBuyer(user.sub, threadId);
    const msg = await this.appendMessage(thread, user.sub, 'buyer', dto);
    return this.toMessageDto(msg);
  }

  // ── Staff (Workspace) ───────────────────────────────────────────────────

  async listStaffThreads(user: AuthUser) {
    if (!isStaff(user) || !user.businessId) {
      throw new ForbiddenException('Workspace staff access only');
    }
    const businessId = user.businessId;
    const rows = await this.threads.find({
      where: { businessId },
      relations: { buyer: true, product: true },
      order: { lastMessageAt: 'DESC', updatedAt: 'DESC' },
    });
    return { threads: rows.map((t) => this.toThreadDto(t, 'staff')) };
  }

  async getStaffThread(user: AuthUser, threadId: string) {
    if (!isStaff(user) || !user.businessId) {
      throw new ForbiddenException('Workspace staff access only');
    }
    const thread = await this.findThreadForStaff(user.businessId!, threadId);
    const messages = await this.messages.find({
      where: { threadId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
      take: 200,
    });
    if (thread.staffUnreadCount > 0) {
      thread.staffUnreadCount = 0;
      await this.threads.save(thread);
    }
    return {
      thread: this.toThreadDto(thread, 'staff'),
      messages: messages.map((m) => this.toMessageDto(m)),
    };
  }

  async sendAsStaff(user: AuthUser, threadId: string, dto: SendMessageDto) {
    if (!isStaff(user) || !user.businessId) {
      throw new ForbiddenException('Workspace staff access only');
    }
    const thread = await this.findThreadForStaff(user.businessId!, threadId);
    const msg = await this.appendMessage(thread, user.sub, 'staff', dto);
    return this.toMessageDto(msg);
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private async findThreadForBuyer(buyerId: string, threadId: string) {
    const thread = await this.threads.findOne({
      where: { id: threadId, buyerUserId: buyerId },
      relations: { buyer: true, business: true, product: true },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  private async findThreadForStaff(businessId: string, threadId: string) {
    const thread = await this.threads.findOne({
      where: { id: threadId, businessId },
      relations: { buyer: true, business: true, product: true },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  private async appendMessage(
    thread: ChatThread,
    senderUserId: string,
    side: 'buyer' | 'staff',
    dto: SendMessageDto,
  ) {
    const msg = this.messages.create({
      threadId: thread.id,
      senderUserId,
      senderSide: side,
      body: dto.body.trim(),
      mediaKey: dto.mediaKey ?? null,
    });
    await this.messages.save(msg);

    thread.lastMessageAt = msg.createdAt;
    thread.lastMessagePreview = dto.body.trim().slice(0, 160);
    if (side === 'buyer') {
      thread.staffUnreadCount = (thread.staffUnreadCount || 0) + 1;
    } else {
      thread.buyerUnreadCount = (thread.buyerUnreadCount || 0) + 1;
    }
    await this.threads.save(thread);

    const full = await this.messages.findOne({
      where: { id: msg.id },
      relations: { sender: true },
    });
    return full!;
  }

  private toThreadDto(t: ChatThread, viewer: 'buyer' | 'staff') {
    return {
      id: t.id,
      businessId: t.businessId,
      businessName: t.business?.name ?? null,
      businessSlug: t.business?.storeSlug ?? null,
      buyerUserId: t.buyerUserId,
      buyerName: t.buyer?.fullName ?? null,
      buyerEmail: t.buyer?.email ?? null,
      productId: t.productId,
      productName: t.product?.name ?? null,
      orderId: t.orderId,
      subject: t.subject,
      lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
      lastMessagePreview: t.lastMessagePreview,
      unreadCount:
        viewer === 'buyer' ? t.buyerUnreadCount : t.staffUnreadCount,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private toMessageDto(m: ChatMessage) {
    return {
      id: m.id,
      threadId: m.threadId,
      senderUserId: m.senderUserId,
      senderName: m.sender?.fullName ?? null,
      senderSide: m.senderSide,
      body: m.body,
      mediaKey: m.mediaKey,
      mediaUrl: this.storage.publicUrl(m.mediaKey),
      createdAt: m.createdAt.toISOString(),
    };
  }
}
