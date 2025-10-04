/**
 * Quality module bundling controller and service.
 */
import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller.js';
import { QualityService } from './quality.service.js';

@Module({
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService]
})
export class QualityModule {}
