/**
 * Network monitor for tracking connection status and quality
 */

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
}

export type NetworkChangeCallback = (status: NetworkStatus) => void;

export class NetworkMonitor {
  private listeners: NetworkChangeCallback[] = [];
  private currentStatus: NetworkStatus;

  constructor() {
    this.currentStatus = this.getNetworkStatus();
    this.setupListeners();
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Check if connection is fast enough for sync
   */
  isFastConnection(): boolean {
    const connection = this.getConnection();
    
    if (!connection) {
      return true; // Assume fast if we can't determine
    }

    // Consider slow if 2g or slow-2g
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return false;
    }

    return true;
  }

  /**
   * Check if save data mode is enabled
   */
  isSaveDataEnabled(): boolean {
    const connection = this.getConnection();
    return connection?.saveData || false;
  }

  /**
   * Add listener for network changes
   */
  addListener(callback: NetworkChangeCallback): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: NetworkChangeCallback): void {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    window.addEventListener('online', () => this.handleStatusChange());
    window.addEventListener('offline', () => this.handleStatusChange());

    // Listen to connection changes if available
    const connection = this.getConnection();
    if (connection) {
      connection.addEventListener('change', () => this.handleStatusChange());
    }
  }

  /**
   * Handle network status change
   */
  private handleStatusChange(): void {
    const newStatus = this.getNetworkStatus();
    
    // Check if status actually changed
    if (JSON.stringify(newStatus) === JSON.stringify(this.currentStatus)) {
      return;
    }

    console.log('Network status changed:', newStatus);
    this.currentStatus = newStatus;

    // Notify listeners
    this.listeners.forEach(callback => {
      try {
        callback(newStatus);
      } catch (error) {
        console.error('Error in network change listener:', error);
      }
    });
  }

  /**
   * Get network status
   */
  private getNetworkStatus(): NetworkStatus {
    const status: NetworkStatus = {
      online: navigator.onLine
    };

    const connection = this.getConnection();
    if (connection) {
      status.effectiveType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
      status.saveData = connection.saveData;
    }

    return status;
  }

  /**
   * Get network connection info
   */
  private getConnection(): any {
    return (navigator as any).connection || 
           (navigator as any).mozConnection || 
           (navigator as any).webkitConnection;
  }

  /**
   * Get estimated sync speed (items per second)
   */
  getEstimatedSyncSpeed(): number {
    if (!this.isOnline()) {
      return 0;
    }

    const connection = this.getConnection();
    if (!connection) {
      return 10; // Default: 10 items per second
    }

    // Estimate based on connection type
    switch (connection.effectiveType) {
      case '4g':
        return 20; // Fast
      case '3g':
        return 10; // Medium
      case '2g':
        return 3; // Slow
      case 'slow-2g':
        return 1; // Very slow
      default:
        return 10;
    }
  }

  /**
   * Get connection quality description
   */
  getConnectionQuality(): string {
    if (!this.isOnline()) {
      return 'Offline';
    }

    const connection = this.getConnection();
    if (!connection) {
      return 'Unknown';
    }

    switch (connection.effectiveType) {
      case '4g':
        return 'Excellent';
      case '3g':
        return 'Good';
      case '2g':
        return 'Poor';
      case 'slow-2g':
        return 'Very Poor';
      default:
        return 'Unknown';
    }
  }

  /**
   * Wait for online status
   */
  async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        cleanup();
        resolve(true);
      };

      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener('online', onlineHandler);
      };

      window.addEventListener('online', onlineHandler);
    });
  }

  /**
   * Estimate time to sync based on queue size
   */
  estimateSyncTime(queueSize: number): number {
    const itemsPerSecond = this.getEstimatedSyncSpeed();
    return Math.ceil((queueSize / itemsPerSecond) * 1000); // Return in milliseconds
  }
}

export const networkMonitor = new NetworkMonitor();
