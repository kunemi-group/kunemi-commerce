import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../database/entities/business.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrderStatusHistory } from '../../database/entities/order-status-history.entity';
import { Delivery } from '../../database/entities/delivery.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpiryScheduler } from './order-expiry.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderStatusHistory,
      ProductVariant,
      Business,
      Payment,
      Delivery,
    ]),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryScheduler],
  exports: [OrdersService],
})
export class OrdersModule {}
