export interface SyncEvent {
  id: string;
  createdAt: Date;
  [key: string]: unknown;
}

export interface SyncQuery {
  since?: string;
  limit?: number;
}

export interface SyncEventPivot {
  id: string;
  createdAt: Date;
}

export interface SyncEventWhere {
  OR?: Array<
    | { createdAt: { gt: Date } }
    | { createdAt: Date; id: { gt: string } }
  >;
}

export type SyncEventOrderBy =
  | { createdAt: "asc" | "desc" }
  | { id: "asc" | "desc" };

export interface SyncEventDelegate {
  findMany(args: {
    where?: SyncEventWhere;
    orderBy?: SyncEventOrderBy[];
    take?: number;
  }): Promise<SyncEvent[]>;
  findUnique(args: {
    where: { id: string };
    select: { id: boolean; createdAt: boolean };
  }): Promise<SyncEventPivot | null>;
}

export interface PrismaLike {
  syncEvent: SyncEventDelegate;
}

export const DEFAULT_LIMIT = 100;

export class SyncService {
  constructor(private readonly prisma: PrismaLike) {}

  async listEvents(query: SyncQuery = {}): Promise<SyncEvent[]> {
    const { since, limit = DEFAULT_LIMIT } = query;

    let pivot: SyncEventPivot | null = null;

    if (since) {
      pivot = await this.prisma.syncEvent.findUnique({
        where: { id: since },
        select: { id: true, createdAt: true },
      });

      if (!pivot) {
        return [];
      }
    }

    const where = pivot
      ? {
          OR: [
            { createdAt: { gt: pivot.createdAt } },
            {
              createdAt: pivot.createdAt,
              id: { gt: pivot.id },
            },
          ],
        }
      : undefined;

    return this.prisma.syncEvent.findMany({
      where,
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],
      take: limit,
    });
  }
}
