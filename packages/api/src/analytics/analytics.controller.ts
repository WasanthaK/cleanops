/**
 * Analytics controller providing dashboard and performance metrics endpoints.
 */
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  BadRequestException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AnalyticsService } from './analytics.service.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get overall dashboard metrics
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get overall dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboard(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return await this.analyticsService.getDashboardMetrics(targetDate);
  }

  /**
   * Get all workers performance metrics
   */
  @Get('workers')
  @ApiOperation({ summary: 'Get all workers performance metrics' })
  @ApiResponse({ status: 200, description: 'Worker performance data retrieved successfully' })
  async getWorkersPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getWorkerPerformance(undefined, start, end);
  }

  /**
   * Get individual worker analytics
   */
  @Get('workers/:id')
  @ApiOperation({ summary: 'Get individual worker analytics' })
  @ApiResponse({ status: 200, description: 'Worker analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Worker not found' })
  async getWorkerAnalytics(@Param('id') workerId: string) {
    return await this.analyticsService.getWorkerAnalytics(workerId);
  }

  /**
   * Get worker activity timeline
   */
  @Get('workers/:id/timeline')
  @ApiOperation({ summary: 'Get worker activity timeline' })
  @ApiResponse({ status: 200, description: 'Worker timeline retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Worker not found' })
  async getWorkerTimeline(
    @Param('id') workerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getWorkerPerformance(workerId, start, end);
  }

  /**
   * Get worker leaderboard
   */
  @Get('workers/leaderboard')
  @ApiOperation({ summary: 'Get top performing workers' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  async getLeaderboard(
    @Query('metric') metric?: 'efficiency' | 'jobs' | 'hours',
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.analyticsService.getWorkerLeaderboard(metric || 'efficiency', limitNum);
  }

  /**
   * Get job completion analytics
   */
  @Get('jobs/completion')
  @ApiOperation({ summary: 'Get job completion rates and statistics' })
  @ApiResponse({ status: 200, description: 'Job completion analytics retrieved successfully' })
  async getJobCompletion(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getJobCompletionAnalytics(start, end);
  }

  /**
   * Get job timeline view
   */
  @Get('jobs/timeline')
  @ApiOperation({ summary: 'Get timeline view of jobs' })
  @ApiResponse({ status: 200, description: 'Job timeline retrieved successfully' })
  async getJobTimeline(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const result = await this.analyticsService.getJobCompletionAnalytics(start, end);
    return result.timeline;
  }

  /**
   * Get job duration analysis
   */
  @Get('jobs/duration')
  @ApiOperation({ summary: 'Get job duration analysis' })
  @ApiResponse({ status: 200, description: 'Job duration data retrieved successfully' })
  async getJobDuration(@Query('groupBy') groupBy?: 'type' | 'site') {
    return await this.analyticsService.getJobDurationAnalysis(groupBy || 'type');
  }

  /**
   * Get jobs breakdown by type
   */
  @Get('jobs/by-type')
  @ApiOperation({ summary: 'Get jobs breakdown by type' })
  @ApiResponse({ status: 200, description: 'Job type breakdown retrieved successfully' })
  async getJobsByType() {
    return await this.analyticsService.getJobDurationAnalysis('type');
  }

  /**
   * Get financial summary
   */
  @Get('financial/summary')
  @ApiOperation({ summary: 'Get financial summary (revenue, costs, profit)' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved successfully' })
  async getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getFinancialSummary(start, end);
  }

  /**
   * Get financial trends over time
   */
  @Get('financial/trends')
  @ApiOperation({ summary: 'Get financial trends over time' })
  @ApiResponse({ status: 200, description: 'Financial trends retrieved successfully' })
  async getFinancialTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getFinancialTrends(start, end);
  }

  /**
   * Get financial breakdown by client
   */
  @Get('financial/by-client')
  @ApiOperation({ summary: 'Get revenue breakdown by client' })
  @ApiResponse({ status: 200, description: 'Client financial data retrieved successfully' })
  async getFinancialByClient() {
    // TODO: Implement when Client model is added in Phase 2 (Client Portal)
    return {
      message: 'This endpoint will be implemented in Phase 2 (Client Portal)',
      clients: []
    };
  }

  /**
   * Update worker location
   */
  @Post('location')
  @ApiOperation({ summary: 'Update worker location' })
  @ApiResponse({ status: 201, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  async updateLocation(@Body() dto: UpdateLocationDto) {
    return await this.analyticsService.updateWorkerLocation(
      dto.workerId,
      dto.latitude,
      dto.longitude,
      dto.accuracy,
      dto.jobId
    );
  }

  /**
   * Get current worker locations
   */
  @Get('location/workers')
  @ApiOperation({ summary: 'Get current locations of all workers' })
  @ApiResponse({ status: 200, description: 'Worker locations retrieved successfully' })
  async getWorkerLocations() {
    return await this.analyticsService.getCurrentWorkerLocations();
  }

  /**
   * Get worker location history
   */
  @Get('location/:workerId/history')
  @ApiOperation({ summary: 'Get location history for a worker' })
  @ApiResponse({ status: 200, description: 'Location history retrieved successfully' })
  async getLocationHistory(
    @Param('workerId') workerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getWorkerLocationHistory(workerId, start, end);
  }
}
