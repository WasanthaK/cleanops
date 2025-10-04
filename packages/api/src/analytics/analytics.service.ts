/**
 * Analytics service for manager dashboard data aggregation and real-time metrics.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overall dashboard metrics
   */
  async getDashboardMetrics(date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    try {
      // Get today's jobs
      const jobs = await this.prisma.job.findMany({
        where: {
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          signoff: true,
          assignments: {
            include: {
              worker: true
            }
          },
          attendances: true,
          payrollCalcs: true
        }
      });

      const activeJobs = jobs.filter(j => !j.signoff).length;
      const completedJobs = jobs.filter(j => j.signoff).length;

      // Get workers currently on site (clocked in but not clocked out)
      const workersOnSite = await this.prisma.attendance.groupBy({
        by: ['workerId'],
        where: {
          occurredAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          type: 'CLOCK_IN'
        },
        _count: true
      });

      // Calculate total hours worked today
      const totalHours = jobs.reduce((sum, job) => {
        const jobHours = job.payrollCalcs.reduce((s, p) => s + p.totalHours, 0);
        return sum + jobHours;
      }, 0);

      // Get weekly trends (last 7 days)
      const weekAgo = new Date(targetDate);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklySnapshots = await this.prisma.analyticsSnapshot.findMany({
        where: {
          date: {
            gte: weekAgo,
            lte: targetDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      const weeklyStats = weeklySnapshots.reduce(
        (acc, snapshot) => ({
          totalJobs: acc.totalJobs + snapshot.jobsCompleted,
          totalHours: acc.totalHours + snapshot.hoursWorked,
          totalRevenue: acc.totalRevenue + snapshot.revenueGenerated,
          avgEfficiency: acc.avgEfficiency + snapshot.efficiencyScore,
          count: acc.count + 1
        }),
        { totalJobs: 0, totalHours: 0, totalRevenue: 0, avgEfficiency: 0, count: 0 }
      );

      const avgJobDuration = weeklyStats.totalJobs > 0 
        ? weeklyStats.totalHours / weeklyStats.totalJobs 
        : 0;

      const jobCompletionRate = jobs.length > 0 
        ? (completedJobs / jobs.length) * 100 
        : 0;

      const workerEfficiency = weeklyStats.count > 0 
        ? weeklyStats.avgEfficiency / weeklyStats.count 
        : 0;

      return {
        todayStats: {
          activeJobs,
          completedJobs,
          workersOnSite: workersOnSite.length,
          totalHoursWorked: Math.round(totalHours * 10) / 10
        },
        weeklyTrends: {
          jobCompletionRate: Math.round(jobCompletionRate * 10) / 10,
          averageJobDuration: Math.round(avgJobDuration * 10) / 10,
          clientSatisfactionScore: 0, // TODO: Implement when quality system is added
          workerEfficiency: Math.round(workerEfficiency * 10) / 10
        },
        upcomingJobs: await this.getUpcomingJobs(5),
        alertsAndIssues: await this.getAlerts()
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard metrics', error);
      throw error;
    }
  }

  /**
   * Get upcoming jobs
   */
  async getUpcomingJobs(limit = 10) {
    const now = new Date();
    
    return await this.prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: now
        }
      },
      include: {
        site: true,
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
        signoff: true
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      take: limit
    });
  }

  /**
   * Get system alerts and issues
   */
  async getAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const incidents = await this.prisma.incident.findMany({
      where: {
        occurredAt: {
          gte: today
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        },
        worker: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        occurredAt: 'desc'
      },
      take: 10
    });

    return incidents.map(incident => ({
      type: 'incident',
      severity: 'high',
      message: incident.description,
      jobId: incident.jobId,
      jobTitle: incident.job.title,
      workerId: incident.workerId,
      workerName: incident.worker.name,
      timestamp: incident.occurredAt
    }));
  }

  /**
   * Get worker performance analytics
   */
  async getWorkerPerformance(workerId?: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const query = {
      date: {
        gte: start,
        lte: end
      },
      ...(workerId && { workerId })
    };

    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: query,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (!snapshots.length) {
      return workerId ? [] : { workers: [], summary: {} };
    }

    if (workerId) {
      // Return individual worker timeline
      return snapshots.map(s => ({
        date: s.date,
        jobsCompleted: s.jobsCompleted,
        hoursWorked: s.hoursWorked,
        overtimeHours: s.overtimeHours,
        efficiencyScore: s.efficiencyScore,
        qualityScore: s.qualityScore,
        revenueGenerated: s.revenueGenerated,
        laborCost: s.laborCost
      }));
    }

    // Return all workers summary
    const workerMap = new Map();
    
    snapshots.forEach(snapshot => {
      if (!snapshot.workerId) return;
      
      const existing = workerMap.get(snapshot.workerId) || {
        worker: snapshot.worker,
        totalJobs: 0,
        totalHours: 0,
        totalOvertimeHours: 0,
        avgEfficiency: 0,
        avgQuality: 0,
        totalRevenue: 0,
        totalCost: 0,
        count: 0
      };

      existing.totalJobs += snapshot.jobsCompleted;
      existing.totalHours += snapshot.hoursWorked;
      existing.totalOvertimeHours += snapshot.overtimeHours;
      existing.avgEfficiency += snapshot.efficiencyScore;
      existing.avgQuality += snapshot.qualityScore || 0;
      existing.totalRevenue += snapshot.revenueGenerated;
      existing.totalCost += snapshot.laborCost;
      existing.count += 1;

      workerMap.set(snapshot.workerId, existing);
    });

    const workers = Array.from(workerMap.entries()).map(([workerId, data]) => ({
      workerId,
      worker: data.worker,
      totalJobs: data.totalJobs,
      totalHours: Math.round(data.totalHours * 10) / 10,
      totalOvertimeHours: Math.round(data.totalOvertimeHours * 10) / 10,
      avgEfficiencyScore: Math.round((data.avgEfficiency / data.count) * 10) / 10,
      avgQualityScore: data.avgQuality > 0 ? Math.round((data.avgQuality / data.count) * 10) / 10 : null,
      totalRevenue: Math.round(data.totalRevenue * 100) / 100,
      totalCost: Math.round(data.totalCost * 100) / 100,
      profitMargin: data.totalRevenue > 0 
        ? Math.round(((data.totalRevenue - data.totalCost) / data.totalRevenue) * 100 * 10) / 10 
        : 0
    }));

    return {
      workers: workers.sort((a, b) => b.totalJobs - a.totalJobs),
      summary: {
        totalWorkers: workers.length,
        totalJobs: workers.reduce((s, w) => s + w.totalJobs, 0),
        totalHours: Math.round(workers.reduce((s, w) => s + w.totalHours, 0) * 10) / 10,
        avgEfficiency: workers.length > 0 
          ? Math.round(workers.reduce((s, w) => s + w.avgEfficiencyScore, 0) / workers.length * 10) / 10 
          : 0
      }
    };
  }

  /**
   * Get worker leaderboard
   */
  async getWorkerLeaderboard(metric: 'efficiency' | 'jobs' | 'hours' = 'efficiency', limit = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo
        },
        workerId: {
          not: null
        }
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    const workerStats = new Map();

    snapshots.forEach(snapshot => {
      if (!snapshot.workerId) return;

      const existing = workerStats.get(snapshot.workerId) || {
        worker: snapshot.worker,
        totalJobs: 0,
        totalHours: 0,
        totalEfficiency: 0,
        count: 0
      };

      existing.totalJobs += snapshot.jobsCompleted;
      existing.totalHours += snapshot.hoursWorked;
      existing.totalEfficiency += snapshot.efficiencyScore;
      existing.count += 1;

      workerStats.set(snapshot.workerId, existing);
    });

    const leaderboard = Array.from(workerStats.entries()).map(([workerId, data]) => ({
      workerId,
      workerName: data.worker?.name || 'Unknown',
      workerEmail: data.worker?.email,
      role: data.worker?.role,
      totalJobs: data.totalJobs,
      totalHours: Math.round(data.totalHours * 10) / 10,
      avgEfficiency: Math.round((data.totalEfficiency / data.count) * 10) / 10,
      score: metric === 'efficiency' 
        ? data.totalEfficiency / data.count
        : metric === 'jobs' 
          ? data.totalJobs 
          : data.totalHours
    }));

    return leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }

  /**
   * Get individual worker analytics
   */
  async getWorkerAnalytics(workerId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeline = await this.getWorkerPerformance(workerId, thirtyDaysAgo);

    const recentJobs = await this.prisma.jobAssignment.findMany({
      where: {
        workerId
      },
      include: {
        job: {
          include: {
            site: true,
            signoff: true
          }
        }
      },
      orderBy: {
        job: {
          scheduledDate: 'desc'
        }
      },
      take: 10
    });

    return {
      worker,
      timeline,
      recentJobs: recentJobs.map(assignment => ({
        jobId: assignment.job.id,
        title: assignment.job.title,
        siteName: assignment.job.site.name,
        scheduledDate: assignment.job.scheduledDate,
        completed: !!assignment.job.signoff,
        completedAt: assignment.job.signoff?.signedAt
      }))
    };
  }

  /**
   * Get job completion analytics
   */
  async getJobCompletionAnalytics(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const jobs = await this.prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        signoff: true,
        payrollCalcs: true
      }
    });

    const total = jobs.length;
    const completed = jobs.filter(j => j.signoff).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const totalHours = jobs.reduce((sum, job) => {
      return sum + job.payrollCalcs.reduce((s, p) => s + p.totalHours, 0);
    }, 0);

    const avgDuration = completed > 0 ? totalHours / completed : 0;

    // Group by date
    const byDate = new Map();
    jobs.forEach(job => {
      const dateKey = job.scheduledDate.toISOString().split('T')[0];
      const existing = byDate.get(dateKey) || { total: 0, completed: 0, date: job.scheduledDate };
      existing.total += 1;
      if (job.signoff) existing.completed += 1;
      byDate.set(dateKey, existing);
    });

    const timeline = Array.from(byDate.values()).map(item => ({
      date: item.date,
      total: item.total,
      completed: item.completed,
      completionRate: (item.completed / item.total) * 100
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      summary: {
        totalJobs: total,
        completedJobs: completed,
        completionRate: Math.round(completionRate * 10) / 10,
        averageDuration: Math.round(avgDuration * 10) / 10
      },
      timeline
    };
  }

  /**
   * Get job duration analysis
   */
  async getJobDurationAnalysis(groupBy: 'type' | 'site' = 'type') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const jobs = await this.prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: thirtyDaysAgo
        },
        signoff: {
          isNot: null
        }
      },
      include: {
        site: true,
        payrollCalcs: true,
        signoff: true
      }
    });

    const groups = new Map();

    jobs.forEach(job => {
      const key = groupBy === 'site' ? job.site.name : job.title.split(' ')[0]; // Simple type extraction
      const totalHours = job.payrollCalcs.reduce((sum, p) => sum + p.totalHours, 0);
      const duration = job.signoff 
        ? (job.signoff.signedAt.getTime() - job.scheduledDate.getTime()) / (1000 * 60 * 60)
        : 0;

      const existing = groups.get(key) || { 
        name: key, 
        count: 0, 
        totalHours: 0, 
        totalDuration: 0 
      };

      existing.count += 1;
      existing.totalHours += totalHours;
      existing.totalDuration += duration;

      groups.set(key, existing);
    });

    return Array.from(groups.values()).map(item => ({
      name: item.name,
      jobCount: item.count,
      avgHours: Math.round((item.totalHours / item.count) * 10) / 10,
      avgDuration: Math.round((item.totalDuration / item.count) * 10) / 10
    })).sort((a, b) => b.jobCount - a.jobCount);
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      }
    });

    const totalRevenue = snapshots.reduce((sum, s) => sum + s.revenueGenerated, 0);
    const totalCost = snapshots.reduce((sum, s) => sum + s.laborCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      period: {
        start,
        end
      }
    };
  }

  /**
   * Get financial trends
   */
  async getFinancialTrends(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    const byDate = new Map();
    
    snapshots.forEach(snapshot => {
      const dateKey = snapshot.date.toISOString().split('T')[0];
      const existing = byDate.get(dateKey) || { 
        date: snapshot.date, 
        revenue: 0, 
        cost: 0 
      };
      
      existing.revenue += snapshot.revenueGenerated;
      existing.cost += snapshot.laborCost;
      
      byDate.set(dateKey, existing);
    });

    return Array.from(byDate.values()).map(item => ({
      date: item.date,
      revenue: Math.round(item.revenue * 100) / 100,
      cost: Math.round(item.cost * 100) / 100,
      profit: Math.round((item.revenue - item.cost) * 100) / 100
    }));
  }

  /**
   * Update worker location
   */
  async updateWorkerLocation(
    workerId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    jobId?: string
  ) {
    return await this.prisma.workerLocation.create({
      data: {
        workerId,
        jobId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date()
      }
    });
  }

  /**
   * Get current worker locations
   */
  async getCurrentWorkerLocations() {
    // Get latest location for each worker in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const latestLocations = await this.prisma.$queryRaw`
      SELECT DISTINCT ON (worker_id) 
        id, worker_id, job_id, latitude, longitude, accuracy, timestamp
      FROM "WorkerLocation"
      WHERE timestamp >= ${thirtyMinutesAgo}
      ORDER BY worker_id, timestamp DESC
    `;

    // Fetch worker details
    const locations = latestLocations as any[];
    const workerIds = locations.map(l => l.worker_id);

    const workers = await this.prisma.worker.findMany({
      where: {
        id: {
          in: workerIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const workerMap = new Map(workers.map(w => [w.id, w]));

    return locations.map(loc => ({
      workerId: loc.worker_id,
      worker: workerMap.get(loc.worker_id),
      jobId: loc.job_id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      timestamp: loc.timestamp,
      lastUpdated: this.getTimeAgo(loc.timestamp)
    }));
  }

  /**
   * Get worker location history
   */
  async getWorkerLocationHistory(workerId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || new Date();

    return await this.prisma.workerLocation.findMany({
      where: {
        workerId,
        timestamp: {
          gte: start,
          lte: end
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
  }

  /**
   * Helper to format time ago
   */
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
