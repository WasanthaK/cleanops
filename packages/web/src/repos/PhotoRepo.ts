/**
 * PhotoRepo handles local capture and upload coordination.
 */
import { apiRepo } from './ApiRepo';

export class PhotoRepo {
  async captureFromFile(input: File): Promise<Blob> {
    return input.slice();
  }

  async upload(jobId: string, file: File, kind: string, note?: string) {
    const { uploadUrl, objectKey } = await apiRepo.requestPhotoUpload(file.type);
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    await apiRepo.attachPhoto(jobId, { kind, objectKey, hash, note });
    return objectKey;
  }
}

export const photoRepo = new PhotoRepo();
