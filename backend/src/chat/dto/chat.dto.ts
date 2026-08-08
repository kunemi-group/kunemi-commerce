import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartChatDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Business Tenant UUID' })
  @IsUUID()
  businessId!: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', description: 'Optional Product UUID context' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012', description: 'Optional Order UUID context' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ example: 'Inquiry about Ankara Dress size availability', description: 'Thread subject' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;

  @ApiPropertyOptional({ example: 'Hello! Is this dress available in Size XL?', description: 'Initial message body' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Yes! We have 5 units in stock. Would you like me to send an order link?', description: 'Message body' })
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ example: 'uploads/chat-image-123.jpg', description: 'Optional media file key' })
  @IsOptional()
  @IsString()
  mediaKey?: string;
}
