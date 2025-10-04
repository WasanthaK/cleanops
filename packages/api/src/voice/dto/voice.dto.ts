/**
 * DTOs for voice features
 */
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateVoiceNoteDto {
  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  incidentId?: string;

  @IsString()
  @IsNotEmpty()
  audioKey!: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsInt()
  @Min(0)
  duration!: number;

  @IsOptional()
  @IsString()
  language?: string;
}

export class TranscribeAudioDto {
  @IsString()
  @IsNotEmpty()
  audioKey!: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class VoiceCommandDto {
  @IsString()
  @IsNotEmpty()
  command!: string;

  @IsOptional()
  @IsString()
  jobId?: string;
}

export class AudioUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string;
}
