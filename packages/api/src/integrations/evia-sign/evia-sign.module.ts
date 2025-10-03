/**
 * Evia Sign integration module bundling controller and service.
 */
import { Module } from '@nestjs/common';

import { EviaSignController } from './evia-sign.controller.js';
import { EviaSignService } from './evia-sign.service.js';

@Module({
  controllers: [EviaSignController],
  providers: [EviaSignService],
  exports: [EviaSignService]
})
export class EviaSignModule {}
