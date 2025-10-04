/**
 * Tests for Templates service
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { TemplatesService } from '../src/templates/templates.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    jobTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    taskTemplate: {
      deleteMany: jest.fn()
    },
    job: {
      create: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: mockPrismaService }
      ]
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all active templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Office Cleaning',
          category: 'commercial',
          active: true,
          taskTemplates: []
        }
      ];

      mockPrismaService.jobTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.list();

      expect(result).toEqual(mockTemplates);
      expect(mockPrismaService.jobTemplate.findMany).toHaveBeenCalledWith({
        where: { active: true },
        include: {
          taskTemplates: {
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });
    });

    it('should filter by category', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Office Cleaning',
          category: 'commercial',
          active: true,
          taskTemplates: []
        }
      ];

      mockPrismaService.jobTemplate.findMany.mockResolvedValue(mockTemplates);

      await service.list('commercial');

      expect(mockPrismaService.jobTemplate.findMany).toHaveBeenCalledWith({
        where: { active: true, category: 'commercial' },
        include: {
          taskTemplates: {
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });
    });
  });

  describe('get', () => {
    it('should return template by id', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Office Cleaning',
        category: 'commercial',
        taskTemplates: []
      };

      mockPrismaService.jobTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.get('template-1');

      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrismaService.jobTemplate.findUnique.mockResolvedValue(null);

      await expect(service.get('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create new template', async () => {
      const dto = {
        name: 'New Template',
        category: 'commercial',
        description: 'Test description',
        estimatedHours: 2,
        basePrice: 100,
        tasks: [
          {
            title: 'Task 1',
            description: 'Task description',
            estimatedMinutes: 30,
            required: true,
            orderIndex: 0
          }
        ]
      };

      const mockTemplate = {
        id: 'new-template-id',
        ...dto,
        taskTemplates: dto.tasks
      };

      mockPrismaService.jobTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.create(dto);

      expect(result).toEqual(mockTemplate);
      expect(mockPrismaService.jobTemplate.create).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete template', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        active: true
      };

      mockPrismaService.jobTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.jobTemplate.update.mockResolvedValue({
        ...mockTemplate,
        active: false
      });

      const result = await service.delete('template-1');

      expect(result).toEqual({
        success: true,
        message: 'Template deleted successfully'
      });
      expect(mockPrismaService.jobTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { active: false }
      });
    });
  });

  describe('createJobFromTemplate', () => {
    it('should create job from template', async () => {
      const templateId = 'template-1';
      const dto = {
        siteId: 'site-1',
        title: 'New Job',
        scheduledDate: '2024-01-01',
        workerIds: ['worker-1']
      };

      const mockTemplate = {
        id: templateId,
        name: 'Test Template',
        description: 'Template description',
        taskTemplates: [
          {
            id: 'task-template-1',
            title: 'Task 1',
            description: 'Task description',
            estimatedMinutes: 30,
            required: true,
            orderIndex: 0
          }
        ]
      };

      const mockJob = {
        id: 'new-job-id',
        siteId: dto.siteId,
        title: dto.title,
        scheduledDate: new Date(dto.scheduledDate),
        site: { id: dto.siteId, name: 'Test Site' },
        assignments: [{ workerId: 'worker-1' }],
        tasks: [{ title: 'Task 1' }]
      };

      mockPrismaService.jobTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.job.create.mockResolvedValue(mockJob);

      const result = await service.createJobFromTemplate(templateId, dto);

      expect(result).toEqual(mockJob);
      expect(mockPrismaService.job.create).toHaveBeenCalled();
    });
  });
});
