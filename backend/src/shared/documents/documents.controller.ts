import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentStatusDto } from './dto/document.dto';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.docs.listQuotations(user);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.getQuotation(id, user);
  }

  @Post()
  create(@Body() body: CreateDocumentDto, @CurrentUser() user: AuthUser) {
    return this.docs.createQuotation(body, user);
  }

  @Patch(':id/send')
  send(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.markQuotationSent(id, user);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.markQuotationAccepted(id, user);
  }

  @Post(':id/convert-to-invoice')
  convert(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.convertQuotationToInvoice(id, user);
  }
}

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.docs.listInvoices(user);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.getInvoice(id, user);
  }

  @Post()
  create(@Body() body: CreateDocumentDto, @CurrentUser() user: AuthUser) {
    return this.docs.createInvoice(body, user);
  }

  @Patch(':id/send')
  send(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.markInvoiceSent(id, user);
  }

  @Patch(':id/mark-paid')
  markPaid(
    @Param('id') id: string,
    @Body() body: UpdateDocumentStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.docs.markInvoicePaid(id, user, body);
  }

  @Patch(':id/void')
  void(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.docs.voidInvoice(id, user);
  }
}
