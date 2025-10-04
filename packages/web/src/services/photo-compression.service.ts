/**
 * Photo compression service using browser-image-compression
 */
import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export class PhotoCompressionService {
  private defaultOptions: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: 0.7 // 70% quality for 50-70% file size reduction
  };

  /**
   * Compress a single image file
   */
  async compressImage(file: File, options?: CompressionOptions): Promise<File> {
    const compressionOptions = { ...this.defaultOptions, ...options };

    try {
      const compressedFile = await imageCompression(file, compressionOptions);
      
      const originalSizeKB = (file.size / 1024).toFixed(2);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
      
      console.log(
        `Compressed ${file.name}: ${originalSizeKB}KB → ${compressedSizeKB}KB (${reduction}% reduction)`
      );

      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      throw error;
    }
  }

  /**
   * Compress multiple images
   */
  async compressImages(files: File[], options?: CompressionOptions): Promise<File[]> {
    const compressionPromises = files.map(file => this.compressImage(file, options));
    return Promise.all(compressionPromises);
  }

  /**
   * Calculate estimated compression time
   */
  estimateCompressionTime(files: File[]): number {
    // Rough estimate: 100ms per MB
    const totalSizeMB = files.reduce((acc, file) => acc + file.size / (1024 * 1024), 0);
    return Math.ceil(totalSizeMB * 100);
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(originalFiles: File[], compressedFiles: File[]) {
    const originalSize = originalFiles.reduce((acc, file) => acc + file.size, 0);
    const compressedSize = compressedFiles.reduce((acc, file) => acc + file.size, 0);
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    return {
      originalSizeKB: (originalSize / 1024).toFixed(2),
      compressedSizeKB: (compressedSize / 1024).toFixed(2),
      reduction: `${reduction}%`,
      count: originalFiles.length
    };
  }
}

export const photoCompressionService = new PhotoCompressionService();
