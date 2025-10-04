import { IsString, IsArray, IsBoolean, IsInt, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CheckItemDto {
  @ApiProperty() @IsString() category: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsBoolean() passed: boolean;
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) score: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) photoKeys?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() required?: boolean;
}

export class CreateChecklistDto {
  @ApiProperty() @IsString() jobId: string;
  @ApiProperty() @IsString() workerId: string;
  @ApiProperty({ type: [CheckItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CheckItemDto) items: CheckItemDto[];
}
