/**
 * Xero integration module bundling controller and service.
 */
import { Module } from '@nestjs/common';

import { XeroController } from './xero.controller.js';
import { XeroService } from './xero.service.js';

@Module({
  controllers: [XeroController],
  providers: [XeroService],
  exports: [XeroService]
})
export class XeroModule {}
