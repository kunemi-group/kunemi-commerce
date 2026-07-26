import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from '../database/entities/delivery.entity';
import { DeliveryStatusEvent } from '../database/entities/delivery-status-event.entity';
import { Order } from '../database/entities/order.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Delivery,
      DeliveryStatusEvent,
      Order,
      OrderStatusHistory,
    ]),
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
