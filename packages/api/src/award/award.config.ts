/**
 * Award configuration for stubbed Australian cleaning services calculations.
 * Contains thresholds for ordinary time, overtime, and weekend loadings.
 */
export enum DayTypeEnum {
  WEEKDAY = 'weekday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
  PUBLIC_HOLIDAY = 'publicHoliday'
}

export type DayType = `${DayTypeEnum}`;

export interface AwardRule {
  dayType: DayType;
  ordinaryHours: number;
  overtimeMultiplier: number;
  weekendLoading?: number;
}

export const AWARD_RULES: AwardRule[] = [
  { dayType: DayTypeEnum.WEEKDAY, ordinaryHours: 7.6, overtimeMultiplier: 1.5 },
  { dayType: DayTypeEnum.SATURDAY, ordinaryHours: 7.6, overtimeMultiplier: 1.75, weekendLoading: 0.25 },
  { dayType: DayTypeEnum.SUNDAY, ordinaryHours: 7.6, overtimeMultiplier: 2, weekendLoading: 0.5 },
  { dayType: DayTypeEnum.PUBLIC_HOLIDAY, ordinaryHours: 7.6, overtimeMultiplier: 2.5, weekendLoading: 1 }
];

export interface PayrollBreakdownLine {
  day: string;
  hours: number;
  ordinaryHours: number;
  overtimeHours: number;
  baseRate: number;
  overtimeRate: number;
  loadingRate: number;
  total: number;
}

export interface PayrollDraftResult {
  workerId: string;
  jobId: string;
  lines: PayrollBreakdownLine[];
  totalHours: number;
  totalPay: number;
}

export interface PayrollInput {
  dayType: DayType;
  hoursWorked: number;
  baseRate: number;
}

export function calculatePayrollLine(input: PayrollInput): PayrollBreakdownLine {
  const rule = AWARD_RULES.find((r) => r.dayType === input.dayType) ?? AWARD_RULES[0];
  const ordinaryHours = Math.min(input.hoursWorked, rule.ordinaryHours);
  const overtimeHours = Math.max(0, input.hoursWorked - rule.ordinaryHours);
  const overtimeRate = input.baseRate * rule.overtimeMultiplier;
  const loadingRate = rule.weekendLoading ? input.baseRate * rule.weekendLoading : 0;
  const total = ordinaryHours * input.baseRate + overtimeHours * overtimeRate + ordinaryHours * loadingRate;

  return {
    day: input.dayType,
    hours: input.hoursWorked,
    ordinaryHours,
    overtimeHours,
    baseRate: input.baseRate,
    overtimeRate,
    loadingRate,
    total
  };
}
