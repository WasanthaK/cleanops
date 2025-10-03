/**
 * DTOs powering offline sync operations.
 */
import { ArrayMinSize, IsArray, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SyncEventDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsISO8601()
  occurredAt!: string;

  @IsString()
  @IsNotEmpty()
  payload!: string;

  @IsOptional()
  @IsString()
  id?: string;
}

export class SyncBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  events!: SyncEventDto[];
}
