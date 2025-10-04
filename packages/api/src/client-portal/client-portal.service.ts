/**
 * Client portal service for client self-service functionality.
 */
import { Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ClientPortalService {
  private readonly logger = new Logger(ClientPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Client login
   */
  async login(email: string, password: string) {
    const client = await this.prisma.client.findUnique({
      where: { email }
    });

    if (!client || !client.portalEnabled || !client.portalPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, client.portalPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.client.update({
      where: { id: client.id },
      data: { lastLoginAt: new Date() }
    });

    // Return client info (in production, also return JWT token)
    return {
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone
    };
  }

  /**
   * Get client profile
   */
  async getProfile(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        sites: true
      }
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return {
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      portalEnabled: client.portalEnabled,
      lastLoginAt: client.lastLoginAt,
      sites: client.sites
    };
  }

  /**
   * List client jobs
   */
  async listJobs(clientId: string, status?: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { sites: true }
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const siteIds = client.sites.map(s => s.id);

    return await this.prisma.job.findMany({
      where: {
        siteId: { in: siteIds },
        ...(status === 'completed' && { signoff: { isNot: null } }),
        ...(status === 'active' && { signoff: null })
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        signoff: true,
        assignments: {
          include: {
            worker: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    });
  }

  /**
   * Get job details
   */
  async getJob(clientId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        site: {
          include: {
            client: true
          }
        },
        signoff: true,
        assignments: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tasks: true,
        photos: true,
        eviaSignDocs: true,
        qualityChecklists: {
          where: { status: 'APPROVED' },
          include: {
            items: true
          }
        }
      }
    });

    if (!job || !job.site.client || job.site.client.id !== clientId) {
      throw new NotFoundException('Job not found or access denied');
    }

    return job;
  }

  /**
   * Get job photos
   */
  async getJobPhotos(clientId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        site: { include: { client: true } },
        photos: {
          include: {
            worker: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!job || !job.site.client || job.site.client.id !== clientId) {
      throw new NotFoundException('Job not found or access denied');
    }

    return job.photos;
  }

  /**
   * Submit client feedback
   */
  async submitFeedback(clientId: string, jobId: string, data: {
    rating: number;
    comments?: string;
    categories?: any;
    wouldRecommend: boolean;
  }) {
    // Verify client has access to this job
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        site: { include: { client: true } }
      }
    });

    if (!job || !job.site.client || job.site.client.id !== clientId) {
      throw new NotFoundException('Job not found or access denied');
    }

    return await this.prisma.clientFeedback.create({
      data: {
        clientId,
        jobId,
        rating: data.rating,
        comments: data.comments,
        categories: data.categories || {},
        wouldRecommend: data.wouldRecommend,
        respondedAt: new Date()
      }
    });
  }

  /**
   * Get feedback history
   */
  async getFeedbackHistory(clientId: string) {
    return await this.prisma.clientFeedback.findMany({
      where: { clientId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            site: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Create service request
   */
  async createServiceRequest(clientId: string, data: {
    siteId?: string;
    serviceType: string;
    description: string;
    urgency: string;
    scheduledFor?: Date;
  }) {
    // Verify site belongs to client if siteId provided
    if (data.siteId) {
      const site = await this.prisma.site.findUnique({
        where: { id: data.siteId },
        include: { client: true }
      });

      if (!site || !site.client || site.client.id !== clientId) {
        throw new BadRequestException('Invalid site');
      }
    }

    return await this.prisma.serviceRequest.create({
      data: {
        clientId,
        siteId: data.siteId,
        serviceType: data.serviceType,
        description: data.description,
        urgency: data.urgency,
        scheduledFor: data.scheduledFor,
        status: 'PENDING'
      }
    });
  }

  /**
   * List service requests
   */
  async listServiceRequests(clientId: string, status?: string) {
    return await this.prisma.serviceRequest.findMany({
      where: {
        clientId,
        ...(status && { status: status as any })
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get service request details
   */
  async getServiceRequest(clientId: string, requestId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        site: true
      }
    });

    if (!request || request.clientId !== clientId) {
      throw new NotFoundException('Service request not found');
    }

    return request;
  }

  /**
   * Update service request
   */
  async updateServiceRequest(clientId: string, requestId: string, data: {
    description?: string;
    urgency?: string;
    scheduledFor?: Date;
  }) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.clientId !== clientId) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Can only update pending requests');
    }

    return await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        description: data.description,
        urgency: data.urgency,
        scheduledFor: data.scheduledFor
      }
    });
  }

  /**
   * List client sites
   */
  async listSites(clientId: string) {
    return await this.prisma.site.findMany({
      where: { clientId },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Update site details
   */
  async updateSite(clientId: string, siteId: string, data: {
    name?: string;
    address?: string;
  }) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { client: true }
    });

    if (!site || !site.client || site.client.id !== clientId) {
      throw new NotFoundException('Site not found or access denied');
    }

    return await this.prisma.site.update({
      where: { id: siteId },
      data: {
        name: data.name,
        address: data.address
      }
    });
  }

  /**
   * Get documents (from Evia Sign)
   */
  async getDocuments(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { sites: true }
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const siteIds = client.sites.map(s => s.id);

    const jobs = await this.prisma.job.findMany({
      where: {
        siteId: { in: siteIds }
      },
      include: {
        eviaSignDocs: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: {
            signedAt: 'desc'
          }
        },
        site: {
          select: {
            name: true
          }
        }
      }
    });

    const documents = jobs.flatMap(job =>
      job.eviaSignDocs.map(doc => ({
        id: doc.id,
        jobId: job.id,
        jobTitle: job.title,
        siteName: job.site.name,
        documentType: doc.documentType,
        signedAt: doc.signedAt,
        signedPdfUrl: doc.signedPdfUrl
      }))
    );

    return documents;
  }

  /**
   * Download document
   */
  async getDocument(clientId: string, documentId: string) {
    const document = await this.prisma.eviaSignDocument.findUnique({
      where: { id: documentId },
      include: {
        job: {
          include: {
            site: {
              include: {
                client: true
              }
            }
          }
        }
      }
    });

    if (!document || !document.job?.site?.client || document.job.site.client.id !== clientId) {
      throw new NotFoundException('Document not found or access denied');
    }

    return {
      id: document.id,
      documentType: document.documentType,
      signedPdfUrl: document.signedPdfUrl,
      signedAt: document.signedAt
    };
  }
}
