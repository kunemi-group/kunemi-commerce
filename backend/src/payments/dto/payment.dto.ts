import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Customer: "I have made payment" (+ optional proof file) */
export class ClaimPaymentDto {
  @ApiPropertyOptional({ example: 'Transferred ₦17,500 from GTBank App', description: 'Customer payment note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  @ApiPropertyOptional({ example: 'gtbank_receipt_0912.jpg', description: 'Proof file name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  proofFilename?: string;

  @ApiPropertyOptional({ example: 'image/jpeg', description: 'Proof MIME type' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  proofMimeType?: string;

  @ApiPropertyOptional({ example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', description: 'Base64 encoded proof file string' })
  @IsOptional()
  @IsString()
  proofBase64?: string;
}

export class RejectPaymentDto {
  @ApiPropertyOptional({ example: 'Payment proof is unreadable or transfer not received in bank account', description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class VerifyPaymentDto {
  @ApiPropertyOptional({ example: 'Verified GTBank credit alert received', description: 'Verification note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
