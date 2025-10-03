/**
 * DTO describing a payroll draft request payload.
 */
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNumber, IsString } from 'class-validator';

import { DayTypeEnum } from '../../award/award.config.js';

export class PayrollDayDto {
  @IsEnum(DayTypeEnum)
  dayType!: DayTypeEnum;

  @Type(() => Number)
  @IsNumber()
  hours!: number;

  @Type(() => Number)
  @IsNumber()
  baseRate!: number;
}

export class PayrollDraftDto {
  @IsArray()
  @ArrayMinSize(1)
  days!: PayrollDayDto[];

  @IsString()
  timezone!: string;
}
