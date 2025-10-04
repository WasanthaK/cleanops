/**
 * Conflict resolver for handling sync conflicts
 */

export interface ConflictData {
  id: string;
  type: string;
  localVersion: any;
  remoteVersion: any;
  localTimestamp: number;
  remoteTimestamp: number;
  field?: string;
}

export interface ConflictResolution {
  id: string;
  resolution: 'local' | 'remote' | 'manual';
  resolvedValue?: any;
  timestamp: number;
}

export type ConflictStrategy = 'last-write-wins' | 'manual' | 'remote-wins' | 'local-wins';

export class ConflictResolver {
  private conflictHistory: ConflictResolution[] = [];
  private criticalFields = ['attendances', 'signoff', 'payrollCalcs'];

  /**
   * Detect conflicts between local and remote data
   */
  detectConflict(localData: any, remoteData: any, type: string): ConflictData | null {
    if (!localData || !remoteData) {
      return null;
    }

    // Check if data has been modified locally and remotely
    const localTimestamp = localData.updatedAt || localData.createdAt || 0;
    const remoteTimestamp = remoteData.updatedAt || remoteData.createdAt || 0;

    if (localTimestamp === remoteTimestamp) {
      return null; // No conflict
    }

    // Detect specific field conflicts
    const conflictingFields = this.findConflictingFields(localData, remoteData);
    
    if (conflictingFields.length === 0) {
      return null; // No actual conflicts in data
    }

    return {
      id: localData.id || remoteData.id,
      type,
      localVersion: localData,
      remoteVersion: remoteData,
      localTimestamp: new Date(localTimestamp).getTime(),
      remoteTimestamp: new Date(remoteTimestamp).getTime(),
      field: conflictingFields[0] // Primary conflicting field
    };
  }

  /**
   * Find fields that have conflicts
   */
  private findConflictingFields(local: any, remote: any): string[] {
    const conflicts: string[] = [];

    for (const key of Object.keys(local)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
        continue;
      }

      if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
        conflicts.push(key);
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflict using specified strategy
   */
  resolveConflict(conflict: ConflictData, strategy: ConflictStrategy = 'last-write-wins'): ConflictResolution {
    let resolution: 'local' | 'remote' | 'manual' = 'local';
    let resolvedValue = conflict.localVersion;

    switch (strategy) {
      case 'last-write-wins':
        // Use the most recent version
        if (conflict.remoteTimestamp > conflict.localTimestamp) {
          resolution = 'remote';
          resolvedValue = conflict.remoteVersion;
        }
        break;

      case 'remote-wins':
        resolution = 'remote';
        resolvedValue = conflict.remoteVersion;
        break;

      case 'local-wins':
        resolution = 'local';
        resolvedValue = conflict.localVersion;
        break;

      case 'manual':
        resolution = 'manual';
        // Manual resolution requires user intervention
        break;
    }

    const resolutionRecord: ConflictResolution = {
      id: conflict.id,
      resolution,
      resolvedValue,
      timestamp: Date.now()
    };

    this.conflictHistory.push(resolutionRecord);
    
    console.log(`Resolved conflict for ${conflict.type} ${conflict.id}: ${resolution}`);
    
    return resolutionRecord;
  }

  /**
   * Check if a field is critical and requires manual resolution
   */
  isCriticalField(field: string): boolean {
    return this.criticalFields.includes(field);
  }

  /**
   * Get conflict resolution strategy for a type
   */
  getStrategyForType(type: string, field?: string): ConflictStrategy {
    // Critical fields require manual resolution
    if (field && this.isCriticalField(field)) {
      return 'manual';
    }

    // Default strategy for different types
    switch (type) {
      case 'attendance':
      case 'signoff':
      case 'payroll':
        return 'manual'; // Critical data requires manual review
      
      case 'task':
      case 'photo':
      case 'incident':
        return 'last-write-wins'; // Less critical, use timestamp
      
      default:
        return 'last-write-wins';
    }
  }

  /**
   * Get conflict history
   */
  getConflictHistory(): ConflictResolution[] {
    return [...this.conflictHistory];
  }

  /**
   * Clear conflict history
   */
  clearHistory(): void {
    this.conflictHistory = [];
  }

  /**
   * Get conflicts that need manual resolution
   */
  getPendingManualConflicts(): ConflictResolution[] {
    return this.conflictHistory.filter(c => c.resolution === 'manual');
  }

  /**
   * Resolve conflict manually with user input
   */
  resolveManually(conflictId: string, resolvedValue: any): ConflictResolution {
    const index = this.conflictHistory.findIndex(c => c.id === conflictId && c.resolution === 'manual');
    
    if (index === -1) {
      throw new Error(`No pending manual conflict found for ${conflictId}`);
    }

    const resolution: ConflictResolution = {
      id: conflictId,
      resolution: 'manual',
      resolvedValue,
      timestamp: Date.now()
    };

    this.conflictHistory[index] = resolution;
    
    console.log(`Manually resolved conflict for ${conflictId}`);
    
    return resolution;
  }
}

export const conflictResolver = new ConflictResolver();
