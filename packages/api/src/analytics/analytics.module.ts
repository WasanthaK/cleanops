/**
 * Analytics module bundling controller, service, and WebSocket gateway.
 */
import { Module } from '@nestjs/common';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsGateway } from './analytics.gateway.js';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsGateway],
  exports: [AnalyticsService, AnalyticsGateway]
})
export class AnalyticsModule {}
