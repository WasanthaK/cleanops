/**
 * DTO for connecting to Xero via OAuth authorization code.
 */
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConnectXeroDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}
