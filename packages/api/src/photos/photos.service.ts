/**
 * Photos service generates signed URLs and records metadata for uploaded media.
 */
import { Injectable } from '@nestjs/common';
import { PhotoKind } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { S3Service } from './s3.service.js';
import { PhotoCreateDto, PhotoUploadRequestDto } from './dto/photo.dto.js';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService, private readonly s3: S3Service) {}

  requestUpload(dto: PhotoUploadRequestDto) {
    return this.s3.createUploadUrl(dto.contentType);
  }

  async attach(jobId: string, workerId: string, dto: PhotoCreateDto) {
    return this.prisma.proofPhoto.create({
      data: {
        jobId,
        workerId,
        kind: dto.kind as PhotoKind,
        objectKey: dto.objectKey,
        hash: dto.hash,
        note: dto.note ?? null
      }
    });
  }
}
