/**
 * Incidents service stores safety or service incidents reported by workers.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { IncidentDto } from './dto/incident.dto.js';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(jobId: string, workerId: string, dto: IncidentDto) {
    return this.prisma.incident.create({
      data: {
        jobId,
        workerId,
        occurredAt: new Date(dto.occurredAt),
        description: dto.description,
        actionTaken: dto.actionTaken ?? null
      }
    });
  }
}
