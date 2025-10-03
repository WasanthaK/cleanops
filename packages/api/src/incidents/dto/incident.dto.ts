/**
 * DTO for incident reporting.
 */
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IncidentDto {
  @IsISO8601()
  occurredAt!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  actionTaken?: string;
}
