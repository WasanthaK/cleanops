/**
 * Tests for Xero integration service
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { XeroService } from '../src/integrations/xero/xero.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('XeroService', () => {
  let service: XeroService;
  let prisma: PrismaService;

  const mockPrismaService = {
    xeroIntegration: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn()
    },
    xeroSyncLog: {
      create: jest.fn()
    },
    payrollCalc: {
      findMany: jest.fn()
    }
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        'XERO_CLIENT_ID': 'test-client-id',
        'XERO_CLIENT_SECRET': 'test-client-secret',
        'XERO_REDIRECT_URI': 'http://localhost:3000/integrations/xero/callback',
        'ENCRYPTION_KEY': 'test-encryption-key-32-chars!'
      };
      return config[key] || defaultValue || '';
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XeroService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService }
      ]
    }).compile();

    service = module.get<XeroService>(XeroService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConsentUrl', () => {
    it('should generate Xero consent URL', () => {
      const url = service.getConsentUrl();
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });
  });

  describe('disconnect', () => {
    it('should disconnect Xero integration', async () => {
      const tenantId = 'test-tenant-id';

      mockPrismaService.xeroIntegration.update.mockResolvedValue({
        id: 'integration-id',
        tenantId,
        syncStatus: 'DISCONNECTED'
      });

      const result = await service.disconnect(tenantId);

      expect(result).toEqual({
        success: true,
        message: 'Xero integration disconnected'
      });
      expect(mockPrismaService.xeroIntegration.update).toHaveBeenCalledWith({
        where: { tenantId },
        data: {
          syncStatus: 'DISCONNECTED',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle disconnect errors', async () => {
      const tenantId = 'test-tenant-id';
      mockPrismaService.xeroIntegration.update.mockRejectedValue(new Error('Database error'));

      await expect(service.disconnect(tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatus', () => {
    it('should return integration status', async () => {
      const tenantId = 'test-tenant-id';
      const mockIntegration = {
        id: 'integration-id',
        tenantId,
        syncStatus: 'CONNECTED',
        lastSyncAt: new Date(),
        syncLogs: []
      };

      mockPrismaService.xeroIntegration.findUnique.mockResolvedValue(mockIntegration);

      const result = await service.getStatus(tenantId);

      expect(result).toEqual({
        tenantId: mockIntegration.tenantId,
        syncStatus: mockIntegration.syncStatus,
        lastSyncAt: mockIntegration.lastSyncAt,
        recentSyncs: mockIntegration.syncLogs
      });
    });

    it('should throw NotFoundException when integration not found', async () => {
      mockPrismaService.xeroIntegration.findUnique.mockResolvedValue(null);

      await expect(service.getStatus('invalid-tenant')).rejects.toThrow(NotFoundException);
    });
  });
});
