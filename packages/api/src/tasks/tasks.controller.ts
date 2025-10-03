/**
 * Tasks controller handles offline-friendly bulk updates from the web client.
 */
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { TasksService } from './tasks.service.js';
import { TaskBulkDto } from './dto/task-bulk.dto.js';

@ApiBearerAuth()
@ApiTags('tasks')
@Controller('jobs/:jobId/tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Post('bulk')
  bulkUpsert(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: TaskBulkDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.bulkUpsert(jobId, workerId, dto);
  }
}
