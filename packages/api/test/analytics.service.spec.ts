/**
 * Tests for Analytics service
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { AnalyticsService } from '../src/analytics/analytics.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    job: {
      findMany: jest.fn()
    },
    attendance: {
      groupBy: jest.fn()
    },
    analyticsSnapshot: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    workerLocation: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    worker: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    incident: {
      findMany: jest.fn()
    },
    jobAssignment: {
      findMany: jest.fn()
    },
    $queryRaw: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService }
      ]
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics for today', async () => {
      const today = new Date();
      const mockJobs = [
        {
          id: 'job-1',
          scheduledDate: today,
          signoff: { signedAt: today },
          assignments: [{ worker: { id: 'worker-1', name: 'John' } }],
          attendances: [{ type: 'CLOCK_IN' }],
          payrollCalcs: [{ totalHours: 8.0 }]
        },
        {
          id: 'job-2',
          scheduledDate: today,
          signoff: null,
          assignments: [{ worker: { id: 'worker-2', name: 'Jane' } }],
          attendances: [{ type: 'CLOCK_IN' }],
          payrollCalcs: [{ totalHours: 4.0 }]
        }
      ];

      const mockSnapshots = [
        {
          date: today,
          jobsCompleted: 10,
          hoursWorked: 80,
          revenueGenerated: 2000,
          efficiencyScore: 85
        }
      ];

      mockPrismaService.job.findMany.mockResolvedValueOnce(mockJobs);
      mockPrismaService.attendance.groupBy.mockResolvedValue([
        { workerId: 'worker-1', _count: 1 },
        { workerId: 'worker-2', _count: 1 }
      ]);
      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);
      mockPrismaService.job.findMany.mockResolvedValueOnce([]); // upcoming jobs
      mockPrismaService.incident.findMany.mockResolvedValue([]); // alerts

      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('todayStats');
      expect(result.todayStats.activeJobs).toBe(1);
      expect(result.todayStats.completedJobs).toBe(1);
      expect(result.todayStats.workersOnSite).toBe(2);
      expect(result).toHaveProperty('weeklyTrends');
      expect(result).toHaveProperty('upcomingJobs');
      expect(result).toHaveProperty('alertsAndIssues');
    });

    it('should handle empty data gracefully', async () => {
      mockPrismaService.job.findMany.mockResolvedValue([]);
      mockPrismaService.attendance.groupBy.mockResolvedValue([]);
      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue([]);
      mockPrismaService.incident.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics();

      expect(result.todayStats.activeJobs).toBe(0);
      expect(result.todayStats.completedJobs).toBe(0);
      expect(result.todayStats.workersOnSite).toBe(0);
    });
  });

  describe('getWorkerPerformance', () => {
    it('should return all workers performance summary', async () => {
      const mockSnapshots = [
        {
          workerId: 'worker-1',
          worker: { id: 'worker-1', name: 'John', email: 'john@example.com', role: 'cleaner' },
          date: new Date(),
          jobsCompleted: 5,
          hoursWorked: 40,
          overtimeHours: 2,
          efficiencyScore: 90,
          qualityScore: 85,
          revenueGenerated: 1000,
          laborCost: 600
        },
        {
          workerId: 'worker-2',
          worker: { id: 'worker-2', name: 'Jane', email: 'jane@example.com', role: 'cleaner' },
          date: new Date(),
          jobsCompleted: 3,
          hoursWorked: 24,
          overtimeHours: 0,
          efficiencyScore: 85,
          qualityScore: 90,
          revenueGenerated: 600,
          laborCost: 360
        }
      ];

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getWorkerPerformance();

      expect(result).toHaveProperty('workers');
      expect(result).toHaveProperty('summary');
      expect(result.workers).toHaveLength(2);
      expect(result.summary.totalWorkers).toBe(2);
      expect(result.summary.totalJobs).toBe(8);
    });

    it('should return individual worker timeline', async () => {
      const mockSnapshots = [
        {
          date: new Date('2025-01-01'),
          jobsCompleted: 2,
          hoursWorked: 16,
          overtimeHours: 0,
          efficiencyScore: 90,
          qualityScore: 85,
          revenueGenerated: 400,
          laborCost: 240
        }
      ];

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getWorkerPerformance('worker-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('jobsCompleted', 2);
      expect(result[0]).toHaveProperty('efficiencyScore', 90);
    });

    it('should return empty data when no snapshots exist', async () => {
      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue([]);

      const result = await service.getWorkerPerformance();

      expect(result).toEqual({ workers: [], summary: {} });
    });
  });

  describe('getWorkerAnalytics', () => {
    it('should return individual worker analytics', async () => {
      const mockWorker = {
        id: 'worker-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'cleaner',
        createdAt: new Date()
      };

      const mockSnapshots = [
        {
          date: new Date(),
          jobsCompleted: 2,
          hoursWorked: 16,
          overtimeHours: 0,
          efficiencyScore: 90,
          qualityScore: 85,
          revenueGenerated: 400,
          laborCost: 240
        }
      ];

      const mockAssignments = [
        {
          job: {
            id: 'job-1',
            title: 'Office Cleaning',
            scheduledDate: new Date(),
            site: { name: 'ABC Office' },
            signoff: { signedAt: new Date() }
          }
        }
      ];

      mockPrismaService.worker.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);
      mockPrismaService.jobAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await service.getWorkerAnalytics('worker-1');

      expect(result).toHaveProperty('worker');
      expect(result.worker.id).toBe('worker-1');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('recentJobs');
      expect(result.recentJobs).toHaveLength(1);
    });

    it('should throw NotFoundException when worker does not exist', async () => {
      mockPrismaService.worker.findUnique.mockResolvedValue(null);

      await expect(service.getWorkerAnalytics('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkerLeaderboard', () => {
    it('should return leaderboard sorted by efficiency', async () => {
      const mockSnapshots = [
        {
          workerId: 'worker-1',
          worker: { id: 'worker-1', name: 'John', email: 'john@example.com', role: 'cleaner' },
          jobsCompleted: 5,
          hoursWorked: 40,
          efficiencyScore: 95
        },
        {
          workerId: 'worker-2',
          worker: { id: 'worker-2', name: 'Jane', email: 'jane@example.com', role: 'cleaner' },
          jobsCompleted: 3,
          hoursWorked: 24,
          efficiencyScore: 85
        }
      ];

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getWorkerLeaderboard('efficiency', 10);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].workerId).toBe('worker-1');
      expect(result[1].rank).toBe(2);
      expect(result[1].workerId).toBe('worker-2');
    });

    it('should sort by jobs when metric is "jobs"', async () => {
      const mockSnapshots = [
        {
          workerId: 'worker-1',
          worker: { id: 'worker-1', name: 'John', email: 'john@example.com', role: 'cleaner' },
          jobsCompleted: 10,
          hoursWorked: 80,
          efficiencyScore: 85
        },
        {
          workerId: 'worker-2',
          worker: { id: 'worker-2', name: 'Jane', email: 'jane@example.com', role: 'cleaner' },
          jobsCompleted: 15,
          hoursWorked: 120,
          efficiencyScore: 90
        }
      ];

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getWorkerLeaderboard('jobs', 10);

      expect(result[0].workerId).toBe('worker-2');
      expect(result[0].totalJobs).toBe(15);
    });

    it('should limit results to specified number', async () => {
      const mockSnapshots = Array.from({ length: 20 }, (_, i) => ({
        workerId: `worker-${i}`,
        worker: { id: `worker-${i}`, name: `Worker ${i}`, email: `worker${i}@example.com`, role: 'cleaner' },
        jobsCompleted: 5,
        hoursWorked: 40,
        efficiencyScore: 80 + i
      }));

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getWorkerLeaderboard('efficiency', 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('getJobCompletionAnalytics', () => {
    it('should return job completion summary and timeline', async () => {
      const today = new Date();
      const mockJobs = [
        {
          id: 'job-1',
          scheduledDate: today,
          signoff: { signedAt: today },
          payrollCalcs: [{ totalHours: 8 }]
        },
        {
          id: 'job-2',
          scheduledDate: today,
          signoff: null,
          payrollCalcs: [{ totalHours: 4 }]
        }
      ];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await service.getJobCompletionAnalytics();

      expect(result).toHaveProperty('summary');
      expect(result.summary.totalJobs).toBe(2);
      expect(result.summary.completedJobs).toBe(1);
      expect(result.summary.completionRate).toBe(50);
      expect(result).toHaveProperty('timeline');
      expect(result.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('getFinancialSummary', () => {
    it('should calculate financial metrics correctly', async () => {
      const mockSnapshots = [
        {
          revenueGenerated: 1000,
          laborCost: 600
        },
        {
          revenueGenerated: 500,
          laborCost: 300
        }
      ];

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getFinancialSummary();

      expect(result.totalRevenue).toBe(1500);
      expect(result.totalCost).toBe(900);
      expect(result.totalProfit).toBe(600);
      expect(result.profitMargin).toBe(40);
    });

    it('should handle zero revenue scenario', async () => {
      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue([]);

      const result = await service.getFinancialSummary();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.totalProfit).toBe(0);
      expect(result.profitMargin).toBe(0);
    });
  });

  describe('updateWorkerLocation', () => {
    it('should create a new location record', async () => {
      const mockLocation = {
        id: 'loc-1',
        workerId: 'worker-1',
        jobId: 'job-1',
        latitude: -33.8688,
        longitude: 151.2093,
        accuracy: 10,
        timestamp: new Date()
      };

      mockPrismaService.workerLocation.create.mockResolvedValue(mockLocation);

      const result = await service.updateWorkerLocation(
        'worker-1',
        -33.8688,
        151.2093,
        10,
        'job-1'
      );

      expect(result).toEqual(mockLocation);
      expect(mockPrismaService.workerLocation.create).toHaveBeenCalledWith({
        data: {
          workerId: 'worker-1',
          jobId: 'job-1',
          latitude: -33.8688,
          longitude: 151.2093,
          accuracy: 10,
          timestamp: expect.any(Date)
        }
      });
    });

    it('should create location without jobId', async () => {
      const mockLocation = {
        id: 'loc-1',
        workerId: 'worker-1',
        jobId: undefined,
        latitude: -33.8688,
        longitude: 151.2093,
        accuracy: 10,
        timestamp: new Date()
      };

      mockPrismaService.workerLocation.create.mockResolvedValue(mockLocation);

      const result = await service.updateWorkerLocation(
        'worker-1',
        -33.8688,
        151.2093,
        10
      );

      expect(result.jobId).toBeUndefined();
    });
  });

  describe('getCurrentWorkerLocations', () => {
    it('should return latest locations for each worker', async () => {
      const mockLocations = [
        {
          id: 'loc-1',
          worker_id: 'worker-1',
          job_id: 'job-1',
          latitude: -33.8688,
          longitude: 151.2093,
          accuracy: 10,
          timestamp: new Date()
        }
      ];

      const mockWorkers = [
        {
          id: 'worker-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'cleaner'
        }
      ];

      mockPrismaService.$queryRaw.mockResolvedValue(mockLocations);
      mockPrismaService.worker.findMany.mockResolvedValue(mockWorkers);

      const result = await service.getCurrentWorkerLocations();

      expect(result).toHaveLength(1);
      expect(result[0].workerId).toBe('worker-1');
      expect(result[0].worker).toBeDefined();
      expect(result[0]).toHaveProperty('lastUpdated');
    });

    it('should handle no locations', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.worker.findMany.mockResolvedValue([]);

      const result = await service.getCurrentWorkerLocations();

      expect(result).toHaveLength(0);
    });
  });

  describe('getWorkerLocationHistory', () => {
    it('should return location history for worker', async () => {
      const mockHistory = [
        {
          id: 'loc-1',
          workerId: 'worker-1',
          jobId: 'job-1',
          latitude: -33.8688,
          longitude: 151.2093,
          accuracy: 10,
          timestamp: new Date(),
          job: {
            id: 'job-1',
            title: 'Office Cleaning',
            site: { name: 'ABC Office', address: '123 Main St' }
          }
        }
      ];

      mockPrismaService.workerLocation.findMany.mockResolvedValue(mockHistory);

      const result = await service.getWorkerLocationHistory('worker-1');

      expect(result).toHaveLength(1);
      expect(result[0].workerId).toBe('worker-1');
      expect(result[0].job).toBeDefined();
    });

    it('should filter by date range', async () => {
      mockPrismaService.workerLocation.findMany.mockResolvedValue([]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await service.getWorkerLocationHistory('worker-1', startDate, endDate);

      expect(mockPrismaService.workerLocation.findMany).toHaveBeenCalledWith({
        where: {
          workerId: 'worker-1',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              site: {
                select: {
                  name: true,
                  address: true
                }
              }
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
    });
  });

  describe('getJobDurationAnalysis', () => {
    it('should group by type', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Office Cleaning ABC',
          scheduledDate: new Date(),
          site: { name: 'ABC Office' },
          payrollCalcs: [{ totalHours: 8 }],
          signoff: { signedAt: new Date() }
        },
        {
          id: 'job-2',
          title: 'Office Cleaning XYZ',
          scheduledDate: new Date(),
          site: { name: 'XYZ Office' },
          payrollCalcs: [{ totalHours: 6 }],
          signoff: { signedAt: new Date() }
        }
      ];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await service.getJobDurationAnalysis('type');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('jobCount');
      expect(result[0]).toHaveProperty('avgHours');
    });
  });

  describe('getFinancialTrends', () => {
    it('should return daily financial trends', async () => {
      const mockSnapshots = [
        {
          date: new Date('2025-01-01'),
          revenueGenerated: 1000,
          laborCost: 600
        },
        {
          date: new Date('2025-01-02'),
          revenueGenerated: 1200,
          laborCost: 700
        }
      ];

      mockPrismaService.analyticsSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await service.getFinancialTrends();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('revenue');
      expect(result[0]).toHaveProperty('cost');
      expect(result[0]).toHaveProperty('profit');
    });
  });
});
