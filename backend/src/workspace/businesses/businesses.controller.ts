import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthUser } from '../../common/types/auth-user';

@Controller('businesses')
@UseGuards(RolesGuard)
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.businesses.me(user);
  }

  @Patch('me')
  @Roles('owner', 'manager')
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateBusinessDto) {
    return this.businesses.updateMe(user, body);
  }
}
