import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.deliveries.list(user);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.getOne(id, user);
  }

  @Post()
  create(@Body() body: CreateDeliveryDto, @CurrentUser() user: AuthUser) {
    return this.deliveries.create(body, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDeliveryStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveries.updateStatus(id, body, user);
  }
}
