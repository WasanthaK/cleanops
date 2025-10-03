/**
 * Shared TypeScript interfaces mirroring API responses.
 */
export interface Site {
  id: string;
  name: string;
  address: string;
  timezone: string;
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string | null;
  completed: boolean;
}

export interface Job {
  id: string;
  title: string;
  scheduledDate: string;
  site: Site;
  tasks: TaskItem[];
}

export interface AttendanceEvent {
  id: string;
  type: string;
  occurredAt: string;
}

export interface Photo {
  id: string;
  kind: string;
  objectKey: string;
}

export interface Signoff {
  clientName: string;
  clientRole: string;
  signedAt: string;
  signatureKey: string;
}

export interface Incident {
  id: string;
  occurredAt: string;
  description: string;
  actionTaken?: string | null;
}

export interface PayrollLine {
  day: string;
  hours: number;
  ordinaryHours: number;
  overtimeHours: number;
  total: number;
}

export interface PayrollDraftResponse {
  workerId: string;
  jobId: string;
  totalHours: number;
  totalPay: number;
  lines: PayrollLine[];
}

export interface SyncEvent {
  id: string;
  type: string;
  occurredAt: string;
  payload: string;
}
