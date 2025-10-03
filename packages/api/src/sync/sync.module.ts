/**
 * Sync module bundling controller and service.
 */
import { Module } from '@nestjs/common';

import { SyncController } from './sync.controller.js';
import { SyncService } from './sync.service.js';

@Module({
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
