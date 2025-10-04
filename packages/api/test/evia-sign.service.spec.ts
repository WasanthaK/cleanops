/**
 * Tests for Evia Sign integration service
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { EviaSignService } from '../src/integrations/evia-sign/evia-sign.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('EviaSignService', () => {
  let service: EviaSignService;
  let prisma: PrismaService;

  const mockPrismaService = {
    eviaSignDocument: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    job: {
      findUnique: jest.fn()
    }
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        'EVIA_SIGN_API_KEY': 'test-api-key',
        'EVIA_SIGN_API_URL': 'https://api.eviasign.com/v1',
        'EVIA_SIGN_WEBHOOK_SECRET': 'test-webhook-secret'
      };
      return config[key] || defaultValue || '';
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EviaSignService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService }
      ]
    }).compile();

    service = module.get<EviaSignService>(EviaSignService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendDocument', () => {
    it('should send document for signing', async () => {
      const dto = {
        jobId: 'job-1',
        recipientEmail: 'client@example.com',
        recipientName: 'Test Client',
        documentType: 'completion_report'
      };

      const mockJob = {
        id: 'job-1',
        title: 'Test Job',
        site: { id: 'site-1', name: 'Test Site', address: '123 Test St' },
        tasks: [
          { id: 'task-1', title: 'Task 1', completed: true }
        ],
        signoff: null,
        photos: []
      };

      const mockDocument = {
        id: 'doc-1',
        jobId: dto.jobId,
        eviaDocId: 'evia_12345',
        status: 'SENT',
        documentType: dto.documentType,
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
        sentAt: new Date(),
        pdfUrl: 'https://example.com/docs/evia_12345.pdf'
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.eviaSignDocument.create.mockResolvedValue(mockDocument);

      const result = await service.sendDocument(dto);

      expect(result.success).toBe(true);
      expect(result.recipientEmail).toBe(dto.recipientEmail);
      expect(mockPrismaService.eviaSignDocument.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      const dto = {
        jobId: 'invalid-job',
        recipientEmail: 'client@example.com',
        recipientName: 'Test Client'
      };

      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(service.sendDocument(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDocumentStatus', () => {
    it('should return document status', async () => {
      const mockDocument = {
        id: 'doc-1',
        eviaDocId: 'evia_12345',
        status: 'SIGNED',
        documentType: 'completion_report',
        recipientEmail: 'client@example.com',
        recipientName: 'Test Client',
        sentAt: new Date(),
        viewedAt: new Date(),
        signedAt: new Date(),
        signedPdfUrl: 'https://example.com/signed.pdf',
        job: {
          id: 'job-1',
          title: 'Test Job',
          site: { id: 'site-1', name: 'Test Site' }
        }
      };

      mockPrismaService.eviaSignDocument.findUnique.mockResolvedValue(mockDocument);

      const result = await service.getDocumentStatus('doc-1');

      expect(result.status).toBe('SIGNED');
      expect(result.signedPdfUrl).toBeDefined();
    });

    it('should throw NotFoundException when document not found', async () => {
      mockPrismaService.eviaSignDocument.findUnique.mockResolvedValue(null);

      await expect(service.getDocumentStatus('invalid-doc')).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook event', async () => {
      const webhookDto = {
        documentId: 'evia_12345',
        status: 'SIGNED',
        signedAt: new Date().toISOString(),
        signedPdfUrl: 'https://example.com/signed.pdf',
        metadata: {}
      };

      const mockDocument = {
        id: 'doc-1',
        eviaDocId: 'evia_12345',
        status: 'SENT',
        webhookEvents: []
      };

      const updatedDocument = {
        ...mockDocument,
        status: 'SIGNED',
        signedAt: new Date()
      };

      mockPrismaService.eviaSignDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.eviaSignDocument.update.mockResolvedValue(updatedDocument);

      // Note: In real test, we'd need to generate proper signature
      const result = await service.handleWebhook(webhookDto, 'mock-signature');

      expect(result.success).toBe(true);
      expect(mockPrismaService.eviaSignDocument.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when document not found', async () => {
      const webhookDto = {
        documentId: 'invalid-doc',
        status: 'SIGNED'
      };

      mockPrismaService.eviaSignDocument.findUnique.mockResolvedValue(null);

      await expect(service.handleWebhook(webhookDto, 'signature')).rejects.toThrow(NotFoundException);
    });
  });
});
