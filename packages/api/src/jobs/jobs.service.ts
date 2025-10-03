/**
 * Jobs service handles retrieval of jobs and associated state for workers.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  list(workerId: string) {
    return this.prisma.job.findMany({
      where: { assignments: { some: { workerId } } },
      include: {
        site: true,
        tasks: true
      }
    });
  }

  get(jobId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        site: true,
        tasks: true,
        attendances: true,
        incidents: true,
        photos: true,
        signoff: true
      }
    });
  }
}
