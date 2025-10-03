/**
 * DTO for bulk task upsert operations.
 */
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TaskItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TaskBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  tasks!: TaskItemDto[];
}
