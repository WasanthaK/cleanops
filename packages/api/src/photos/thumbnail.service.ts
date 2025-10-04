/**
 * Thumbnail service for generating and caching image thumbnails
 */
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { S3Service } from './s3.service.js';

export enum ThumbnailSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

const THUMBNAIL_SIZES = {
  [ThumbnailSize.SMALL]: 150,
  [ThumbnailSize.MEDIUM]: 300,
  [ThumbnailSize.LARGE]: 600
};

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  constructor(private readonly s3: S3Service) {}

  /**
   * Generate thumbnail for an image
   * @param objectKey Original image S3 key
   * @param size Thumbnail size
   * @returns Thumbnail S3 key
   */
  async generateThumbnail(objectKey: string, size: ThumbnailSize): Promise<string> {
    try {
      const thumbnailKey = this.getThumbnailKey(objectKey, size);

      // Check if thumbnail already exists
      const exists = await this.s3.objectExists(thumbnailKey);
      if (exists) {
        this.logger.log(`Thumbnail already exists: ${thumbnailKey}`);
        return thumbnailKey;
      }

      // Download original image
      const originalBuffer = await this.s3.getObject(objectKey);
      
      // Generate thumbnail
      const width = THUMBNAIL_SIZES[size];
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(width, width, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      // Upload thumbnail
      await this.s3.putObject(thumbnailKey, thumbnailBuffer, 'image/jpeg');
      
      this.logger.log(`Generated thumbnail: ${thumbnailKey} (${size}, ${width}px)`);
      return thumbnailKey;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail for ${objectKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate all thumbnail sizes for an image
   */
  async generateAllThumbnails(objectKey: string): Promise<Record<ThumbnailSize, string>> {
    const results = await Promise.all([
      this.generateThumbnail(objectKey, ThumbnailSize.SMALL),
      this.generateThumbnail(objectKey, ThumbnailSize.MEDIUM),
      this.generateThumbnail(objectKey, ThumbnailSize.LARGE)
    ]);

    return {
      [ThumbnailSize.SMALL]: results[0],
      [ThumbnailSize.MEDIUM]: results[1],
      [ThumbnailSize.LARGE]: results[2]
    };
  }

  /**
   * Get thumbnail download URL
   */
  async getThumbnailUrl(objectKey: string, size: ThumbnailSize): Promise<string> {
    const thumbnailKey = this.getThumbnailKey(objectKey, size);
    
    // Try to generate if doesn't exist
    try {
      await this.generateThumbnail(objectKey, size);
    } catch (error) {
      this.logger.warn(`Could not generate thumbnail, returning original: ${error}`);
      return this.s3.createDownloadUrl(objectKey);
    }

    return this.s3.createDownloadUrl(thumbnailKey);
  }

  /**
   * Get thumbnail key from original key
   */
  private getThumbnailKey(objectKey: string, size: ThumbnailSize): string {
    const parts = objectKey.split('/');
    const fileName = parts[parts.length - 1];
    const nameWithoutExt = fileName.split('.')[0];
    
    return `thumbnails/${size}/${nameWithoutExt}.jpg`;
  }
}
