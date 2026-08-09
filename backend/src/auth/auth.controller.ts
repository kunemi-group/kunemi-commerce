import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterUserDto,
  RegisterDto,
  VerifyEmailDto,
  ResendOtpDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  clearSessionCookies,
  refreshTokenFromRequest,
  setSessionCookies,
} from './session-cookies';

type TokenBearingResponse = {
  accessToken: string;
  refreshToken: string;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private async establishSession<T extends TokenBearingResponse>(
    response: Response,
    resultPromise: Promise<T>,
  ): Promise<Omit<T, 'accessToken' | 'refreshToken'>> {
    const result = await resultPromise;
    setSessionCookies(response, result);
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...body } =
      result;
    return body;
  }

  /** Workspace: create business + owner account */
  @Public()
  @Post('register')
  register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.register(body));
  }

  /** Business/Seller registration endpoint */
  @Public()
  @Post('business/register')
  registerBusiness(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.register(body));
  }

  /** Business/Seller login endpoint */
  @Public()
  @Post('login')
  login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.businessLogin(body));
  }

  /** Business/Seller login explicit route */
  @Public()
  @Post('business/login')
  businessLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.businessLogin(body));
  }

  /** ShopFlow / End User registration */
  @Public()
  @Post('user/register')
  registerUser(
    @Body() body: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.registerUser(body));
  }

  /** ShopFlow / End User login */
  @Public()
  @Post('user/login')
  userLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.userLogin(body));
  }

  /** Platform Admin login endpoint */
  @Public()
  @Post('admin/login')
  adminLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.adminLogin(body));
  }

  /** Verify 6-digit email OTP */
  @Public()
  @Post('verify-email')
  verifyEmail(
    @Body() body: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.establishSession(response, this.auth.verifyEmail(body));
  }

  /** Resend 6-digit email OTP */
  @Public()
  @Post('resend-otp')
  resendOtp(@Body() body: ResendOtpDto) {
    return this.auth.resendOtp(body);
  }

  /** Refresh Access Token using Refresh Token */
  @Public()
  @Post('refresh')
  refreshToken(
    @Body() body: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body.refreshToken ?? refreshTokenFromRequest(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.establishSession(
      response,
      this.auth.refreshToken(refreshToken),
    );
  }

  /** Invalidate Refresh Token / Logout session */
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(user.sub);
    clearSessionCookies(response);
    return result;
  }

  /** Session bootstrap */
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}
