import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import {
  AdminBusinessQueryDto,
  CreatePlatformAdminDto,
  SetCustomDomainDto,
  UpdateBusinessStatusDto,
  UpdateBusinessTierDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
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

  @Roles('super_admin')
  @Patch('businesses/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.adminService.updateBusinessStatus(id, dto);
  }

  @Roles('super_admin')
  @Patch('businesses/:id/tier')
  updateTier(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessTierDto,
  ) {
    return this.adminService.updateBusinessTier(id, dto);
  }

  @Roles('super_admin')
  @Post('businesses/:id/custom-domain')
  setCustomDomain(
    @Param('id') id: string,
    @Body() dto: SetCustomDomainDto,
  ) {
    return this.adminService.setCustomDomain(id, dto);
  }

  /** List all platform admin and super_admin accounts */
  @Get('users')
  listPlatformAdmins() {
    return this.adminService.listPlatformAdmins();
  }

  /** Create a new platform admin or super_admin user (Super Admin only) */
  @Roles('super_admin')
  @Post('users')
  createPlatformAdmin(@Body() dto: CreatePlatformAdminDto) {
    return this.adminService.createPlatformAdmin(dto);
  }

  /** Remove a platform admin user (Super Admin only) */
  @Roles('super_admin')
  @Delete('users/:id')
  deletePlatformAdmin(@Param('id') id: string) {
    return this.adminService.deletePlatformAdmin(id);
  }

}
