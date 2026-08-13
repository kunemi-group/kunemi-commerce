import { Controller, Get, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Public()
  @Get(':token')
  get(@Param('token') token: string) {
    return this.tracking.getByToken(token);
  }
}
