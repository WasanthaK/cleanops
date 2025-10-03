/**
 * Sync controller exposes background sync endpoints.
 */
import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { SyncService } from './sync.service.js';
import { SyncBatchDto } from './dto/sync.dto.js';

@ApiBearerAuth()
@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  private workerId(req: Request) {
    return (req.user as { sub: string }).sub;
  }

  @Post('batch')
  ingest(@Req() req: Request, @Body() dto: SyncBatchDto) {
    return this.service.ingest(this.workerId(req), dto);
  }

  @Get('since')
  since(@Req() req: Request, @Query('cursor') cursor?: string) {
    return this.service.since(this.workerId(req), cursor);
  }
}
