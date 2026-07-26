import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDeliveryDto {
  @IsUUID()
  orderId!: string;

  @IsIn(['manual', 'api_integrated'])
  fulfillmentMode!: 'manual' | 'api_integrated';

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  externalTrackingUrl?: string;

  @IsOptional()
  @IsString()
  externalCourierName?: string;
}

export class UpdateDeliveryStatusDto {
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

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  externalTrackingUrl?: string;

  @IsOptional()
  @IsString()
  externalCourierName?: string;
}
