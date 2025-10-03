/**
 * Tasks service provides bulk upsert operations aligned with offline sync batches.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { TaskBulkDto } from './dto/task-bulk.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async bulkUpsert(jobId: string, workerId: string, dto: TaskBulkDto) {
    const operations = dto.tasks.map((task) => {
      if (task.id) {
        return this.prisma.taskItem.upsert({
          where: { id: task.id },
          update: {
            title: task.title,
            completed: task.completed ?? false,
            notes: task.notes ?? null,
            workerId
          },
          create: {
            id: task.id,
            jobId,
            workerId,
            title: task.title,
            completed: task.completed ?? false,
            notes: task.notes ?? null
          }
        });
      }
      return this.prisma.taskItem.create({
        data: {
          jobId,
          workerId,
          title: task.title,
          completed: task.completed ?? false,
          notes: task.notes ?? null
        }
      });
    });

    return this.prisma.$transaction(operations);
  }
}
