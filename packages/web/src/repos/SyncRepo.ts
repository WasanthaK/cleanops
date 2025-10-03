/**
 * SyncRepo manages offline event queue and flush state.
 */
import { apiRepo } from './ApiRepo';
import { calculateFlushPlan } from '../sync/flush';

interface QueuedEvent {
  id?: number;
  type: string;
  payload: string;
  occurredAt: string;
  retries?: number;
}

const DB_NAME = 'cleanops-sync';
const STORE_NAME = 'events';

export class SyncRepo {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDb();
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async enqueue(event: Omit<QueuedEvent, 'id'>) {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...event, retries: 0 });
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async flush() {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const items = await new Promise<QueuedEvent[]>((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueuedEvent[]);
    });
    const plan = calculateFlushPlan(items as any);
    if (!plan.length) {
      return { flushed: 0 };
    }
    await apiRepo.syncBatch(plan.map(({ type, payload, occurredAt }) => ({ type, payload, occurredAt })));
    plan.forEach((item) => item.id && store.delete(item.id));
    return { flushed: plan.length };
  }
}

export const syncRepo = new SyncRepo();
