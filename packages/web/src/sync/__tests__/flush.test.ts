import { describe, expect, it } from 'vitest';

import { calculateFlushPlan } from '../flush';

describe('calculateFlushPlan', () => {
  it('filters out events with too many retries', () => {
    const plan = calculateFlushPlan([
      { id: 1, retries: 0 },
      { id: 2, retries: 5 },
      { id: 3 }
    ]);
    expect(plan.map((item) => item.id)).toEqual([1, 3]);
  });

  it('limits batch size to 25 events', () => {
    const many = Array.from({ length: 30 }, (_, index) => ({ id: index }));
    expect(calculateFlushPlan(many)).toHaveLength(25);
  });
});
