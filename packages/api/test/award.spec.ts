import { calculatePayrollLine, DayTypeEnum } from '../src/award/award.config.js';

describe('calculatePayrollLine', () => {
  it('computes overtime beyond ordinary hours', () => {
    const line = calculatePayrollLine({ dayType: DayTypeEnum.WEEKDAY, hoursWorked: 10, baseRate: 30 });
    expect(line.ordinaryHours).toBeCloseTo(7.6);
    expect(line.overtimeHours).toBeCloseTo(2.4);
    expect(line.total).toBeGreaterThan(300);
  });
});
