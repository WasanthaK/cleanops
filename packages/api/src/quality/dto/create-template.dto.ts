import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() jobCategory: string;
  @ApiProperty() @IsArray() items: any[];
}
