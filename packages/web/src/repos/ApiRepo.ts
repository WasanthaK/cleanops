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

  async batchAttachPhotos(jobId: string, body: unknown) {
    await this.client.post(`/jobs/${jobId}/photos/batch`, body);
  }

  async categorizePhoto(photoId: string, body: unknown) {
    await this.client.put(`/photos/${photoId}/categorize`, body);
  }

  async getGroupedPhotos(jobId: string) {
    const { data } = await this.client.get(`/jobs/${jobId}/photos/grouped`);
    return data;
  }

  async getThumbnail(photoId: string, size: string) {
    const { data } = await this.client.get(`/photos/${photoId}/thumbnail/${size}`);
    return data;
  }

  async batchDeletePhotos(photoIds: string[]) {
    await this.client.delete('/photos/batch', { data: { photoIds } });
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

  // Voice endpoints
  async requestAudioUpload(contentType: string) {
    const { data } = await this.client.post('/voice/upload-request', { contentType });
    return data as { uploadUrl: string; objectKey: string; publicUrl: string };
  }

  async createVoiceNote(body: unknown) {
    const { data } = await this.client.post('/voice/notes', body);
    return data;
  }

  async getVoiceNote(id: string) {
    const { data } = await this.client.get(`/voice/notes/${id}`);
    return data;
  }

  async getVoiceAudio(id: string) {
    const { data } = await this.client.get(`/voice/notes/${id}/audio`);
    return data;
  }

  async getVoiceTranscript(id: string) {
    const { data } = await this.client.get(`/voice/notes/${id}/transcript`);
    return data;
  }

  async updateVoiceTranscript(id: string, transcript: string) {
    await this.client.put(`/voice/notes/${id}/transcript`, { transcript });
  }

  async processVoiceCommand(command: string, jobId?: string) {
    const { data } = await this.client.post('/voice/command', { command, jobId });
    return data;
  }

  async listJobVoiceNotes(jobId: string) {
    const { data } = await this.client.get(`/voice/jobs/${jobId}/notes`);
    return data;
  }

  async deleteVoiceNote(id: string) {
    await this.client.delete(`/voice/notes/${id}`);
  }
}

export const apiRepo = new ApiRepo();
