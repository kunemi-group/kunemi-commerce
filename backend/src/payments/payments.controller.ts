import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import {
  ClaimPaymentDto,
  RejectPaymentDto,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { AuthUser } from '../common/types/auth-user';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ── Business (JWT) ──────────────────────────────────────────────────────

  @Get('payments')
  list(@CurrentUser() user: AuthUser) {
    return this.payments.list(user);
  }

  @Get('payments/:id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payments.getOne(id, user);
  }

  @Get('payments/:id/proof')
  async proof(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.payments.getProofFile(id, user);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    return new StreamableFile(file.buffer);
  }

  @Patch('payments/:id/verify')
  verify(
    @Param('id') id: string,
    @Body() body: VerifyPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.verify(id, user, body.note);
  }

  @Patch('payments/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: RejectPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.reject(id, user, body);
  }

  // ── Public customer pay page ────────────────────────────────────────────

  @Public()
  @Get('pay/:token')
  getPublic(@Param('token') token: string) {
    return this.payments.getPublicByToken(token);
  }

  @Public()
  @Post('pay/:token/claim')
  claim(@Param('token') token: string, @Body() body: ClaimPaymentDto) {
    return this.payments.claimByToken(token, body);
  }
}
