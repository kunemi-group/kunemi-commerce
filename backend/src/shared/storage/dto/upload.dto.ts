import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadBase64Dto {
  @ApiProperty({
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    description: 'Raw Base64 string or data URL',
  })
  @IsString()
  @MinLength(1)
  base64!: string;

  @ApiPropertyOptional({ example: 'image/jpeg', description: 'Content MIME Type' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ example: 'product_image.jpg', description: 'Original filename' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({
    example: 'product',
    enum: ['product', 'variant', 'brand', 'document', 'payment_proof', 'misc'],
    description: 'Upload category / folder storage purpose',
  })
  @IsIn([
    'product',
    'variant',
    'brand',
    'document',
    'payment_proof',
    'misc',
  ])
  purpose!:
    | 'product'
    | 'variant'
    | 'brand'
    | 'document'
    | 'payment_proof'
    | 'misc';
}
