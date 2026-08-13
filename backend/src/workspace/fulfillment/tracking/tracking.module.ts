import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from '../../../database/entities/delivery.entity';
import { Business } from '../../../database/entities/business.entity';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, Business])],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
