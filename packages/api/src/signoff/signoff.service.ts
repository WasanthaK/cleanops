/**
 * Signoff service stores client acknowledgement metadata.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SignoffDto } from './dto/signoff.dto.js';

@Injectable()
export class SignoffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(jobId: string, workerId: string, dto: SignoffDto) {
    return this.prisma.signoff.upsert({
      where: { jobId },
      update: {
        workerId,
        clientName: dto.clientName,
        clientRole: dto.clientRole,
        signedAt: new Date(dto.signedAt),
        signatureKey: dto.signatureKey
      },
      create: {
        jobId,
        workerId,
        clientName: dto.clientName,
        clientRole: dto.clientRole,
        signedAt: new Date(dto.signedAt),
        signatureKey: dto.signatureKey
      }
    });
  }
}
