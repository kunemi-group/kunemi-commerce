import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../database/entities/business.entity';
import { Product } from '../../database/entities/product.entity';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Product])],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
