/**
 * Incidents controller exposes reporting endpoint.
 */
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { IncidentsService } from './incidents.service.js';
import { IncidentDto } from './dto/incident.dto.js';

@ApiBearerAuth()
@ApiTags('incidents')
@Controller('jobs/:jobId/incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Post()
  create(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: IncidentDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.create(jobId, workerId, dto);
  }
}
