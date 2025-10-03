/**
 * Signoff module bundling controller and service.
 */
import { Module } from '@nestjs/common';

import { SignoffController } from './signoff.controller.js';
import { SignoffService } from './signoff.service.js';

@Module({
  controllers: [SignoffController],
  providers: [SignoffService]
})
export class SignoffModule {}
