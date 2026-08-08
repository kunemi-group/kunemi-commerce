import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterUserDto, RegisterDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Workspace: create business + owner account */
  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  /** Business/Seller registration endpoint */
  @Public()
  @Post('business/register')
  registerBusiness(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  /** Business/Seller login endpoint */
  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.businessLogin(body);
  }

  /** Business/Seller login explicit route */
  @Public()
  @Post('business/login')
  businessLogin(@Body() body: LoginDto) {
    return this.auth.businessLogin(body);
  }

  /** ShopFlow / End User registration */
  @Public()
  @Post('user/register')
  registerUser(@Body() body: RegisterUserDto) {
    return this.auth.registerUser(body);
  }

  /** ShopFlow / End User login */
  @Public()
  @Post('user/login')
  userLogin(@Body() body: LoginDto) {
    return this.auth.userLogin(body);
  }

  /** Platform Admin login endpoint */
  @Public()
  @Post('admin/login')
  adminLogin(@Body() body: LoginDto) {
    return this.auth.adminLogin(body);
  }

  /** Session bootstrap */
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}
