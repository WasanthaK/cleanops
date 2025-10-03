/**
 * ApiRepo wraps REST interactions with the backend.
 */
import axios from 'axios';

import { API_BASE_URL } from '../config';
import { Job, PayrollDraftResponse, SyncEvent } from '../models';

export class ApiRepo {
  private client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common.Authorization;
    }
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data as { accessToken: string; refreshToken: string };
  }

  async listJobs(): Promise<Job[]> {
    const { data } = await this.client.get('/jobs');
    return data;
  }

  async getJob(jobId: string): Promise<Job> {
    const { data } = await this.client.get(`/jobs/${jobId}`);
    return data;
  }

  async attendance(jobId: string, action: string, payload: Record<string, unknown>) {
    await this.client.post(`/attendance/${jobId}/${action}`, payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    });
  }

  async saveTasks(jobId: string, tasks: unknown) {
    await this.client.post(`/jobs/${jobId}/tasks/bulk`, { tasks });
  }

  async requestPhotoUpload(contentType: string) {
    const { data } = await this.client.post('/photos/signed-upload', { contentType });
    return data as { uploadUrl: string; objectKey: string; publicUrl: string };
  }

  async attachPhoto(jobId: string, body: unknown) {
    await this.client.post(`/jobs/${jobId}/photos`, body);
  }

  async signoff(jobId: string, body: unknown) {
    await this.client.post(`/jobs/${jobId}/signoff`, body);
  }

  async reportIncident(jobId: string, body: unknown) {
    await this.client.post(`/jobs/${jobId}/incidents`, body);
  }

  async payrollDraft(jobId: string, body: unknown): Promise<PayrollDraftResponse> {
    const { data } = await this.client.post(`/jobs/${jobId}/payroll/draft`, body);
    return data;
  }

  async syncBatch(events: unknown) {
    const { data } = await this.client.post('/sync/batch', { events });
    return data;
  }

  async syncSince(cursor?: string): Promise<SyncEvent[]> {
    const { data } = await this.client.get('/sync/since', { params: { cursor } });
    return data;
  }
}

export const apiRepo = new ApiRepo();
