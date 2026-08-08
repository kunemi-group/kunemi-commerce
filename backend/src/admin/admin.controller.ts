import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AdminService } from './admin.service';
import {
  AdminBusinessQueryDto,
  SetCustomDomainDto,
  UpdateBusinessStatusDto,
  UpdateBusinessTierDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getPlatformMetrics();
  }

  @Get('businesses')
  listBusinesses(@Query() query: AdminBusinessQueryDto) {
    return this.adminService.listBusinesses(query);
  }

  @Get('businesses/:id')
  getBusinessDetail(@Param('id') id: string) {
    return this.adminService.getBusinessDetail(id);
  }

  @Patch('businesses/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.adminService.updateBusinessStatus(id, dto);
  }

  @Patch('businesses/:id/tier')
  updateTier(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessTierDto,
  ) {
    return this.adminService.updateBusinessTier(id, dto);
  }

  @Post('businesses/:id/custom-domain')
  setCustomDomain(
    @Param('id') id: string,
    @Body() dto: SetCustomDomainDto,
  ) {
    return this.adminService.setCustomDomain(id, dto);
  }

  @Public()
  @Post('seed')
  seedAdmin() {
    return this.adminService.seedSuperAdmin();
  }
}
