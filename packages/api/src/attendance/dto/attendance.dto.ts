/**
 * DTO capturing attendance event information with optional coordinates.
 */
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class AttendanceEventDto {
  @IsISO8601()
  occurredAt!: string;

  @IsOptional()
  @IsNumber({}, { each: true })
  coordinates?: number[];

  @IsOptional()
  @IsString()
  note?: string;
}
