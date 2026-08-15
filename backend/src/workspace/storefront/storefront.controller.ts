import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { StoreCheckoutDto } from './dto/store-checkout.dto';
import { StorefrontService } from './storefront.service';

/**
 * Public single-business storefront API for Kunemi Workspace.
 * Routes stay under /api/store/:slug for stable public URLs.
 * Checkout creates Workspace seller orders — not ShopFlow marketplace orders.
 */
@ApiTags('Workspace Storefront')
@Public()
@Controller('store')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get(':slug')
  getStore(@Param('slug') slug: string) {
    return this.storefront.getStore(slug);
  }

  @Get(':slug/products')
  listProducts(@Param('slug') slug: string) {
    return this.storefront.listProducts(slug);
  }

  @Get(':slug/products/:productId')
  getProduct(
    @Param('slug') slug: string,
    @Param('productId') productId: string,
  ) {
    return this.storefront.getProduct(slug, productId);
  }

  /** Guest checkout → Workspace order + bank-transfer pay link */
  @Post(':slug/checkout')
  checkout(@Param('slug') slug: string, @Body() body: StoreCheckoutDto) {
    return this.storefront.checkout(slug, body);
  }
}
