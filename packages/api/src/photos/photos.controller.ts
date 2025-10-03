/**
 * Photos controller handles creation of signed URLs and association with jobs.
 */
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { PhotosService } from './photos.service.js';
import { PhotoCreateDto, PhotoUploadRequestDto } from './dto/photo.dto.js';

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
}
