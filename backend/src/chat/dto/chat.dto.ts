import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class StartChatDto {
  @IsUUID()
  businessId!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;

  /** Optional first message body */
  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  mediaKey?: string;
}
