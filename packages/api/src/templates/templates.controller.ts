/**
 * Templates controller for job template management.
 */
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { TemplatesService } from './templates.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { CreateJobFromTemplateDto } from './dto/create-job-from-template.dto.js';

@ApiBearerAuth()
@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all job templates' })
  async list(@Query('category') category?: string) {
    return this.templatesService.list(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  async get(@Param('id') id: string) {
    return this.templatesService.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new template' })
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  @Post(':id/create-job')
  @ApiOperation({ summary: 'Create job from template' })
  async createJobFromTemplate(
    @Param('id') id: string,
    @Body() dto: CreateJobFromTemplateDto
  ) {
    return this.templatesService.createJobFromTemplate(id, dto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed pre-built templates' })
  async seedTemplates() {
    return this.templatesService.seedTemplates();
  }
}
