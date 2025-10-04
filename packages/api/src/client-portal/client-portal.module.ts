/**
 * Client portal module bundling controller and service.
 */
import { Module } from '@nestjs/common';
import { ClientPortalController } from './client-portal.controller.js';
import { ClientPortalService } from './client-portal.service.js';

@Module({
  controllers: [ClientPortalController],
  providers: [ClientPortalService],
  exports: [ClientPortalService]
})
export class ClientPortalModule {}
