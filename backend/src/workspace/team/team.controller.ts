import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthUser } from '../../common/types/auth-user';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/team.dto';
import { TeamService } from './team.service';

@Controller('team')
@UseGuards(RolesGuard)
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.team.list(user);
  }

  @Post('invite')
  @Roles('owner', 'manager')
  invite(@Body() body: InviteMemberDto, @CurrentUser() user: AuthUser) {
    return this.team.invite(body, user);
  }

  @Patch(':id/role')
  @Roles('owner', 'manager')
  updateRole(
    @Param('id') id: string,
    @Body() body: UpdateMemberRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.team.updateRole(id, body, user);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.team.remove(id, user);
  }
}
