/**
 * Evia Sign integration service for digital document signing.
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, rgb } from 'pdf-lib';
import * as Handlebars from 'handlebars';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service.js';
import { SendDocumentDto } from './dto/send-document.dto.js';
import { WebhookEventDto } from './dto/webhook-event.dto.js';

@Injectable()
export class EviaSignService {
  private readonly logger = new Logger(EviaSignService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>('EVIA_SIGN_API_KEY', '');
    this.apiUrl = this.configService.get<string>('EVIA_SIGN_API_URL', 'https://api.eviasign.com/v1');
    this.webhookSecret = this.configService.get<string>('EVIA_SIGN_WEBHOOK_SECRET', '');
  }

  /**
   * Send a document for signing
   */
  async sendDocument(dto: SendDocumentDto) {
    try {
      this.logger.log(`Sending document for signing: Job ${dto.jobId}`);

      // Get job details
      const job = await this.prisma.job.findUnique({
        where: { id: dto.jobId },
        include: {
          site: true,
          tasks: true,
          signoff: true,
          photos: true
        }
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Generate PDF document
      const pdfBytes = await this.generateCompletionReport(job);

      // In a real implementation, this would call the Evia Sign API
      // For now, we'll create a mock document record
      const mockDocId = `evia_${crypto.randomBytes(8).toString('hex')}`;

      // Store document record
      const document = await this.prisma.eviaSignDocument.create({
        data: {
          jobId: dto.jobId,
          eviaDocId: mockDocId,
          status: 'SENT',
          documentType: dto.documentType || 'completion_report',
          recipientEmail: dto.recipientEmail,
          recipientName: dto.recipientName,
          sentAt: new Date(),
          pdfUrl: `https://example.com/docs/${mockDocId}.pdf` // Mock URL
        }
      });

      this.logger.log(`Document sent successfully: ${mockDocId}`);

      return {
        success: true,
        documentId: document.id,
        eviaDocId: mockDocId,
        status: 'SENT',
        recipientEmail: dto.recipientEmail
      };
    } catch (error: any) {
      this.logger.error(`Failed to send document: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to send document for signing');
    }
  }

  /**
   * Get document status
   */
  async getDocumentStatus(documentId: string) {
    const document = await this.prisma.eviaSignDocument.findUnique({
      where: { id: documentId },
      include: {
        job: {
          include: {
            site: true
          }
        }
      }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      documentId: document.id,
      eviaDocId: document.eviaDocId,
      status: document.status,
      documentType: document.documentType,
      recipientEmail: document.recipientEmail,
      recipientName: document.recipientName,
      sentAt: document.sentAt,
      viewedAt: document.viewedAt,
      signedAt: document.signedAt,
      signedPdfUrl: document.signedPdfUrl,
      job: document.job
    };
  }

  /**
   * Handle webhook event from Evia Sign
   */
  async handleWebhook(dto: WebhookEventDto, signature: string) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(dto), signature)) {
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log(`Webhook received for document: ${dto.documentId}`);

      // Find document by Evia Doc ID
      const document = await this.prisma.eviaSignDocument.findUnique({
        where: { eviaDocId: dto.documentId }
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Update document status
      const updateData: any = {
        status: dto.status.toUpperCase(),
        updatedAt: new Date()
      };

      if (dto.status === 'VIEWED') {
        updateData.viewedAt = new Date();
      }

      if (dto.status === 'SIGNED' || dto.status === 'COMPLETED') {
        updateData.signedAt = dto.signedAt ? new Date(dto.signedAt) : new Date();
        if (dto.signedPdfUrl) {
          updateData.signedPdfUrl = dto.signedPdfUrl;
        }
      }

      // Store webhook event in metadata
      const webhookEvents = document.webhookEvents as any[] || [];
      webhookEvents.push({
        status: dto.status,
        timestamp: new Date().toISOString(),
        metadata: dto.metadata
      });
      updateData.webhookEvents = webhookEvents;

      await this.prisma.eviaSignDocument.update({
        where: { id: document.id },
        data: updateData
      });

      this.logger.log(`Document status updated: ${dto.documentId} -> ${dto.status}`);

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate completion report PDF
   */
  private async generateCompletionReport(job: any): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size

      const { width, height } = page.getSize();
      const fontSize = 12;

      // Add title
      page.drawText('Job Completion Report', {
        x: 50,
        y: height - 50,
        size: 20,
        color: rgb(0, 0, 0)
      });

      // Add job details
      let yPosition = height - 100;
      const lineHeight = 20;

      const details = [
        `Job ID: ${job.id}`,
        `Title: ${job.title}`,
        `Site: ${job.site.name}`,
        `Address: ${job.site.address}`,
        `Scheduled Date: ${new Date(job.scheduledDate).toLocaleDateString()}`,
        `Tasks Completed: ${job.tasks.filter((t: any) => t.completed).length}/${job.tasks.length}`,
        ''
      ];

      details.forEach(detail => {
        page.drawText(detail, {
          x: 50,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0)
        });
        yPosition -= lineHeight;
      });

      // Add tasks
      page.drawText('Tasks:', {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0, 0, 0)
      });
      yPosition -= lineHeight;

      job.tasks.forEach((task: any) => {
        const status = task.completed ? '[X]' : '[ ]';
        page.drawText(`${status} ${task.title}`, {
          x: 70,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0)
        });
        yPosition -= lineHeight;
      });

      return pdfDoc.save();
    } catch (error: any) {
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate completion report');
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature verification');
      return true; // Allow in development
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }
}
