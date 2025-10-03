/**
 * Attendance controller exposes workflow endpoints for worker time capture.
 */
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AttendanceService } from './attendance.service.js';
import { AttendanceEventDto } from './dto/attendance.dto.js';

@ApiBearerAuth()
@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  private getWorkerId(req: Request) {
    return (req.user as { sub: string }).sub;
  }

  @Post(':jobId/start-travel')
  startTravel(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: AttendanceEventDto) {
    return this.service.startTravel(jobId, this.getWorkerId(req), dto);
  }

  @Post(':jobId/arrive')
  arrive(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: AttendanceEventDto) {
    return this.service.arrive(jobId, this.getWorkerId(req), dto);
  }

  @Post(':jobId/clock-in')
  clockIn(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: AttendanceEventDto) {
    return this.service.clockIn(jobId, this.getWorkerId(req), dto);
  }

  @Post(':jobId/break')
  recordBreak(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: AttendanceEventDto) {
    return this.service.recordBreak(jobId, this.getWorkerId(req), dto);
  }

  @Post(':jobId/clock-out')
  clockOut(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: AttendanceEventDto) {
    return this.service.clockOut(jobId, this.getWorkerId(req), dto);
  }
}
