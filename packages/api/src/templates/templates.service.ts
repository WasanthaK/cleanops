/**
 * Templates service for managing job templates.
 */
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { CreateJobFromTemplateDto } from './dto/create-job-from-template.dto.js';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all active templates
   */
  async list(category?: string) {
    const where = {
      active: true,
      ...(category && { category })
    };

    return this.prisma.jobTemplate.findMany({
      where,
      include: {
        taskTemplates: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get template by ID
   */
  async get(id: string) {
    const template = await this.prisma.jobTemplate.findUnique({
      where: { id },
      include: {
        taskTemplates: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  /**
   * Create new template
   */
  async create(dto: CreateTemplateDto) {
    try {
      this.logger.log(`Creating template: ${dto.name}`);

      const template = await this.prisma.jobTemplate.create({
        data: {
          name: dto.name,
          category: dto.category,
          description: dto.description,
          estimatedHours: dto.estimatedHours,
          basePrice: dto.basePrice,
          taskTemplates: {
            create: dto.tasks?.map((task, index) => ({
              title: task.title,
              description: task.description,
              estimatedMinutes: task.estimatedMinutes,
              required: task.required ?? false,
              orderIndex: task.orderIndex ?? index
            })) || []
          }
        },
        include: {
          taskTemplates: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });

      this.logger.log(`Template created: ${template.id}`);

      return template;
    } catch (error: any) {
      this.logger.error(`Failed to create template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create template');
    }
  }

  /**
   * Update existing template
   */
  async update(id: string, dto: UpdateTemplateDto) {
    try {
      // Check if template exists
      await this.get(id);

      this.logger.log(`Updating template: ${id}`);

      // If tasks are provided, replace them
      if (dto.tasks) {
        // Delete existing task templates
        await this.prisma.taskTemplate.deleteMany({
          where: { jobTemplateId: id }
        });
      }

      const template = await this.prisma.jobTemplate.update({
        where: { id },
        data: {
          name: dto.name,
          category: dto.category,
          description: dto.description,
          estimatedHours: dto.estimatedHours,
          basePrice: dto.basePrice,
          active: dto.active,
          ...(dto.tasks && {
            taskTemplates: {
              create: dto.tasks.map((task, index) => ({
                title: task.title,
                description: task.description,
                estimatedMinutes: task.estimatedMinutes,
                required: task.required ?? false,
                orderIndex: task.orderIndex ?? index
              }))
            }
          })
        },
        include: {
          taskTemplates: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });

      this.logger.log(`Template updated: ${id}`);

      return template;
    } catch (error: any) {
      this.logger.error(`Failed to update template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update template');
    }
  }

  /**
   * Soft delete template
   */
  async delete(id: string) {
    try {
      await this.get(id);

      await this.prisma.jobTemplate.update({
        where: { id },
        data: { active: false }
      });

      this.logger.log(`Template deleted: ${id}`);

      return { success: true, message: 'Template deleted successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to delete template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete template');
    }
  }

  /**
   * Create job from template
   */
  async createJobFromTemplate(templateId: string, dto: CreateJobFromTemplateDto) {
    try {
      this.logger.log(`Creating job from template: ${templateId}`);

      // Get template with tasks
      const template = await this.get(templateId);

      // Create job with tasks
      const job = await this.prisma.job.create({
        data: {
          siteId: dto.siteId,
          title: dto.title,
          description: dto.description || template.description,
          scheduledDate: new Date(dto.scheduledDate),
          assignments: {
            create: dto.workerIds?.map(workerId => ({ workerId })) || []
          },
          tasks: {
            create: template.taskTemplates.map((taskTemplate: any) => ({
              workerId: dto.workerIds?.[0] || '', // Assign to first worker or empty
              title: taskTemplate.title,
              notes: taskTemplate.description,
              completed: false
            }))
          }
        },
        include: {
          site: true,
          assignments: true,
          tasks: true
        }
      });

      this.logger.log(`Job created from template: ${job.id}`);

      return job;
    } catch (error: any) {
      this.logger.error(`Failed to create job from template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create job from template');
    }
  }

  /**
   * Seed pre-built templates
   */
  async seedTemplates() {
    try {
      this.logger.log('Seeding pre-built templates');

      const templates = [
        {
          name: 'Standard Office Cleaning',
          category: 'commercial',
          description: 'Standard daily office cleaning service',
          estimatedHours: 2.5,
          basePrice: 150,
          tasks: [
            { title: 'Vacuum all carpeted areas', estimatedMinutes: 30, required: true, orderIndex: 0 },
            { title: 'Empty all bins', estimatedMinutes: 15, required: true, orderIndex: 1 },
            { title: 'Clean and sanitize bathrooms', estimatedMinutes: 45, required: true, orderIndex: 2 },
            { title: 'Clean kitchen/breakroom', estimatedMinutes: 30, required: true, orderIndex: 3 },
            { title: 'Wipe down desks and surfaces', estimatedMinutes: 30, required: false, orderIndex: 4 },
            { title: 'Mop hard floors', estimatedMinutes: 30, required: true, orderIndex: 5 }
          ]
        },
        {
          name: 'Residential Deep Clean',
          category: 'residential',
          description: 'Comprehensive home deep cleaning',
          estimatedHours: 4,
          basePrice: 250,
          tasks: [
            { title: 'Clean all bedrooms', estimatedMinutes: 60, required: true, orderIndex: 0 },
            { title: 'Clean kitchen thoroughly', estimatedMinutes: 60, required: true, orderIndex: 1 },
            { title: 'Clean all bathrooms', estimatedMinutes: 45, required: true, orderIndex: 2 },
            { title: 'Vacuum and mop all floors', estimatedMinutes: 45, required: true, orderIndex: 3 },
            { title: 'Dust all surfaces', estimatedMinutes: 30, required: true, orderIndex: 4 },
            { title: 'Clean windows (interior)', estimatedMinutes: 30, required: false, orderIndex: 5 },
            { title: 'Clean appliances', estimatedMinutes: 30, required: false, orderIndex: 6 }
          ]
        },
        {
          name: 'Window Cleaning Service',
          category: 'specialized',
          description: 'Professional window cleaning',
          estimatedHours: 1.5,
          basePrice: 100,
          tasks: [
            { title: 'Clean exterior windows', estimatedMinutes: 45, required: true, orderIndex: 0 },
            { title: 'Clean interior windows', estimatedMinutes: 30, required: true, orderIndex: 1 },
            { title: 'Clean window frames and sills', estimatedMinutes: 15, required: true, orderIndex: 2 }
          ]
        },
        {
          name: 'Post-Construction Clean',
          category: 'specialized',
          description: 'Thorough cleaning after construction or renovation',
          estimatedHours: 6,
          basePrice: 400,
          tasks: [
            { title: 'Remove construction debris', estimatedMinutes: 60, required: true, orderIndex: 0 },
            { title: 'Clean all windows', estimatedMinutes: 60, required: true, orderIndex: 1 },
            { title: 'Dust all surfaces and fixtures', estimatedMinutes: 90, required: true, orderIndex: 2 },
            { title: 'Clean floors thoroughly', estimatedMinutes: 90, required: true, orderIndex: 3 },
            { title: 'Clean bathrooms and kitchen', estimatedMinutes: 60, required: true, orderIndex: 4 },
            { title: 'Final inspection and touch-ups', estimatedMinutes: 30, required: true, orderIndex: 5 }
          ]
        }
      ];

      for (const templateData of templates) {
        await this.prisma.jobTemplate.upsert({
          where: { 
            name: templateData.name
          },
          update: {},
          create: {
            name: templateData.name,
            category: templateData.category,
            description: templateData.description,
            estimatedHours: templateData.estimatedHours,
            basePrice: templateData.basePrice,
            taskTemplates: {
              create: templateData.tasks
            }
          }
        });
      }

      this.logger.log(`Seeded ${templates.length} templates`);

      return { success: true, count: templates.length };
    } catch (error: any) {
      this.logger.error(`Failed to seed templates: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to seed templates');
    }
  }
}
