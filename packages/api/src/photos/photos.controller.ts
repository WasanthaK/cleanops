/**
 * Photos controller handles creation of signed URLs and association with jobs.
 */
import { Body, Controller, Param, Post, Put, Get, Delete, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { PhotosService } from './photos.service.js';
import { ThumbnailSize } from './thumbnail.service.js';
import { 
  PhotoCreateDto, 
  PhotoUploadRequestDto,
  BatchPhotoUploadDto,
  PhotoCategorizeDto,
  BatchDeleteDto 
} from './dto/photo.dto.js';

@ApiBearerAuth()
@ApiTags('photos')
@Controller()
export class PhotosController {
  constructor(private readonly service: PhotosService) {}

  @Post('photos/signed-upload')
  signedUpload(@Body() dto: PhotoUploadRequestDto) {
    return this.service.requestUpload(dto);
  }

  @Post('jobs/:jobId/photos')
  attach(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: PhotoCreateDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.attach(jobId, workerId, dto);
  }

  @Post('jobs/:jobId/photos/batch')
  batchUpload(@Param('jobId') jobId: string, @Req() req: Request, @Body() dto: BatchPhotoUploadDto) {
    const workerId = (req.user as { sub: string }).sub;
    return this.service.batchUpload(jobId, workerId, dto);
  }

  @Put('photos/:id/categorize')
  categorize(@Param('id') id: string, @Body() dto: PhotoCategorizeDto) {
    return this.service.categorize(id, dto);
  }

  @Get('jobs/:jobId/photos/grouped')
  getGrouped(@Param('jobId') jobId: string) {
    return this.service.getGroupedPhotos(jobId);
  }

  @Get('photos/:id/thumbnail/:size')
  async getThumbnail(@Param('id') id: string, @Param('size') size: string) {
    const thumbnailUrl = await this.service.getThumbnail(id, size as ThumbnailSize);
    return { url: thumbnailUrl };
  }

  @Delete('photos/batch')
  batchDelete(@Body() dto: BatchDeleteDto) {
    return this.service.batchDelete(dto);
  }
}
