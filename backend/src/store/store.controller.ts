import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { StoreService } from './store.service';

/**
 * Public ShopFlow storefront API.
 * Kunemi Workspace is the commerce backend; ShopFlow renders the social store.
 */
@Public()
@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get(':slug')
  getStore(@Param('slug') slug: string) {
    return this.store.getStore(slug);
  }

  @Get(':slug/products')
  listProducts(@Param('slug') slug: string) {
    return this.store.listProducts(slug);
  }

  @Get(':slug/products/:productId')
  getProduct(
    @Param('slug') slug: string,
    @Param('productId') productId: string,
  ) {
    return this.store.getProduct(slug, productId);
  }
}
