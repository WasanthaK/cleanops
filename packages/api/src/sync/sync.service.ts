/**
 * Sync service stores offline events and serves incremental change feeds.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SyncBatchDto } from './dto/sync.dto.js';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(workerId: string, dto: SyncBatchDto) {
    const events = await this.prisma.$transaction(
      dto.events.map((event) =>
        this.prisma.syncEvent.create({
          data: {
            workerId,
            type: event.type,
            occurredAt: new Date(event.occurredAt),
            payload: event.payload
          }
        })
      )
    );
    return { inserted: events.length }; 
  }

  async since(workerId: string, cursor?: string) {
    let createdAfter: Date | undefined;

    if (cursor) {
      const parsed = new Date(cursor);
      if (!Number.isNaN(parsed.getTime())) {
        createdAfter = parsed;
      }
    }

    return this.prisma.syncEvent.findMany({
      where: {
        workerId,
        ...(createdAfter ? { createdAt: { gt: createdAfter } } : {})
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' }
      ],
      take: 100
    });
  }
}
