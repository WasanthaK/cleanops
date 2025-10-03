/**
 * Photos module wires controller, service, and S3 utilities.
 */
import { Module } from '@nestjs/common';

import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';
import { S3Service } from './s3.service.js';

@Module({
  controllers: [PhotosController],
  providers: [PhotosService, S3Service]
})
export class PhotosModule {}
