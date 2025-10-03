import { SyncService } from '../src/sync/sync.service.js';

type Event = {
  id: string;
  workerId: string;
  createdAt: Date;
  occurredAt: Date;
  type: string;
  payload: string;
};

const buildPrismaMock = (events: Event[]) => {
  return {
    syncEvent: {
      findMany: jest.fn(({ where, take }: any) => {
        const createdGt: Date | undefined = where.createdAt?.gt;
        const filtered = events
          .filter((event) => event.workerId === where.workerId)
          .filter((event) => (createdGt ? event.createdAt > createdGt : true))
          .sort((a, b) => {
            const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
            return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
          });
        const limited = typeof take === 'number' ? filtered.slice(0, take) : filtered;
        return limited.map((event) => ({ ...event }));
      })
    }
  } as any;
};

describe('SyncService', () => {
  const sampleEvents: Event[] = [
    {
      id: 'czx_early',
      workerId: 'worker-1',
      createdAt: new Date('2024-02-01T01:00:00Z'),
      occurredAt: new Date('2024-02-01T01:00:00Z'),
      type: 'attendance',
      payload: '{}'
    },
    {
      id: 'caa_late-but-lexically-small',
      workerId: 'worker-1',
      createdAt: new Date('2024-02-01T02:00:00Z'),
      occurredAt: new Date('2024-02-01T02:00:00Z'),
      type: 'attendance',
      payload: '{}'
    },
    {
      id: 'czb_last',
      workerId: 'worker-1',
      createdAt: new Date('2024-02-01T03:30:00Z'),
      occurredAt: new Date('2024-02-01T03:30:00Z'),
      type: 'attendance',
      payload: '{}'
    }
  ];

  it('returns every event after the cursor even when CUID ordering is non-chronological', async () => {
    const prisma = buildPrismaMock(sampleEvents);
    const service = new SyncService(prisma);

    const cursor = sampleEvents[0].createdAt.toISOString();
    const results = await service.since('worker-1', cursor);

    expect(results.map((event) => event.id)).toEqual([
      'caa_late-but-lexically-small',
      'czb_last'
    ]);
    expect(prisma.syncEvent.findMany).toHaveBeenCalledWith({
      where: {
        workerId: 'worker-1',
        createdAt: { gt: expect.any(Date) }
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' }
      ],
      take: 100
    });
    const callArgs = (prisma.syncEvent.findMany as jest.Mock).mock.calls[0][0];
    expect((callArgs.where.createdAt.gt as Date).toISOString()).toBe(cursor);
  });

  it('ignores invalid cursors and returns the newest events', async () => {
    const prisma = buildPrismaMock(sampleEvents);
    const service = new SyncService(prisma);

    const results = await service.since('worker-1', 'not-a-date');

    expect(results).toHaveLength(3);
    expect(results[0].id).toBe('czx_early');
    expect(prisma.syncEvent.findMany).toHaveBeenCalledWith({
      where: {
        workerId: 'worker-1'
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' }
      ],
      take: 100
    });
  });
});
