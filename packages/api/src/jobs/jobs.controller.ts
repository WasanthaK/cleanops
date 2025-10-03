/**
 * Jobs controller exposes endpoints for listing assigned jobs and retrieving detail.
 */
import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JobsService } from './jobs.service.js';

@ApiBearerAuth()
@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  list(@Req() req: Request) {
    const workerId = (req.user as { sub: string }).sub;
    return this.jobsService.list(workerId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.jobsService.get(id);
  }
}
