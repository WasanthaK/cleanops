/**
 * Pure helper used for testing queue flush strategy.
 */
export interface PendingEvent {
  id: number;
  retries?: number;
}

export function calculateFlushPlan(events: PendingEvent[]): PendingEvent[] {
  return events.filter((event) => (event.retries ?? 0) < 3).slice(0, 25);
}
