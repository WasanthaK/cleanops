/**
 * Attendance service records travel and shift events for audit trails.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { AttendanceEventDto } from './dto/attendance.dto.js';

type AttendanceType = 'TRAVEL_START' | 'ARRIVE' | 'CLOCK_IN' | 'BREAK' | 'CLOCK_OUT';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private createEvent(jobId: string, workerId: string, type: AttendanceType, dto: AttendanceEventDto) {
    return this.prisma.attendance.create({
      data: {
        jobId,
        workerId,
        type,
        occurredAt: new Date(dto.occurredAt),
        coordinates: dto.coordinates ? dto.coordinates : undefined,
        note: dto.note ?? null
      }
    });
  }

  startTravel(jobId: string, workerId: string, dto: AttendanceEventDto) {
    return this.createEvent(jobId, workerId, 'TRAVEL_START', dto);
  }

  arrive(jobId: string, workerId: string, dto: AttendanceEventDto) {
    return this.createEvent(jobId, workerId, 'ARRIVE', dto);
  }

  clockIn(jobId: string, workerId: string, dto: AttendanceEventDto) {
    return this.createEvent(jobId, workerId, 'CLOCK_IN', dto);
  }

  recordBreak(jobId: string, workerId: string, dto: AttendanceEventDto) {
    return this.createEvent(jobId, workerId, 'BREAK', dto);
  }

  clockOut(jobId: string, workerId: string, dto: AttendanceEventDto) {
    return this.createEvent(jobId, workerId, 'CLOCK_OUT', dto);
  }
}
