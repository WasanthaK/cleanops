/**
 * DTO for Evia Sign webhook events.
 */
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class WebhookEventDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  signedAt?: string;

  @IsString()
  @IsOptional()
  signedPdfUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
