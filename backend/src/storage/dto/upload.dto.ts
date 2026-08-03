import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadBase64Dto {
  @IsString()
  @MinLength(1)
  base64!: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  filename?: string;

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
