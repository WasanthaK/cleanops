/**
 * DTO capturing metadata for a proof photo.
 */
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PhotoKindDto {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  INCIDENT = 'INCIDENT',
  SIGNATURE = 'SIGNATURE',
  QUALITY = 'QUALITY',
  GENERAL = 'GENERAL'
}

export class PhotoCreateDto {
  @IsEnum(PhotoKindDto)
  kind!: PhotoKindDto;

  @IsString()
  @IsNotEmpty()
  objectKey!: string;

  @IsString()
  @IsNotEmpty()
  hash!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class PhotoUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string;
}

export class BatchPhotoCreateDto {
  @IsEnum(PhotoKindDto)
  kind!: PhotoKindDto;

  @IsString()
  @IsNotEmpty()
  objectKey!: string;

  @IsString()
  @IsNotEmpty()
  hash!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}

export class BatchPhotoUploadDto {
  @IsNotEmpty()
  photos!: BatchPhotoCreateDto[];
}

export class PhotoCategorizeDto {
  @IsEnum(PhotoKindDto)
  kind!: PhotoKindDto;

  @IsOptional()
  @IsString()
  note?: string;
}

export class BatchDeleteDto {
  @IsNotEmpty()
  photoIds!: string[];
}
