import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { ChatService } from './chat.service';
import { SendMessageDto, StartChatDto } from './dto/chat.dto';

/**
 * Shared chat API:
 * - Buyers (ShopFlow): /chat/buyer/*
 * - Staff (Workspace): /chat/inbox/*
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // ── ShopFlow buyer ──────────────────────────────────────────────────────

  @Post('buyer/threads')
  startAsBuyer(@CurrentUser() user: AuthUser, @Body() body: StartChatDto) {
    return this.chat.startThreadAsBuyer(user, body);
  }

  @Get('buyer/threads')
  listBuyer(@CurrentUser() user: AuthUser) {
    return this.chat.listBuyerThreads(user);
  }

  @Get('buyer/threads/:id')
  getBuyer(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.getBuyerThread(user, id);
  }

  @Post('buyer/threads/:id/messages')
  sendBuyer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.chat.sendAsBuyer(user, id, body);
  }

  // ── Workspace staff inbox ───────────────────────────────────────────────

  @Get('inbox')
  listStaff(@CurrentUser() user: AuthUser) {
    return this.chat.listStaffThreads(user);
  }

  @Get('inbox/:id')
  getStaff(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.getStaffThread(user, id);
  }

  @Post('inbox/:id/messages')
  sendStaff(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.chat.sendAsStaff(user, id, body);
  }
}
