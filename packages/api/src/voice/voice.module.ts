/**
 * Voice module for voice recording and transcription
 */
import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller.js';
import { VoiceService } from './voice.service.js';
import { S3Service } from '../photos/s3.service.js';

@Module({
  controllers: [VoiceController],
  providers: [VoiceService, S3Service],
  exports: [VoiceService]
})
export class VoiceModule {}
