/**
 * Signoff controller exposes client acknowledgement capture endpoint.
 */
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { SignoffService } from './signoff.service.js';
import { SignoffDto } from './dto/signoff.dto.js';

@ApiBearerAuth()
@ApiTags('signoff')
@Controller('jobs/:jobId/signoff')
export class SignoffController {
  constructor(private readonly service: SignoffService) {}

  @Post()
  create(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: SignoffDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.create(jobId, workerId, dto);
  }
}
