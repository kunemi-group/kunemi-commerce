import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  AddVariantDto,
  CreateProductDto,
  RestockVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/product.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@Controller('products')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.inventory.listProducts(user);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.inventory.getProduct(id, user);
  }

  @Post()
  create(@Body() body: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.inventory.createProduct(body, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventory.updateProduct(id, body, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.inventory.deleteProduct(id, user);
  }

  @Post(':id/variants')
  addVariant(
    @Param('id') id: string,
    @Body() body: AddVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventory.addVariant(id, body, user);
  }
}

@Controller('variants')
export class VariantsController {
  constructor(private readonly inventory: InventoryService) {}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventory.updateVariant(id, body, user);
  }

  @Post(':id/restock')
  restock(
    @Param('id') id: string,
    @Body() body: RestockVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventory.restockVariant(id, body, user);
  }
}
