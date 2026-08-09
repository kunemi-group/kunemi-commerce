import { IsIn, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Associated Order UUID' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 'manual', enum: ['manual', 'api_integrated'], description: 'Fulfillment mode' })
  @IsIn(['manual', 'api_integrated'])
  fulfillmentMode!: 'manual' | 'api_integrated';

  @ApiPropertyOptional({ example: 'gokada', description: 'Courier provider ID' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'https://track.gokada.ng/GK-982103', description: 'External courier tracking URL' })
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  externalTrackingUrl?: string;

  @ApiPropertyOptional({ example: 'Gokada Express', description: 'External courier display name' })
  @IsOptional()
  @IsString()
  externalCourierName?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    example: 'out_for_delivery',
    enum: ['awaiting_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
    description: 'New delivery status',
  })
  @IsIn([
    'awaiting_pickup',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'failed',
    'cancelled',
  ])
  status!:
    | 'awaiting_pickup'
    | 'picked_up'
    | 'out_for_delivery'
    | 'delivered'
    | 'failed'
    | 'cancelled';

  @ApiPropertyOptional({ example: 'Dispatch rider en route to Lekki Phase 1', description: 'Status update note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'https://track.gokada.ng/GK-982103' })
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  externalTrackingUrl?: string;

  @ApiPropertyOptional({ example: 'Gokada Express' })
  @IsOptional()
  @IsString()
  externalCourierName?: string;
}
