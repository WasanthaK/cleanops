/**
 * Prisma module provides a singleton PrismaService instance with shutdown hooks.
 */
import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
