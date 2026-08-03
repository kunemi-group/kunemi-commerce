import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterBuyerDto, RegisterDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Workspace: create business + owner */
  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  /** Workspace staff login only (buyers rejected) */
  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.loginWorkspace(body);
  }

  /** ShopFlow: buyer registration */
  @Public()
  @Post('buyer/register')
  registerBuyer(@Body() body: RegisterBuyerDto) {
    return this.auth.registerBuyer(body);
  }

  /** ShopFlow: buyer login only (staff rejected) */
  @Public()
  @Post('buyer/login')
  loginBuyer(@Body() body: LoginDto) {
    return this.auth.loginBuyer(body);
  }

  /** Session bootstrap — staff get business; buyers get business: null */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}
