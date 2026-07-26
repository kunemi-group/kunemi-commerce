import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Customer: "I have made payment" (+ optional proof as base64) */
export class ClaimPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  /** Original filename, e.g. receipt.jpg */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  proofFilename?: string;

  /** image/jpeg, image/png, image/webp, application/pdf */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  proofMimeType?: string;

  /**
   * Raw base64 (no data: prefix) or full data URL.
   * Max ~4MB decoded is enforced in service.
   */
  @IsOptional()
  @IsString()
  proofBase64?: string;
}

export class RejectPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class VerifyPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
