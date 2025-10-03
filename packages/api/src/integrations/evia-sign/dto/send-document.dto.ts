/**
 * DTO for sending a document for signing via Evia Sign.
 */
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class SendDocumentDto {
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @IsEmail()
  @IsNotEmpty()
  recipientEmail!: string;

  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  templateId?: string;
}
