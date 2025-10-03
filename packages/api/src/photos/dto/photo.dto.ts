/**
 * DTO capturing metadata for a proof photo.
 */
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PhotoKindDto {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  INCIDENT = 'INCIDENT',
  SIGNATURE = 'SIGNATURE'
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
