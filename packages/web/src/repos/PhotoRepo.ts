/**
 * PhotoRepo handles local capture and upload coordination.
 */
import { apiRepo } from './ApiRepo';
import { photoCompressionService } from '../services/photo-compression.service';

export interface PhotoUploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

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

  /**
   * Batch upload photos with compression and progress tracking
   */
  async batchUpload(
    jobId: string,
    files: File[],
    kind: string,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<{ successful: number; failed: number }> {
    const progress: PhotoUploadProgress = {
      total: files.length,
      completed: 0,
      failed: 0
    };

    // Compress all images first
    const compressedFiles = await photoCompressionService.compressImages(files);

    const uploadPromises = compressedFiles.map(async (file, index) => {
      try {
        progress.current = file.name;
        onProgress?.(progress);

        // Upload to S3
        const { uploadUrl, objectKey } = await apiRepo.requestPhotoUpload(file.type);
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        // Calculate hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        progress.completed++;
        onProgress?.(progress);

        return { kind, objectKey, hash, note: file.name };
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        progress.failed++;
        onProgress?.(progress);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const photos = results.filter(r => r !== null) as Array<{
      kind: string;
      objectKey: string;
      hash: string;
      note?: string;
    }>;

    // Batch attach to job
    if (photos.length > 0) {
      await apiRepo.batchAttachPhotos(jobId, { photos });
    }

    return {
      successful: progress.completed,
      failed: progress.failed
    };
  }

  /**
   * Compress image before upload
   */
  async compressImage(file: File): Promise<File> {
    return photoCompressionService.compressImage(file);
  }
}

export const photoRepo = new PhotoRepo();
