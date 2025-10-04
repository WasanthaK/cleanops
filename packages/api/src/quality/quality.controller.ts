/**
 * Quality controller providing quality assurance and checklist endpoints.
 */
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QualityService } from './quality.service.js';
import { CreateChecklistDto } from './dto/create-checklist.dto.js';
import { UpdateChecklistDto } from './dto/update-checklist.dto.js';
import { ReviewChecklistDto } from './dto/review-checklist.dto.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';

@ApiTags('quality')
@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post('checklists')
  @ApiOperation({ summary: 'Create a new quality checklist' })
  @ApiResponse({ status: 201, description: 'Checklist created successfully' })
  async createChecklist(@Body() dto: CreateChecklistDto) {
    return await this.qualityService.createChecklist(dto);
  }

  @Get('checklists/:id')
  @ApiOperation({ summary: 'Get checklist details' })
  @ApiResponse({ status: 200, description: 'Checklist retrieved successfully' })
  async getChecklist(@Param('id') id: string) {
    return await this.qualityService.getChecklistById(id);
  }

  @Put('checklists/:id')
  @ApiOperation({ summary: 'Update checklist' })
  @ApiResponse({ status: 200, description: 'Checklist updated successfully' })
  async updateChecklist(@Param('id') id: string, @Body() dto: UpdateChecklistDto) {
    return await this.qualityService.updateChecklist(id, dto);
  }

  @Post('checklists/:id/submit')
  @ApiOperation({ summary: 'Submit checklist for review' })
  @ApiResponse({ status: 200, description: 'Checklist submitted for review' })
  async submitChecklist(@Param('id') id: string) {
    return await this.qualityService.submitForReview(id);
  }

  @Delete('checklists/:id')
  @ApiOperation({ summary: 'Delete checklist' })
  @ApiResponse({ status: 200, description: 'Checklist deleted successfully' })
  async deleteChecklist(@Param('id') id: string) {
    return await this.qualityService.deleteChecklist(id);
  }

  @Get('jobs/:jobId/quality')
  @ApiOperation({ summary: 'Get quality checklist for a job' })
  @ApiResponse({ status: 200, description: 'Checklist retrieved successfully' })
  async getJobChecklist(@Param('jobId') jobId: string) {
    return await this.qualityService.getChecklistByJobId(jobId);
  }

  @Post('checklists/:id/review')
  @ApiOperation({ summary: 'Submit supervisor review' })
  @ApiResponse({ status: 200, description: 'Review submitted successfully' })
  async reviewChecklist(@Param('id') id: string, @Body() dto: ReviewChecklistDto) {
    return await this.qualityService.reviewChecklist(id, dto);
  }

  @Post('checklists/:id/approve')
  @ApiOperation({ summary: 'Approve checklist' })
  @ApiResponse({ status: 200, description: 'Checklist approved successfully' })
  async approveChecklist(@Param('id') id: string, @Body() body: { supervisorId: string }) {
    return await this.qualityService.approveChecklist(id, body.supervisorId);
  }

  @Post('checklists/:id/reject')
  @ApiOperation({ summary: 'Reject checklist' })
  @ApiResponse({ status: 200, description: 'Checklist rejected successfully' })
  async rejectChecklist(@Param('id') id: string, @Body() body: { supervisorId: string; reason: string }) {
    return await this.qualityService.rejectChecklist(id, body.supervisorId, body.reason);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List quality templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async listTemplates(@Query('jobCategory') jobCategory?: string) {
    return await this.qualityService.listTemplates(jobCategory);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create quality template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return await this.qualityService.createTemplate(dto);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update quality template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(@Param('id') id: string, @Body() dto: CreateTemplateDto) {
    return await this.qualityService.updateTemplate(id, dto);
  }

  @Get('analytics/workers/:id')
  @ApiOperation({ summary: 'Get worker quality scores' })
  @ApiResponse({ status: 200, description: 'Worker scores retrieved successfully' })
  async getWorkerScores(
    @Param('id') workerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.qualityService.getWorkerQualityScores(workerId, start, end);
  }

  @Get('analytics/trends')
  @ApiOperation({ summary: 'Get quality trends' })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  async getTrends(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.qualityService.getQualityTrends(start, end);
  }

  @Get('analytics/issues')
  @ApiOperation({ summary: 'Get common quality issues' })
  @ApiResponse({ status: 200, description: 'Issues retrieved successfully' })
  async getCommonIssues(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.qualityService.getCommonIssues(limitNum);
  }
}
