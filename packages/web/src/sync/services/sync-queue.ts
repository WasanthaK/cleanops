/**
 * Priority sync queue with exponential backoff retry
 */

export enum SyncPriority {
  HIGH = 'high',      // Attendance, signoff
  MEDIUM = 'medium',  // Photos, tasks
  LOW = 'low'         // Notes, non-critical data
}

export interface QueueItem {
  id: string;
  type: string;
  priority: SyncPriority;
  data: any;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: number;
  nextRetry?: number;
  error?: string;
  createdAt: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  estimatedTimeMs?: number;
}

export class SyncQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private readonly STORAGE_KEY = 'cleanops-sync-queue';
  private readonly BASE_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 60000; // 60 seconds

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add item to queue with priority
   */
  enqueue(type: string, data: any, priority: SyncPriority = SyncPriority.MEDIUM): string {
    const id = this.generateId();
    
    const item: QueueItem = {
      id,
      type,
      priority,
      data,
      attempts: 0,
      maxAttempts: this.getMaxAttempts(priority),
      createdAt: Date.now()
    };

    this.queue.push(item);
    this.sortQueue();
    this.saveToStorage();

    console.log(`Enqueued ${type} with ${priority} priority (${this.queue.length} items in queue)`);

    return id;
  }

  /**
   * Get next item to process
   */
  dequeue(): QueueItem | null {
    // Filter items that are ready to retry
    const readyItems = this.queue.filter(item => {
      if (item.attempts === 0) return true;
      if (!item.nextRetry) return true;
      return Date.now() >= item.nextRetry;
    });

    if (readyItems.length === 0) {
      return null;
    }

    // Return highest priority item
    this.sortQueue();
    const item = readyItems[0];
    
    return item;
  }

  /**
   * Mark item as completed and remove from queue
   */
  complete(id: string): void {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveToStorage();
      console.log(`Completed sync item ${id}`);
    }
  }

  /**
   * Mark item as failed and schedule retry
   */
  fail(id: string, error: string): void {
    const item = this.queue.find(item => item.id === id);
    if (!item) return;

    item.attempts++;
    item.error = error;
    item.lastAttempt = Date.now();

    if (item.attempts >= item.maxAttempts) {
      console.error(`Sync item ${id} failed after ${item.attempts} attempts:`, error);
      // Keep in queue but mark as failed
      item.nextRetry = undefined;
    } else {
      // Calculate exponential backoff delay
      const delay = this.calculateBackoffDelay(item.attempts);
      item.nextRetry = Date.now() + delay;
      console.log(`Sync item ${id} failed (attempt ${item.attempts}/${item.maxAttempts}), retrying in ${delay}ms`);
    }

    this.saveToStorage();
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempts: number): number {
    // Exponential backoff: delay = base * (2 ^ attempts)
    const delay = this.BASE_RETRY_DELAY * Math.pow(2, attempts - 1);
    return Math.min(delay, this.MAX_RETRY_DELAY);
  }

  /**
   * Get max attempts based on priority
   */
  private getMaxAttempts(priority: SyncPriority): number {
    switch (priority) {
      case SyncPriority.HIGH:
        return 10; // More retries for critical data
      case SyncPriority.MEDIUM:
        return 5;
      case SyncPriority.LOW:
        return 3;
      default:
        return 5;
    }
  }

  /**
   * Sort queue by priority and creation time
   */
  private sortQueue(): void {
    const priorityOrder = {
      [SyncPriority.HIGH]: 0,
      [SyncPriority.MEDIUM]: 1,
      [SyncPriority.LOW]: 2
    };

    this.queue.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation time (older first)
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Get sync progress
   */
  getProgress(): SyncProgress {
    const completed = 0; // Items removed from queue
    const failed = this.queue.filter(item => 
      item.attempts >= item.maxAttempts
    ).length;
    const pending = this.queue.length - failed;

    // Estimate time based on average sync time (assume 500ms per item)
    const estimatedTimeMs = pending * 500;

    return {
      total: this.queue.length + completed,
      completed,
      failed,
      pending,
      estimatedTimeMs
    };
  }

  /**
   * Get all queue items
   */
  getAll(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Get items by priority
   */
  getByPriority(priority: SyncPriority): QueueItem[] {
    return this.queue.filter(item => item.priority === priority);
  }

  /**
   * Get failed items
   */
  getFailed(): QueueItem[] {
    return this.queue.filter(item => item.attempts >= item.maxAttempts);
  }

  /**
   * Clear failed items
   */
  clearFailed(): void {
    this.queue = this.queue.filter(item => item.attempts < item.maxAttempts);
    this.saveToStorage();
    console.log('Cleared failed sync items');
  }

  /**
   * Clear entire queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    console.log('Cleared sync queue');
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Loaded ${this.queue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('Failed to load sync queue from storage:', error);
      this.queue = [];
    }
  }
}

export const syncQueue = new SyncQueue();
