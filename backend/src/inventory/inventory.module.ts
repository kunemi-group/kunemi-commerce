import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../database/entities/product.entity';
import { ProductVariant } from '../database/entities/product-variant.entity';
import {
  InventoryController,
  VariantsController,
} from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant])],
  controllers: [InventoryController, VariantsController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
