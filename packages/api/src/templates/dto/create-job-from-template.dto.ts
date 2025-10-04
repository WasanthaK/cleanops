/**
 * DTO for creating a job from a template.
 */
import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateJobFromTemplateDto {
  @IsString()
  @IsNotEmpty()
  siteId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledDate!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workerIds?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}
