/**
 * Xero integration controller exposing OAuth and sync endpoints.
 */
import { Controller, Get, Post, Body, Param, Query, Redirect } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { XeroService } from './xero.service.js';
import { ConnectXeroDto } from './dto/connect-xero.dto.js';
import { SyncPayrollDto } from './dto/sync-payroll.dto.js';

@ApiBearerAuth()
@ApiTags('integrations/xero')
@Controller('integrations/xero')
export class XeroController {
  constructor(private readonly xeroService: XeroService) {}

  @Get('connect')
  @ApiOperation({ summary: 'Get Xero OAuth consent URL' })
  @Redirect()
  async getConsentUrl() {
    const url = await this.xeroService.getConsentUrl();
    return { url, statusCode: 302 };
  }

  @Post('callback')
  @ApiOperation({ summary: 'Handle OAuth callback from Xero' })
  async handleCallback(@Body() dto: ConnectXeroDto) {
    return this.xeroService.connect(dto);
  }

  @Post('disconnect/:tenantId')
  @ApiOperation({ summary: 'Disconnect Xero integration' })
  async disconnect(@Param('tenantId') tenantId: string) {
    return this.xeroService.disconnect(tenantId);
  }

  @Post('sync-payroll/:tenantId')
  @ApiOperation({ summary: 'Sync payroll data to Xero' })
  async syncPayroll(
    @Param('tenantId') tenantId: string,
    @Body() dto: SyncPayrollDto
  ) {
    return this.xeroService.syncPayroll(tenantId, dto);
  }

  @Get('status/:tenantId')
  @ApiOperation({ summary: 'Get Xero integration status' })
  async getStatus(@Param('tenantId') tenantId: string) {
    return this.xeroService.getStatus(tenantId);
  }
}
