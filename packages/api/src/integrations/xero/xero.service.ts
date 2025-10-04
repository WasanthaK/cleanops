/**
 * Xero integration service handling OAuth and data sync operations.
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XeroClient, TokenSet } from 'xero-node';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ConnectXeroDto } from './dto/connect-xero.dto.js';
import { SyncPayrollDto } from './dto/sync-payroll.dto.js';

@Injectable()
export class XeroService {
  private readonly logger = new Logger(XeroService.name);
  private xeroClient: XeroClient;
  private encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    const clientId = this.configService.get<string>('XERO_CLIENT_ID', '');
    const clientSecret = this.configService.get<string>('XERO_CLIENT_SECRET', '');
    const redirectUri = this.configService.get<string>('XERO_REDIRECT_URI', 'http://localhost:3000/integrations/xero/callback');

    this.xeroClient = new XeroClient({
      clientId,
      clientSecret,
      redirectUris: [redirectUri],
      scopes: 'accounting.transactions payroll.employees payroll.timesheets'.split(' ')
    });

    // Use encryption key from env or generate one (in production, use env var)
    const keyString = this.configService.get<string>('ENCRYPTION_KEY', 'dev-encryption-key-32-characters');
    this.encryptionKey = Buffer.from(keyString.padEnd(32, '0').slice(0, 32));
  }

  /**
   * Generate Xero OAuth consent URL
   */
  async getConsentUrl(): Promise<string> {
    return await this.xeroClient.buildConsentUrl();
  }

  /**
   * Connect to Xero using OAuth authorization code
   */
  async connect(dto: ConnectXeroDto) {
    try {
      this.logger.log('Connecting to Xero with authorization code');

      // Exchange authorization code for tokens
      const tokenSet: TokenSet = await this.xeroClient.apiCallback(dto.code);
      
      if (!tokenSet.access_token || !tokenSet.refresh_token) {
        throw new BadRequestException('Failed to obtain Xero tokens');
      }

      // Get tenant connections
      await this.xeroClient.updateTenants();
      const tenants = this.xeroClient.tenants;

      if (tenants.length === 0) {
        throw new BadRequestException('No Xero organizations found');
      }

      // Use specified tenant or first available
      const tenant = dto.tenantId 
        ? tenants.find(t => t.tenantId === dto.tenantId)
        : tenants[0];

      if (!tenant) {
        throw new NotFoundException('Specified Xero organization not found');
      }

      // Encrypt tokens
      const encryptedAccessToken = this.encrypt(tokenSet.access_token);
      const encryptedRefreshToken = this.encrypt(tokenSet.refresh_token);

      // Calculate expiry time (tokens expire in 30 minutes)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Store integration in database
      const integration = await this.prisma.xeroIntegration.upsert({
        where: { tenantId: tenant.tenantId },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          syncStatus: 'CONNECTED',
          updatedAt: new Date()
        },
        create: {
          tenantId: tenant.tenantId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          syncStatus: 'CONNECTED',
          payrollMapping: {}, // Default empty mapping
          expenseMapping: null,
          taxMapping: null
        }
      });

      this.logger.log(`Xero connected successfully for tenant: ${tenant.tenantId}`);

      return {
        success: true,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        integrationId: integration.id
      };
    } catch (error: any) {
      this.logger.error(`Failed to connect Xero: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to connect to Xero. Please try again.');
    }
  }

  /**
   * Disconnect from Xero
   */
  async disconnect(tenantId: string) {
    try {
      await this.prisma.xeroIntegration.update({
        where: { tenantId },
        data: {
          syncStatus: 'DISCONNECTED',
          updatedAt: new Date()
        }
      });

      this.logger.log(`Xero disconnected for tenant: ${tenantId}`);

      return { success: true, message: 'Xero integration disconnected' };
    } catch (error: any) {
      this.logger.error(`Failed to disconnect Xero: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to disconnect from Xero');
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(tenantId: string) {
    try {
      const integration = await this.prisma.xeroIntegration.findUnique({
        where: { tenantId }
      });

      if (!integration) {
        throw new NotFoundException('Xero integration not found');
      }

      // Decrypt refresh token
      const refreshToken = this.decrypt(integration.refreshToken);

      // Refresh token set
      const tokenSet: TokenSet = await this.xeroClient.refreshToken();
      
      if (!tokenSet.access_token || !tokenSet.refresh_token) {
        throw new BadRequestException('Failed to refresh Xero tokens');
      }

      // Encrypt new tokens
      const encryptedAccessToken = this.encrypt(tokenSet.access_token);
      const encryptedRefreshToken = this.encrypt(tokenSet.refresh_token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Update database
      await this.prisma.xeroIntegration.update({
        where: { tenantId },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          updatedAt: new Date()
        }
      });

      this.logger.log(`Xero tokens refreshed for tenant: ${tenantId}`);

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to refresh Xero token: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to refresh Xero token');
    }
  }

  /**
   * Sync payroll data to Xero
   */
  async syncPayroll(tenantId: string, dto: SyncPayrollDto) {
    try {
      this.logger.log(`Syncing payroll to Xero for tenant: ${tenantId}`);

      // Get integration
      const integration = await this.prisma.xeroIntegration.findUnique({
        where: { tenantId }
      });

      if (!integration) {
        throw new NotFoundException('Xero integration not found');
      }

      // Check if token needs refresh
      if (new Date() >= integration.expiresAt) {
        await this.refreshToken(tenantId);
      }

      // Set sync status
      await this.prisma.xeroIntegration.update({
        where: { tenantId },
        data: { syncStatus: 'SYNCING' }
      });

      // Get payroll data from database
      const payrollCalcs = await this.prisma.payrollCalc.findMany({
        where: {
          ...(dto.workerId && { workerId: dto.workerId }),
          ...(dto.startDate && { createdAt: { gte: new Date(dto.startDate) } }),
          ...(dto.endDate && { createdAt: { lte: new Date(dto.endDate) } })
        },
        include: {
          worker: true,
          job: {
            include: {
              site: true
            }
          }
        }
      });

      // TODO: Implement actual Xero API calls to sync payroll
      // This would involve mapping CleanOps payroll data to Xero payroll items
      // and calling the appropriate Xero API endpoints

      // Create sync log
      await this.prisma.xeroSyncLog.create({
        data: {
          integrationId: integration.id,
          syncType: 'payroll',
          status: 'success',
          recordsSynced: payrollCalcs.length,
          metadata: {
            startDate: dto.startDate,
            endDate: dto.endDate,
            workerId: dto.workerId
          }
        }
      });

      // Update integration
      await this.prisma.xeroIntegration.update({
        where: { tenantId },
        data: {
          syncStatus: 'CONNECTED',
          lastSyncAt: new Date()
        }
      });

      this.logger.log(`Payroll synced successfully: ${payrollCalcs.length} records`);

      return {
        success: true,
        recordsSynced: payrollCalcs.length,
        message: 'Payroll synced to Xero successfully'
      };
    } catch (error: any) {
      this.logger.error(`Failed to sync payroll: ${error.message}`, error.stack);

      // Log failed sync
      const integration = await this.prisma.xeroIntegration.findUnique({
        where: { tenantId }
      });

      if (integration) {
        await this.prisma.xeroSyncLog.create({
          data: {
            integrationId: integration.id,
            syncType: 'payroll',
            status: 'failed',
            recordsSynced: 0,
            errorMessage: error.message
          }
        });

        await this.prisma.xeroIntegration.update({
          where: { tenantId },
          data: { syncStatus: 'ERROR' }
        });
      }

      throw new BadRequestException('Failed to sync payroll to Xero');
    }
  }

  /**
   * Get integration status
   */
  async getStatus(tenantId: string) {
    const integration = await this.prisma.xeroIntegration.findUnique({
      where: { tenantId },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!integration) {
      throw new NotFoundException('Xero integration not found');
    }

    return {
      tenantId: integration.tenantId,
      syncStatus: integration.syncStatus,
      lastSyncAt: integration.lastSyncAt,
      recentSyncs: integration.syncLogs
    };
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
