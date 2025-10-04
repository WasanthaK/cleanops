/**
 * Photos service generates signed URLs and records metadata for uploaded media.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PhotoKind } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from './s3.service.js';
import { ThumbnailService, ThumbnailSize } from './thumbnail.service.js';
import { 
  PhotoCreateDto, 
  PhotoUploadRequestDto, 
  BatchPhotoUploadDto,
  PhotoCategorizeDto,
  BatchDeleteDto 
} from './dto/photo.dto.js';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly prisma: PrismaService, 
    private readonly s3: S3Service,
    private readonly thumbnail: ThumbnailService
  ) {}

  requestUpload(dto: PhotoUploadRequestDto) {
    return this.s3.createUploadUrl(dto.contentType);
  }

  async attach(jobId: string, workerId: string, dto: PhotoCreateDto) {
    const photo = await this.prisma.proofPhoto.create({
      data: {
        jobId,
        workerId,
        kind: dto.kind as PhotoKind,
        objectKey: dto.objectKey,
        hash: dto.hash,
        note: dto.note ?? null
      }
    });

    // Generate thumbnails in background
    this.thumbnail.generateAllThumbnails(dto.objectKey).catch((error) => {
      this.logger.error(`Failed to generate thumbnails for ${dto.objectKey}:`, error);
    });

    return photo;
  }

  /**
   * Batch upload photos
   */
  async batchUpload(jobId: string, workerId: string, dto: BatchPhotoUploadDto) {
    const photos = await this.prisma.proofPhoto.createMany({
      data: dto.photos.map(photo => ({
        jobId,
        workerId,
        kind: photo.kind as PhotoKind,
        objectKey: photo.objectKey,
        hash: photo.hash,
        note: photo.note ?? null
      }))
    });

    // Generate thumbnails for all photos in background
    dto.photos.forEach(photo => {
      this.thumbnail.generateAllThumbnails(photo.objectKey).catch((error) => {
        this.logger.error(`Failed to generate thumbnails for ${photo.objectKey}:`, error);
      });
    });

    return { count: photos.count };
  }

  /**
   * Update photo category
   */
  async categorize(photoId: string, dto: PhotoCategorizeDto) {
    const photo = await this.prisma.proofPhoto.findUnique({
      where: { id: photoId }
    });

    if (!photo) {
      throw new NotFoundException(`Photo ${photoId} not found`);
    }

    return this.prisma.proofPhoto.update({
      where: { id: photoId },
      data: {
        kind: dto.kind as PhotoKind,
        note: dto.note ?? photo.note
      }
    });
  }

  /**
   * Get photos grouped by category for a job
   */
  async getGroupedPhotos(jobId: string) {
    const photos = await this.prisma.proofPhoto.findMany({
      where: { jobId },
      include: {
        worker: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const grouped = photos.reduce((acc: Record<string, typeof photos>, photo) => {
      if (!acc[photo.kind]) {
        acc[photo.kind] = [];
      }
      acc[photo.kind].push(photo);
      return acc;
    }, {} as Record<string, typeof photos>);

    return grouped;
  }

  /**
   * Get thumbnail URL for a photo
   */
  async getThumbnail(photoId: string, size: ThumbnailSize) {
    const photo = await this.prisma.proofPhoto.findUnique({
      where: { id: photoId }
    });

    if (!photo) {
      throw new NotFoundException(`Photo ${photoId} not found`);
    }

    return this.thumbnail.getThumbnailUrl(photo.objectKey, size);
  }

  /**
   * Batch delete photos
   */
  async batchDelete(dto: BatchDeleteDto) {
    const result = await this.prisma.proofPhoto.deleteMany({
      where: {
        id: { in: dto.photoIds }
      }
    });

    return { count: result.count };
  }
}
