import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.list(user);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.getOne(id, user);
  }

  @Post()
  create(@Body() body: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.create(body, user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.cancel(id, user);
  }

  /** Temporary until payments module */
  @Patch(':id/mark-paid')
  markPaid(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.markPaid(id, user);
  }
}
