/**
 * Payroll controller exposes draft calculation endpoint.
 */
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { PayrollService } from './payroll.service.js';
import { PayrollDraftDto } from './dto/payroll.dto.js';

@ApiBearerAuth()
@ApiTags('payroll')
@Controller('jobs/:jobId/payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Post('draft')
  draft(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: PayrollDraftDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.draft(jobId, workerId, dto);
  }
}
