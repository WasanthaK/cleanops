import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewChecklistDto {
  @ApiProperty() @IsString() supervisorId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewNotes?: string;
}
