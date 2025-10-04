/**
 * Root application module that wires domain modules, configuration, and infrastructure.
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import configuration from '../config/configuration.js';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { AttendanceModule } from '../attendance/attendance.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { PhotosModule } from '../photos/photos.module.js';
import { SignoffModule } from '../signoff/signoff.module.js';
import { IncidentsModule } from '../incidents/incidents.module.js';
import { PayrollModule } from '../payroll/payroll.module.js';
import { SyncModule } from '../sync/sync.module.js';
import { XeroModule } from '../integrations/xero/xero.module.js';
import { EviaSignModule } from '../integrations/evia-sign/evia-sign.module.js';
import { TemplatesModule } from '../templates/templates.module.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { QualityModule } from '../quality/quality.module.js';
import { ClientPortalModule } from '../client-portal/client-portal.module.js';
import { JwtAppGuard } from '../common/guards/jwt-app.guard.js';
import { IdempotencyLoggerMiddleware } from '../common/middleware/idempotency-logger.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    PrismaModule,
    AuthModule,
    JobsModule,
    AttendanceModule,
    TasksModule,
    PhotosModule,
    SignoffModule,
    IncidentsModule,
    PayrollModule,
    SyncModule,
    XeroModule,
    EviaSignModule,
    TemplatesModule,
    AnalyticsModule,
    QualityModule,
    ClientPortalModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAppGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdempotencyLoggerMiddleware).forRoutes('*');
  }
}
