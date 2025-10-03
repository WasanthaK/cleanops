/**
 * DTO representing client sign-off capture.
 */
import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class SignoffDto {
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @IsString()
  @IsNotEmpty()
  clientRole!: string;

  @IsISO8601()
  signedAt!: string;

  @IsString()
  @IsNotEmpty()
  signatureKey!: string;
}
