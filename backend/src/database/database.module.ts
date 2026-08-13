import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Business,
  User,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  OrderStatusHistory,
  Delivery,
  DeliveryStatusEvent,
} from './entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      User,
      Product,
      ProductVariant,
      Order,
      OrderItem,
      OrderStatusHistory,
      Delivery,
      DeliveryStatusEvent,
    ]),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
