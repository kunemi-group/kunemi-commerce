import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderExpiryScheduler {
  private readonly logger = new Logger(OrderExpiryScheduler.name);

  constructor(private readonly orders: OrdersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiry() {
    try {
      const result = await this.orders.expireStaleHolds();
      if (result.expired > 0) {
        this.logger.log(`Expired ${result.expired} unpaid order hold(s)`);
      }
    } catch (err) {
      this.logger.warn(`Expiry sweep skipped: ${(err as Error).message}`);
    }
  }
}
