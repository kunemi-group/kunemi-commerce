import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { UploadBase64Dto } from './dto/upload.dto';
import { StorageService } from './storage.service';

@Controller()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /** Storage health for ops / settings UI */
  @Get('storage/status')
  status() {
    return this.storage.status();
  }

  /**
   * Authenticated upload (base64). SPA product images, brand logo, docs, proofs.
   */
  @Post('uploads')
  async upload(@CurrentUser() user: AuthUser, @Body() body: UploadBase64Dto) {
    if (!body.base64?.trim()) {
      throw new BadRequestException('base64 is required');
    }
    const stored = await this.storage.uploadBase64({
      businessId: user.businessId,
      purpose: body.purpose,
      base64: body.base64,
      contentType: body.contentType,
      filename: body.filename,
      maxBytes:
        body.purpose === 'document' ? 12 * 1024 * 1024 : 8 * 1024 * 1024,
    });
    return {
      key: stored.key,
      url: stored.url,
      provider: stored.provider,
      contentType: stored.contentType,
      size: stored.size,
      filename: stored.filename,
    };
  }

  /**
   * Serve media by encoded storage key.
   * Public so ShopFlow can render product images without JWT.
   */
  @Public()
  @Get('media/:token')
  async media(
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token?.trim()) throw new BadRequestException('Missing media token');
    let key: string;
    try {
      key = this.storage.decodeKey(token);
    } catch {
      throw new BadRequestException('Invalid media token');
    }
    if (!key || key.includes('..')) {
      throw new BadRequestException('Invalid media key');
    }

    const publicUrl = this.storage.publicUrl(key);
    if (
      this.storage.isR2Enabled() &&
      publicUrl &&
      !publicUrl.includes('/media/')
    ) {
      res.redirect(302, publicUrl);
      return;
    }

    const obj = await this.storage.getObject(key);
    if (!obj) throw new NotFoundException('Media not found');

    res.set({
      'Content-Type': obj.contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    return new StreamableFile(obj.buffer);
  }
}
