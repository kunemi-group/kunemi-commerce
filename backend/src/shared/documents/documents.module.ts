import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../database/entities/business.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { InvoiceItem } from '../../database/entities/invoice-item.entity';
import { Quotation } from '../../database/entities/quotation.entity';
import { QuotationItem } from '../../database/entities/quotation-item.entity';
import {
  InvoicesController,
  QuotationsController,
} from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation,
      QuotationItem,
      Invoice,
      InvoiceItem,
      Business,
    ]),
  ],
  controllers: [QuotationsController, InvoicesController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
