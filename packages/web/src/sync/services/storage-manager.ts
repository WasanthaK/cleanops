/**
 * Storage manager for IndexedDB quota and cleanup
 */

export interface StorageInfo {
  usage: number;
  quota: number;
  usagePercent: number;
  available: number;
}

export interface StorageCleanupResult {
  itemsRemoved: number;
  bytesFreed: number;
}

export class StorageManager {
  private readonly DB_NAME = 'cleanops-queue';
  private readonly OLD_DATA_THRESHOLD_DAYS = 30;

  /**
   * Request persistent storage quota
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!navigator.storage || !navigator.storage.persist) {
      console.warn('Persistent storage not supported');
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persist();
      
      if (isPersisted) {
        console.log('Persistent storage granted');
      } else {
        console.warn('Persistent storage request denied');
      }

      return isPersisted;
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }

  /**
   * Check if storage is persisted
   */
  async isPersisted(): Promise<boolean> {
    if (!navigator.storage || !navigator.storage.persisted) {
      return false;
    }

    try {
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('Failed to check if storage is persisted:', error);
      return false;
    }
  }

  /**
   * Get storage estimate
   */
  async getStorageInfo(): Promise<StorageInfo> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return {
        usage: 0,
        quota: 0,
        usagePercent: 0,
        available: 0
      };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
      const available = quota - usage;

      console.log(`Storage: ${this.formatBytes(usage)} / ${this.formatBytes(quota)} (${usagePercent.toFixed(1)}%)`);

      return {
        usage,
        quota,
        usagePercent,
        available
      };
    } catch (error) {
      console.error('Failed to get storage estimate:', error);
      return {
        usage: 0,
        quota: 0,
        usagePercent: 0,
        available: 0
      };
    }
  }

  /**
   * Check if storage is running low
   */
  async isStorageLow(): Promise<boolean> {
    const info = await this.getStorageInfo();
    return info.usagePercent > 80; // Consider low if over 80%
  }

  /**
   * Clean up old data from IndexedDB
   */
  async cleanupOldData(): Promise<StorageCleanupResult> {
    const threshold = Date.now() - (this.OLD_DATA_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    let itemsRemoved = 0;
    let bytesFreed = 0;

    try {
      const db = await this.openDatabase();
      const tx = db.transaction('cleanops-api-queue', 'readwrite');
      const store = tx.objectStore('cleanops-api-queue');
      
      const items = await this.getAllItems(store);
      
      for (const item of items) {
        if (item.timestamp && item.timestamp < threshold) {
          const itemSize = this.estimateItemSize(item);
          await this.deleteItem(store, item.id);
          itemsRemoved++;
          bytesFreed += itemSize;
        }
      }

      console.log(`Cleaned up ${itemsRemoved} old items, freed ${this.formatBytes(bytesFreed)}`);

      return { itemsRemoved, bytesFreed };
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      return { itemsRemoved: 0, bytesFreed: 0 };
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear IndexedDB
      const db = await this.openDatabase();
      const tx = db.transaction('cleanops-api-queue', 'readwrite');
      const store = tx.objectStore('cleanops-api-queue');
      await store.clear();

      // Clear localStorage
      localStorage.clear();

      // Clear cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      console.log('Cleared all cached data');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size breakdown
   */
  async getCacheSizeBreakdown(): Promise<Record<string, number>> {
    const breakdown: Record<string, number> = {};

    try {
      // IndexedDB size
      const db = await this.openDatabase();
      const tx = db.transaction('cleanops-api-queue', 'readonly');
      const store = tx.objectStore('cleanops-api-queue');
      const items = await this.getAllItems(store);
      breakdown['indexedDB'] = items.reduce((sum, item) => sum + this.estimateItemSize(item), 0);

      // localStorage size
      let localStorageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          localStorageSize += (key.length + (value?.length || 0)) * 2; // UTF-16
        }
      }
      breakdown['localStorage'] = localStorageSize;

      // Cache storage size
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let cacheSize = 0;
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              cacheSize += blob.size;
            }
          }
        }
        breakdown['cacheStorage'] = cacheSize;
      }

      console.log('Cache breakdown:', Object.entries(breakdown).map(([k, v]) => 
        `${k}: ${this.formatBytes(v)}`
      ).join(', '));

      return breakdown;
    } catch (error) {
      console.error('Failed to get cache size breakdown:', error);
      return breakdown;
    }
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cleanops-api-queue')) {
          db.createObjectStore('cleanops-api-queue', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from store
   */
  private getAllItems(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete item from store
   */
  private deleteItem(store: IDBObjectStore, id: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Estimate size of an item
   */
  private estimateItemSize(item: any): number {
    return JSON.stringify(item).length * 2; // UTF-16
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const storageManager = new StorageManager();
