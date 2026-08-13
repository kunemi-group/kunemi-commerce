import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../database/entities/business.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrderStatusHistory } from '../../database/entities/order-status-history.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BankTransferProvider } from './providers/bank-transfer.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaystackProvider } from './providers/paystack.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Order,
      OrderItem,
      OrderStatusHistory,
      ProductVariant,
      Business,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    BankTransferProvider,
    StripeProvider,
    PaystackProvider,
    PaymentProviderRegistry,
  ],
  exports: [PaymentsService, PaymentProviderRegistry],
})
export class PaymentsModule {}
