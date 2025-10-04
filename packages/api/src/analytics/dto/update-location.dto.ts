/**
 * DTO for updating worker location.
 */
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Worker ID',
    example: 'clxxx123456789'
  })
  @IsString()
  workerId: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: -33.8688,
    minimum: -90,
    maximum: 90
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 151.2093,
    minimum: -180,
    maximum: 180
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Location accuracy in meters',
    example: 10.5
  })
  @IsNumber()
  @Min(0)
  accuracy: number;

  @ApiPropertyOptional({
    description: 'Associated job ID (optional)',
    example: 'clxxx987654321'
  })
  @IsOptional()
  @IsString()
  jobId?: string;
}
