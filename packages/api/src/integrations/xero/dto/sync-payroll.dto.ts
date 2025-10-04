/**
 * DTO for syncing payroll data to Xero.
 */
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class SyncPayrollDto {
  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  workerId?: string;
}
