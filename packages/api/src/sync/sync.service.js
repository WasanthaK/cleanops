const DEFAULT_LIMIT = 100;

class SyncService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async listEvents(query = {}) {
    const { since, limit = DEFAULT_LIMIT } = query;

    let pivot = null;

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

module.exports = {
  SyncService,
  DEFAULT_LIMIT,
};
