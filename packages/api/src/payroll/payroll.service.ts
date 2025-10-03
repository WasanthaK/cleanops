/**
 * Payroll service computes draft award calculations.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { calculatePayrollLine, PayrollDraftResult } from '../award/award.config.js';
import { PayrollDraftDto } from './dto/payroll.dto.js';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async draft(jobId: string, workerId: string, dto: PayrollDraftDto): Promise<PayrollDraftResult> {
    const lines = dto.days.map((day) =>
      calculatePayrollLine({
        dayType: day.dayType,
        hoursWorked: day.hours,
        baseRate: day.baseRate
      })
    );

    const totalHours = lines.reduce((sum, line) => sum + line.hours, 0);
    const totalPay = lines.reduce((sum, line) => sum + line.total, 0);

    await this.prisma.payrollCalc.create({
      data: {
        jobId,
        workerId,
        totalHours,
        totalPay,
        timezone: dto.timezone,
        breakdown: lines
      }
    });

    return {
      workerId,
      jobId,
      lines,
      totalHours,
      totalPay
    };
  }
}
