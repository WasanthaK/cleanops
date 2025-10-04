/**
 * DTO for creating a new job template.
 */
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskTemplateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  estimatedMinutes?: number;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskTemplateDto)
  @IsOptional()
  tasks?: TaskTemplateDto[];
}
