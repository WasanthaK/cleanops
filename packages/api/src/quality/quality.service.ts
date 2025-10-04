/**
 * Quality assurance service for managing checklists, reviews, and quality scoring.
 */
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateChecklistDto } from './dto/create-checklist.dto.js';
import { UpdateChecklistDto } from './dto/update-checklist.dto.js';
import { ReviewChecklistDto } from './dto/review-checklist.dto.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new quality checklist for a job
   */
  async createChecklist(dto: CreateChecklistDto) {
    try {
      // Verify job exists
      const job = await this.prisma.job.findUnique({
        where: { id: dto.jobId }
      });

      if (!job) {
        throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
      }

      // Verify worker exists
      const worker = await this.prisma.worker.findUnique({
        where: { id: dto.workerId }
      });

      if (!worker) {
        throw new NotFoundException(`Worker with ID ${dto.workerId} not found`);
      }

      // Calculate overall score
      const totalScore = dto.items.reduce((sum, item) => sum + item.score, 0);
      const maxScore = dto.items.length * 5;
      const overallScore = (totalScore / maxScore) * 100;

      return await this.prisma.qualityChecklist.create({
        data: {
          jobId: dto.jobId,
          workerId: dto.workerId,
          status: 'PENDING',
          overallScore,
          completedAt: new Date(),
          items: {
            create: dto.items.map(item => ({
              category: item.category,
              description: item.description,
              passed: item.passed,
              score: item.score,
              notes: item.notes,
              photoKeys: item.photoKeys || [],
              required: item.required ?? true
            }))
          }
        },
        include: {
          items: true,
          worker: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              site: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Error creating quality checklist', error);
      throw error;
    }
  }

  /**
   * Get checklist by ID
   */
  async getChecklistById(id: string) {
    const checklist = await this.prisma.qualityChecklist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            site: {
              select: {
                name: true,
                address: true
              }
            }
          }
        }
      }
    });

    if (!checklist) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    return checklist;
  }

  /**
   * Update checklist
   */
  async updateChecklist(id: string, dto: UpdateChecklistDto) {
    const existing = await this.prisma.qualityChecklist.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Can only update checklists in PENDING status');
    }

    // Recalculate overall score if items are updated
    let overallScore = existing.overallScore;
    if (dto.items) {
      const totalScore = dto.items.reduce((sum, item) => sum + item.score, 0);
      const maxScore = dto.items.length * 5;
      overallScore = (totalScore / maxScore) * 100;

      // Delete existing items and create new ones
      await this.prisma.qualityCheckItem.deleteMany({
        where: { checklistId: id }
      });
    }

    return await this.prisma.qualityChecklist.update({
      where: { id },
      data: {
        overallScore,
        ...(dto.items && {
          items: {
            create: dto.items.map(item => ({
              category: item.category,
              description: item.description,
              passed: item.passed,
              score: item.score,
              notes: item.notes,
              photoKeys: item.photoKeys || [],
              required: item.required ?? true
            }))
          }
        })
      },
      include: {
        items: true,
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Submit checklist for review
   */
  async submitForReview(id: string) {
    const checklist = await this.prisma.qualityChecklist.findUnique({
      where: { id }
    });

    if (!checklist) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    if (checklist.status !== 'PENDING') {
      throw new BadRequestException('Can only submit checklists in PENDING status');
    }

    return await this.prisma.qualityChecklist.update({
      where: { id },
      data: {
        status: 'IN_REVIEW'
      },
      include: {
        items: true,
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Delete checklist
   */
  async deleteChecklist(id: string) {
    const checklist = await this.prisma.qualityChecklist.findUnique({
      where: { id }
    });

    if (!checklist) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    if (checklist.status === 'APPROVED') {
      throw new BadRequestException('Cannot delete approved checklists');
    }

    await this.prisma.qualityChecklist.delete({
      where: { id }
    });

    return { message: 'Quality checklist deleted successfully' };
  }

  /**
   * Get checklist for a job
   */
  async getChecklistByJobId(jobId: string) {
    return await this.prisma.qualityChecklist.findMany({
      where: { jobId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Submit review for a checklist (supervisor)
   */
  async reviewChecklist(id: string, dto: ReviewChecklistDto) {
    const checklist = await this.prisma.qualityChecklist.findUnique({
      where: { id }
    });

    if (!checklist) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    if (checklist.status !== 'IN_REVIEW') {
      throw new BadRequestException('Can only review checklists in IN_REVIEW status');
    }

    // Verify supervisor exists
    const supervisor = await this.prisma.worker.findUnique({
      where: { id: dto.supervisorId }
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with ID ${dto.supervisorId} not found`);
    }

    return await this.prisma.qualityChecklist.update({
      where: { id },
      data: {
        supervisorId: dto.supervisorId,
        reviewNotes: dto.reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        items: true,
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Approve checklist
   */
  async approveChecklist(id: string, supervisorId: string) {
    const checklist = await this.prisma.qualityChecklist.findUnique({
      where: { id }
    });

    if (!checklist) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    if (checklist.status !== 'IN_REVIEW') {
      throw new BadRequestException('Can only approve checklists in IN_REVIEW status');
    }

    return await this.prisma.qualityChecklist.update({
      where: { id },
      data: {
        status: 'APPROVED',
        supervisorId,
        reviewedAt: new Date()
      },
      include: {
        items: true,
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Reject checklist
   */
  async rejectChecklist(id: string, supervisorId: string, reason: string) {
    const checklist = await this.prisma.qualityChecklist.findUnique({
      where: { id }
    });

    if (!checklist) {
      throw new NotFoundException(`Quality checklist with ID ${id} not found`);
    }

    if (checklist.status !== 'IN_REVIEW') {
      throw new BadRequestException('Can only reject checklists in IN_REVIEW status');
    }

    return await this.prisma.qualityChecklist.update({
      where: { id },
      data: {
        status: 'REJECTED',
        supervisorId,
        reviewNotes: reason,
        reviewedAt: new Date()
      },
      include: {
        items: true,
        worker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * List all quality templates
   */
  async listTemplates(jobCategory?: string) {
    return await this.prisma.qualityTemplate.findMany({
      where: {
        active: true,
        ...(jobCategory && { jobCategory })
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Create quality template
   */
  async createTemplate(dto: CreateTemplateDto) {
    return await this.prisma.qualityTemplate.create({
      data: {
        name: dto.name,
        jobCategory: dto.jobCategory,
        items: dto.items,
        active: true
      }
    });
  }

  /**
   * Update quality template
   */
  async updateTemplate(id: string, dto: CreateTemplateDto) {
    const existing = await this.prisma.qualityTemplate.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException(`Quality template with ID ${id} not found`);
    }

    return await this.prisma.qualityTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        jobCategory: dto.jobCategory,
        items: dto.items
      }
    });
  }

  /**
   * Get worker quality scores
   */
  async getWorkerQualityScores(workerId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    const checklists = await this.prisma.qualityChecklist.findMany({
      where: {
        workerId,
        completedAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        items: true,
        job: {
          select: {
            id: true,
            title: true,
            site: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    const avgScore = checklists.length > 0
      ? checklists.reduce((sum, c) => sum + c.overallScore, 0) / checklists.length
      : 0;

    const statusCounts = checklists.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      worker,
      summary: {
        totalChecklists: checklists.length,
        averageScore: Math.round(avgScore * 10) / 10,
        statusBreakdown: statusCounts
      },
      checklists: checklists.map(c => ({
        id: c.id,
        jobId: c.jobId,
        jobTitle: c.job.title,
        siteName: c.job.site.name,
        overallScore: c.overallScore,
        status: c.status,
        completedAt: c.completedAt,
        reviewedAt: c.reviewedAt,
        itemCount: c.items.length,
        passedItems: c.items.filter(i => i.passed).length
      }))
    };
  }

  /**
   * Get quality trends
   */
  async getQualityTrends(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const checklists = await this.prisma.qualityChecklist.findMany({
      where: {
        completedAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    // Group by date
    const byDate = new Map();
    checklists.forEach(checklist => {
      const dateKey = checklist.completedAt.toISOString().split('T')[0];
      const existing = byDate.get(dateKey) || {
        date: checklist.completedAt,
        count: 0,
        totalScore: 0,
        statusCounts: {}
      };

      existing.count += 1;
      existing.totalScore += checklist.overallScore;
      existing.statusCounts[checklist.status] = (existing.statusCounts[checklist.status] || 0) + 1;

      byDate.set(dateKey, existing);
    });

    return Array.from(byDate.values()).map(item => ({
      date: item.date,
      checklistCount: item.count,
      averageScore: Math.round((item.totalScore / item.count) * 10) / 10,
      statusBreakdown: item.statusCounts
    }));
  }

  /**
   * Get common quality issues
   */
  async getCommonIssues(limit = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const items = await this.prisma.qualityCheckItem.findMany({
      where: {
        passed: false,
        checklist: {
          completedAt: {
            gte: thirtyDaysAgo
          }
        }
      },
      include: {
        checklist: {
          select: {
            completedAt: true
          }
        }
      }
    });

    // Group by category and description
    const issueMap = new Map();
    items.forEach(item => {
      const key = `${item.category}::${item.description}`;
      const existing = issueMap.get(key) || {
        category: item.category,
        description: item.description,
        count: 0,
        lastOccurrence: item.checklist.completedAt
      };

      existing.count += 1;
      if (item.checklist.completedAt > existing.lastOccurrence) {
        existing.lastOccurrence = item.checklist.completedAt;
      }

      issueMap.set(key, existing);
    });

    return Array.from(issueMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
