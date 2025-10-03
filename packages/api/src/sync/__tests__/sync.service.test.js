const test = require('node:test');
const assert = require('node:assert/strict');
const { SyncService } = require('../sync.service.js');

class FakeSyncEventDelegate {
  constructor(events) {
    this.events = events;
  }

  async findUnique({ where }) {
    return (
      this.events.find((event) => event.id === where.id) ?? null
    );
  }

  async findMany({ where, orderBy, take }) {
    let results = [...this.events];

    if (where?.OR) {
      const [newerThan, tieBreaker] = where.OR;
      const pivotDate = newerThan.createdAt?.gt;
      const pivotId = tieBreaker?.id?.gt;

      results = results.filter((event) => {
        if (pivotDate && event.createdAt > pivotDate) {
          return true;
        }

        if (
          pivotDate &&
          pivotId &&
          event.createdAt.getTime() === pivotDate.getTime() &&
          event.id > pivotId
        ) {
          return true;
        }

        return !pivotDate;
      });
    }

    if (orderBy) {
      results.sort((a, b) => {
        for (const clause of orderBy) {
          const [[field, direction]] = Object.entries(clause);
          let comparison = 0;

          if (field === 'createdAt') {
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
          } else if (field === 'id') {
            comparison = a.id.localeCompare(b.id);
          }

          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }

        return 0;
      });
    }

    if (typeof take === 'number') {
      results = results.slice(0, take);
    }

    return results;
  }
}

class FakePrisma {
  constructor(events) {
    this.syncEvent = new FakeSyncEventDelegate(events);
  }
}

test('listEvents returns chronologically ordered results after a cursor', async () => {
  const chronological = [
    { id: 'clv9t4gdy0000xj9k13', createdAt: new Date('2024-01-01T00:00:00.000Z') },
    { id: 'clv9t4gdy0001xj9k13', createdAt: new Date('2024-01-01T00:01:00.000Z') },
    { id: 'clv9t4gdy0002xj9k13', createdAt: new Date('2024-01-01T00:02:00.000Z') },
    { id: 'clv9t4gdy0003xj9k13', createdAt: new Date('2024-01-01T00:03:00.000Z') },
    { id: 'clv9t4gdy0004xj9k13', createdAt: new Date('2024-01-01T00:04:00.000Z') },
  ];

  const shuffled = [chronological[2], chronological[4], chronological[0], chronological[3], chronological[1]];

  const service = new SyncService(new FakePrisma(shuffled));
  const sinceId = chronological[1].id;

  const results = await service.listEvents({ since: sinceId });
  const expected = chronological.slice(2).map((event) => event.id);

  assert.deepStrictEqual(
    results.map((event) => event.id),
    expected,
  );

  assert.ok(
    results.every((event, index, array) =>
      index === 0 || array[index - 1].createdAt <= event.createdAt,
    ),
    'results should be chronological',
  );
});

test('listEvents includes siblings sharing the same createdAt using id tiebreakers', async () => {
  const createdAt = new Date('2024-01-01T00:00:00.000Z');
  const chronological = [
    { id: 'clv9t4gdy0000xj9k13', createdAt },
    { id: 'clv9t4gdy0001xj9k13', createdAt },
    { id: 'clv9t4gdy0002xj9k13', createdAt },
  ];

  const shuffled = [chronological[2], chronological[0], chronological[1]];

  const service = new SyncService(new FakePrisma(shuffled));
  const sinceId = chronological[0].id;

  const results = await service.listEvents({ since: sinceId });
  const expected = chronological.slice(1).map((event) => event.id);

  assert.deepStrictEqual(
    results.map((event) => event.id),
    expected,
  );
});
