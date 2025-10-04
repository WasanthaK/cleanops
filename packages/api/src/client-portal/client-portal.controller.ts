/**
 * Client portal controller providing self-service endpoints for clients.
 */
import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientPortalService } from './client-portal.service.js';

@ApiTags('client-portal')
@Controller('portal')
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Client login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: { email: string; password: string }) {
    return await this.clientPortalService.login(body.email, body.password);
  }

  @Get('auth/profile')
  @ApiOperation({ summary: 'Get client profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Query('clientId') clientId: string) {
    return await this.clientPortalService.getProfile(clientId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List client jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async listJobs(@Query('clientId') clientId: string, @Query('status') status?: string) {
    return await this.clientPortalService.listJobs(clientId, status);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job details' })
  @ApiResponse({ status: 200, description: 'Job details retrieved successfully' })
  async getJob(@Param('id') jobId: string, @Query('clientId') clientId: string) {
    return await this.clientPortalService.getJob(clientId, jobId);
  }

  @Get('jobs/:id/photos')
  @ApiOperation({ summary: 'Get job photos' })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully' })
  async getJobPhotos(@Param('id') jobId: string, @Query('clientId') clientId: string) {
    return await this.clientPortalService.getJobPhotos(clientId, jobId);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit client feedback' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async submitFeedback(@Body() body: {
    clientId: string;
    jobId: string;
    rating: number;
    comments?: string;
    categories?: any;
    wouldRecommend: boolean;
  }) {
    return await this.clientPortalService.submitFeedback(
      body.clientId,
      body.jobId,
      {
        rating: body.rating,
        comments: body.comments,
        categories: body.categories,
        wouldRecommend: body.wouldRecommend
      }
    );
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get feedback history' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved successfully' })
  async getFeedbackHistory(@Query('clientId') clientId: string) {
    return await this.clientPortalService.getFeedbackHistory(clientId);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create service request' })
  @ApiResponse({ status: 201, description: 'Request created successfully' })
  async createServiceRequest(@Body() body: {
    clientId: string;
    siteId?: string;
    serviceType: string;
    description: string;
    urgency: string;
    scheduledFor?: string;
  }) {
    return await this.clientPortalService.createServiceRequest(
      body.clientId,
      {
        siteId: body.siteId,
        serviceType: body.serviceType,
        description: body.description,
        urgency: body.urgency,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined
      }
    );
  }

  @Get('requests')
  @ApiOperation({ summary: 'List service requests' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  async listServiceRequests(
    @Query('clientId') clientId: string,
    @Query('status') status?: string
  ) {
    return await this.clientPortalService.listServiceRequests(clientId, status);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get service request details' })
  @ApiResponse({ status: 200, description: 'Request retrieved successfully' })
  async getServiceRequest(@Param('id') requestId: string, @Query('clientId') clientId: string) {
    return await this.clientPortalService.getServiceRequest(clientId, requestId);
  }

  @Put('requests/:id')
  @ApiOperation({ summary: 'Update service request' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  async updateServiceRequest(
    @Param('id') requestId: string,
    @Body() body: {
      clientId: string;
      description?: string;
      urgency?: string;
      scheduledFor?: string;
    }
  ) {
    return await this.clientPortalService.updateServiceRequest(
      body.clientId,
      requestId,
      {
        description: body.description,
        urgency: body.urgency,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined
      }
    );
  }

  @Get('documents')
  @ApiOperation({ summary: 'List documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getDocuments(@Query('clientId') clientId: string) {
    return await this.clientPortalService.getDocuments(clientId);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Download document' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  async getDocument(@Param('id') documentId: string, @Query('clientId') clientId: string) {
    return await this.clientPortalService.getDocument(clientId, documentId);
  }

  @Get('sites')
  @ApiOperation({ summary: 'List client sites' })
  @ApiResponse({ status: 200, description: 'Sites retrieved successfully' })
  async listSites(@Query('clientId') clientId: string) {
    return await this.clientPortalService.listSites(clientId);
  }

  @Put('sites/:id')
  @ApiOperation({ summary: 'Update site details' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  async updateSite(
    @Param('id') siteId: string,
    @Body() body: {
      clientId: string;
      name?: string;
      address?: string;
    }
  ) {
    return await this.clientPortalService.updateSite(body.clientId, siteId, {
      name: body.name,
      address: body.address
    });
  }
}
