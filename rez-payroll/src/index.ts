/**
 * ReZ Payroll Module
 * Comprehensive payroll management system for salary calculations,
 * attendance tracking, statutory compliance, and disbursement records.
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: Date;
  panCard?: string;
  aadharCard?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  salary: SalaryComponents;
  statutory: StatutoryConfig;
}

export interface SalaryComponents {
  basicSalary: number;
  hra: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
}

export interface StatutoryConfig {
  pfEnabled: boolean;
  esiEnabled: boolean;
  tdsEnabled: boolean;
  professionalTax: number;
  pfAccountNumber?: string;
  uanNumber?: string;
}

export interface AttendanceRecord {
  employeeId: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  workHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  leaveType?: 'sick' | 'casual' | 'earned' | 'unpaid';
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  processedAt: Date;
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  status: 'draft' | 'approved' | 'disbursed' | 'failed';
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  payrollRunId: string;
  month: number;
  year: number;
  earnings: {
    basicSalary: number;
    hra: number;
    allowances: Record<string, number>;
    overtimePay: number;
    grossSalary: number;
  };
  deductions: {
    pf: number;
    esi: number;
    tds: number;
    professionalTax: number;
    otherDeductions: Record<string, number>;
    totalDeductions: number;
  };
  netSalary: number;
  disbursement?: DisbursementRecord;
}

export interface DisbursementRecord {
  id: string;
  salarySlipId: string;
  employeeId: string;
  amount: number;
  bankAccount: string;
  ifscCode: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  failureReason?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const PAYROLL_CONFIG = {
  WORKING_DAYS_PER_MONTH: 26,
  STANDARD_WORK_HOURS: 8,
  OVERTIME_MULTIPLIER: 1.5,
  OVERTIME_THRESHOLD_HOURS: 8,

  // Statutory rates (India)
  PF_RATE: 0.12, // 12% of basic salary
  PFEmployerRate: 0.12, // 12% employer contribution
  ESI_RATE: 0.0075, // 0.75% employee contribution
  ESI_EMPLOYER_RATE: 0.0325, // 3.25% employer contribution
  TDS_THRESHOLD: 300000, // Annual income threshold
  TDS_RATES: [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 600000, rate: 0.05 },
    { min: 600001, max: 900000, rate: 0.10 },
    { min: 900001, max: 1200000, rate: 0.15 },
    { min: 1200001, max: 1500000, rate: 0.20 },
    { min: 1500001, max: Infinity, rate: 0.30 },
  ],
  PROFESSIONAL_TAX: 200, // Monthly professional tax

  // HRA calculation
  HRA_RATE: 0.4, // 40% of basic salary
} as const;

// ============================================================================
// Salary Calculation Module
// ============================================================================

export class SalaryCalculator {
  /**
   * Calculate gross salary from components
   */
  static calculateGrossSalary(employee: Employee): number {
    const { basicSalary, hra, allowances } = employee.salary;

    const allowancesTotal = Object.values(allowances).reduce((sum, val) => sum + val, 0);

    return basicSalary + hra + allowancesTotal;
  }

  /**
   * Calculate prorated salary based on working days
   */
  static calculateProratedSalary(
    employee: Employee,
    actualWorkingDays: number,
    totalWorkingDays: number = PAYROLL_CONFIG.WORKING_DAYS_PER_MONTH
  ): number {
    const grossSalary = this.calculateGrossSalary(employee);
    return (grossSalary / totalWorkingDays) * actualWorkingDays;
  }

  /**
   * Calculate overtime pay
   */
  static calculateOvertimePay(employee: Employee, overtimeHours: number): number {
    const hourlyRate = employee.salary.basicSalary / (PAYROLL_CONFIG.WORKING_DAYS_PER_MONTH * PAYROLL_CONFIG.STANDARD_WORK_HOURS);
    return overtimeHours * hourlyRate * PAYROLL_CONFIG.OVERTIME_MULTIPLIER;
  }

  /**
   * Generate complete salary slip for a month
   */
  static generateSalarySlip(
    employee: Employee,
    attendanceRecords: AttendanceRecord[],
    month: number,
    year: number
  ): SalarySlip {
    const records = attendanceRecords.filter(r => r.employeeId === employee.id);
    const totalOvertime = records.reduce((sum, r) => sum + r.overtimeHours, 0);
    const presentDays = records.filter(r => r.status === 'present' || r.status === 'half-day').length;
    const halfDays = records.filter(r => r.status === 'half-day').length;

    const { basicSalary, hra, allowances, deductions } = employee.salary;
    const overtimePay = this.calculateOvertimePay(employee, totalOvertime);

    // Prorate for half days
    const effectiveBasic = basicSalary * ((presentDays - halfDays * 0.5 + halfDays) / PAYROLL_CONFIG.WORKING_DAYS_PER_MONTH);
    const effectiveHra = hra * ((presentDays - halfDays * 0.5 + halfDays) / PAYROLL_CONFIG.WORKING_DAYS_PER_MONTH);

    const earningsAllowances = Object.entries(allowances).reduce((sum, [, val]) => sum + val, 0);
    const effectiveAllowances = earningsAllowances * ((presentDays - halfDays * 0.5 + halfDays) / PAYROLL_CONFIG.WORKING_DAYS_PER_MONTH);

    const grossSalary = effectiveBasic + effectiveHra + effectiveAllowances + overtimePay;

    // Calculate deductions
    const statutoryDeductions = this.calculateStatutoryDeductions(employee, grossSalary);
    const otherDeductions = Object.entries(deductions).reduce((sum, [, val]) => sum + val, 0);

    const totalDeductions = statutoryDeductions.pf + statutoryDeductions.esi +
      statutoryDeductions.tds + statutoryDeductions.professionalTax + otherDeductions;

    const netSalary = grossSalary - totalDeductions;

    return {
      id: `SLIP-${employee.id}-${month}-${year}`,
      employeeId: employee.id,
      payrollRunId: `PAYRUN-${month}-${year}`,
      month,
      year,
      earnings: {
        basicSalary: Math.round(effectiveBasic * 100) / 100,
        hra: Math.round(effectiveHra * 100) / 100,
        allowances: allowances,
        overtimePay: Math.round(overtimePay * 100) / 100,
        grossSalary: Math.round(grossSalary * 100) / 100,
      },
      deductions: {
        pf: Math.round(statutoryDeductions.pf * 100) / 100,
        esi: Math.round(statutoryDeductions.esi * 100) / 100,
        tds: Math.round(statutoryDeductions.tds * 100) / 100,
        professionalTax: Math.round(statutoryDeductions.professionalTax * 100) / 100,
        otherDeductions: deductions,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
      },
      netSalary: Math.round(netSalary * 100) / 100,
    };
  }

  private static calculateStatutoryDeductions(employee: Employee, grossSalary: number) {
    const { statutory } = employee;
    const pf = statutory.pfEnabled ? grossSalary * PAYROLL_CONFIG.PF_RATE : 0;
    const esi = statutory.esiEnabled ? grossSalary * PAYROLL_CONFIG.ESI_RATE : 0;
    const professionalTax = statutory.professionalTax;
    const tds = statutory.tdsEnabled ? this.calculateTDS(employee, grossSalary) : 0;

    return { pf, esi, tds, professionalTax };
  }

  private static calculateTDS(employee: Employee, monthlyGross: number): number {
    // Calculate annualized income
    const annualizedIncome = monthlyGross * 12;
    let tax = 0;

    for (const bracket of PAYROLL_CONFIG.TDS_RATES) {
      if (annualizedIncome > bracket.min && annualizedIncome <= bracket.max) {
        tax = (annualizedIncome - bracket.min) * bracket.rate;
        break;
      }
    }

    // Apply rebate under 87A if applicable
    if (annualizedIncome <= 500000) {
      tax = 0;
    }

    return tax / 12; // Monthly TDS
  }
}

// ============================================================================
// Attendance Tracking Module
// ============================================================================

export class AttendanceTracker {
  private records: Map<string, AttendanceRecord[]> = new Map();

  /**
   * Clock in an employee
   */
  clockIn(employeeId: string, date: Date = new Date()): AttendanceRecord {
    const key = this.getMonthKey(date);
    const existingRecords = this.records.get(key) || [];
    const todayRecord = existingRecords.find(r => r.employeeId === employeeId && this.isSameDay(r.date, date));

    if (todayRecord && todayRecord.clockIn) {
      throw new Error(`Employee ${employeeId} already clocked in today`);
    }

    const newRecord: AttendanceRecord = {
      employeeId,
      date,
      clockIn: date,
      workHours: 0,
      overtimeHours: 0,
      status: 'present',
    };

    if (todayRecord) {
      const index = existingRecords.indexOf(todayRecord);
      existingRecords[index] = newRecord;
    } else {
      existingRecords.push(newRecord);
    }

    this.records.set(key, existingRecords);
    return newRecord;
  }

  /**
   * Clock out an employee
   */
  clockOut(employeeId: string, date: Date = new Date()): AttendanceRecord {
    const key = this.getMonthKey(date);
    const existingRecords = this.records.get(key) || [];
    const todayRecord = existingRecords.find(r => r.employeeId === employeeId && this.isSameDay(r.date, date));

    if (!todayRecord || !todayRecord.clockIn) {
      throw new Error(`Employee ${employeeId} has not clocked in today`);
    }

    if (todayRecord.clockOut) {
      throw new Error(`Employee ${employeeId} already clocked out today`);
    }

    const clockOutTime = date;
    const workHours = this.calculateWorkHours(todayRecord.clockIn, clockOutTime);

    todayRecord.clockOut = clockOutTime;
    todayRecord.workHours = workHours;

    // Calculate overtime
    if (workHours > PAYROLL_CONFIG.OVERTIME_THRESHOLD_HOURS) {
      todayRecord.overtimeHours = workHours - PAYROLL_CONFIG.OVERTIME_THRESHOLD_HOURS;
    }

    const index = existingRecords.indexOf(todayRecord);
    existingRecords[index] = todayRecord;
    this.records.set(key, existingRecords);

    return todayRecord;
  }

  /**
   * Mark employee as absent
   */
  markAbsent(employeeId: string, date: Date): AttendanceRecord {
    const key = this.getMonthKey(date);
    const existingRecords = this.records.get(key) || [];

    const newRecord: AttendanceRecord = {
      employeeId,
      date,
      workHours: 0,
      overtimeHours: 0,
      status: 'absent',
    };

    existingRecords.push(newRecord);
    this.records.set(key, existingRecords);

    return newRecord;
  }

  /**
   * Apply leave for an employee
   */
  applyLeave(employeeId: string, date: Date, leaveType: AttendanceRecord['leaveType']): AttendanceRecord {
    const key = this.getMonthKey(date);
    const existingRecords = this.records.get(key) || [];

    const newRecord: AttendanceRecord = {
      employeeId,
      date,
      workHours: 0,
      overtimeHours: 0,
      status: 'leave',
      leaveType,
    };

    existingRecords.push(newRecord);
    this.records.set(key, existingRecords);

    return newRecord;
  }

  /**
   * Get attendance records for a month
   */
  getMonthlyAttendance(employeeId: string, month: number, year: number): AttendanceRecord[] {
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    const records = this.records.get(key) || [];
    return records.filter(r => r.employeeId === employeeId);
  }

  /**
   * Get attendance summary
   */
  getMonthlySummary(employeeId: string, month: number, year: number): AttendanceSummary {
    const records = this.getMonthlyAttendance(employeeId, month, year);

    const presentDays = records.filter(r => r.status === 'present').length;
    const halfDays = records.filter(r => r.status === 'half-day').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    const totalWorkHours = records.reduce((sum, r) => sum + r.workHours, 0);
    const totalOvertimeHours = records.reduce((sum, r) => sum + r.overtimeHours, 0);

    return {
      employeeId,
      month,
      year,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      totalWorkHours,
      totalOvertimeHours,
      attendancePercentage: (presentDays / PAYROLL_CONFIG.WORKING_DAYS_PER_MONTH) * 100,
    };
  }

  /**
   * Bulk import attendance records
   */
  bulkImport(records: AttendanceRecord[]): number {
    let imported = 0;
    for (const record of records) {
      const key = this.getMonthKey(record.date);
      const existingRecords = this.records.get(key) || [];

      const existingIndex = existingRecords.findIndex(
        r => r.employeeId === record.employeeId && this.isSameDay(r.date, record.date)
      );

      if (existingIndex >= 0) {
        existingRecords[existingIndex] = record;
      } else {
        existingRecords.push(record);
      }

      this.records.set(key, existingRecords);
      imported++;
    }
    return imported;
  }

  private calculateWorkHours(clockIn: Date, clockOut: Date): number {
    const diff = clockOut.getTime() - clockIn.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}

export interface AttendanceSummary {
  employeeId: string;
  month: number;
  year: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  attendancePercentage: number;
}

// ============================================================================
// Statutory Compliance Module
// ============================================================================

export class StatutoryCompliance {
  /**
   * Validate PF compliance
   */
  static validatePFCompliance(employee: Employee, monthlyGross: number): ComplianceResult {
    const result: ComplianceResult = {
      type: 'PF',
      compliant: true,
      details: [],
      warnings: [],
      errors: [],
    };

    if (!employee.statutory.pfEnabled) {
      result.details.push('PF not applicable for this employee');
      return result;
    }

    if (!employee.statutory.uanNumber) {
      result.errors.push('UAN number is required for PF');
      result.compliant = false;
    }

    if (!employee.statutory.pfAccountNumber) {
      result.errors.push('PF account number is required');
      result.compliant = false;
    }

    const pfDeduction = monthlyGross * PAYROLL_CONFIG.PF_RATE;
    if (pfDeduction < 1800) {
      result.warnings.push(`PF contribution (${pfDeduction}) is below minimum threshold`);
    }

    result.details.push(`Employee PF contribution: ${pfDeduction}`);
    result.details.push(`Employer PF contribution: ${pfDeduction}`);

    return result;
  }

  /**
   * Validate ESI compliance
   */
  static validateESICompliance(employee: Employee, monthlyGross: number): ComplianceResult {
    const result: ComplianceResult = {
      type: 'ESI',
      compliant: true,
      details: [],
      warnings: [],
      errors: [],
    };

    if (!employee.statutory.esiEnabled) {
      result.details.push('ESI not applicable for this employee');
      return result;
    }

    const ESI_THRESHOLD = 21000; // Monthly salary threshold for ESI

    if (monthlyGross > ESI_THRESHOLD) {
      result.warnings.push(`Employee salary exceeds ESI threshold of ${ESI_THRESHOLD}`);
    }

    const esiDeduction = monthlyGross * PAYROLL_CONFIG.ESI_RATE;
    const esiEmployer = monthlyGross * PAYROLL_CONFIG.ESI_EMPLOYER_RATE;

    result.details.push(`Employee ESI contribution: ${esiDeduction}`);
    result.details.push(`Employer ESI contribution: ${esiEmployer}`);

    return result;
  }

  /**
   * Validate TDS compliance
   */
  static validateTDSCompliance(employee: Employee, annualIncome: number): ComplianceResult {
    const result: ComplianceResult = {
      type: 'TDS',
      compliant: true,
      details: [],
      warnings: [],
      errors: [],
    };

    if (!employee.statutory.tdsEnabled) {
      result.details.push('TDS not applicable for this employee');
      return result;
    }

    if (!employee.panCard) {
      result.errors.push('PAN card is required for TDS deduction');
      result.compliant = false;
    }

    let tax = 0;
    let applicableRate = 0;

    for (const bracket of PAYROLL_CONFIG.TDS_RATES) {
      if (annualIncome > bracket.min && annualIncome <= bracket.max) {
        tax = (annualIncome - bracket.min) * bracket.rate;
        applicableRate = bracket.rate;
        break;
      }
    }

    if (tax === 0 && annualIncome > PAYROLL_CONFIG.TDS_THRESHOLD) {
      result.warnings.push('Tax calculation returned 0 - check for rebate eligibility');
    }

    result.details.push(`Annual income: ${annualIncome}`);
    result.details.push(`Applicable tax rate: ${applicableRate * 100}%`);
    result.details.push(`Annual tax: ${tax}`);
    result.details.push(`PAN: ${employee.panCard ? 'Available' : 'Missing'}`);

    return result;
  }

  /**
   * Generate compliance report for all employees
   */
  static generateComplianceReport(employees: Employee[], salarySlips: SalarySlip[]): ComplianceReport {
    const pfResults: ComplianceResult[] = [];
    const esiResults: ComplianceResult[] = [];
    const tdsResults: ComplianceResult[] = [];

    for (const employee of employees) {
      const slip = salarySlips.find(s => s.employeeId === employee.id);

      if (slip) {
        pfResults.push(this.validatePFCompliance(employee, slip.earnings.grossSalary));
        esiResults.push(this.validateESICompliance(employee, slip.earnings.grossSalary));
        tdsResults.push(this.validateTDSCompliance(employee, slip.earnings.grossSalary * 12));
      }
    }

    return {
      generatedAt: new Date(),
      totalEmployees: employees.length,
      pfCompliance: {
        total: pfResults.length,
        compliant: pfResults.filter(r => r.compliant).length,
        nonCompliant: pfResults.filter(r => !r.compliant).length,
        results: pfResults,
      },
      esiCompliance: {
        total: esiResults.length,
        compliant: esiResults.filter(r => r.compliant).length,
        nonCompliant: esiResults.filter(r => !r.compliant).length,
        results: esiResults,
      },
      tdsCompliance: {
        total: tdsResults.length,
        compliant: tdsResults.filter(r => r.compliant).length,
        nonCompliant: tdsResults.filter(r => !r.compliant).length,
        results: tdsResults,
      },
      overallCompliance:
        pfResults.filter(r => r.compliant).length +
        esiResults.filter(r => r.compliant).length +
        tdsResults.filter(r => r.compliant).length,
      totalChecks:
        pfResults.length + esiResults.length + tdsResults.length,
    };
  }

  /**
   * Calculate employer statutory liability
   */
  static calculateEmployerLiability(employees: Employee[], salarySlips: SalarySlip[]): EmployerLiability {
    let totalPfEmployer = 0;
    let totalEsiEmployer = 0;
    let totalProfessionalTax = 0;

    for (const employee of employees) {
      const slip = salarySlips.find(s => s.employeeId === employee.id);

      if (slip) {
        if (employee.statutory.pfEnabled) {
          totalPfEmployer += slip.earnings.grossSalary * PAYROLL_CONFIG.PFEmployerRate;
        }
        if (employee.statutory.esiEnabled) {
          totalEsiEmployer += slip.earnings.grossSalary * PAYROLL_CONFIG.ESI_EMPLOYER_RATE;
        }
        totalProfessionalTax += employee.statutory.professionalTax;
      }
    }

    return {
      pfEmployerContribution: Math.round(totalPfEmployer * 100) / 100,
      esiEmployerContribution: Math.round(totalEsiEmployer * 100) / 100,
      professionalTax: Math.round(totalProfessionalTax * 100) / 100,
      totalLiability: Math.round((totalPfEmployer + totalEsiEmployer + totalProfessionalTax) * 100) / 100,
    };
  }
}

export interface ComplianceResult {
  type: string;
  compliant: boolean;
  details: string[];
  warnings: string[];
  errors: string[];
}

export interface ComplianceReport {
  generatedAt: Date;
  totalEmployees: number;
  pfCompliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    results: ComplianceResult[];
  };
  esiCompliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    results: ComplianceResult[];
  };
  tdsCompliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    results: ComplianceResult[];
  };
  overallCompliance: number;
  totalChecks: number;
}

export interface EmployerLiability {
  pfEmployerContribution: number;
  esiEmployerContribution: number;
  professionalTax: number;
  totalLiability: number;
}

// ============================================================================
// Disbursement Module
// ============================================================================

export class DisbursementManager {
  private disbursements: Map<string, DisbursementRecord> = new Map();

  /**
   * Create disbursement record
   */
  createDisbursement(
    salarySlip: SalarySlip,
    employee: Employee
  ): DisbursementRecord {
    const disbursement: DisbursementRecord = {
      id: `DIS-${Date.now()}-${salarySlip.employeeId}`,
      salarySlipId: salarySlip.id,
      employeeId: salarySlip.employeeId,
      amount: salarySlip.netSalary,
      bankAccount: employee.bankAccount.accountNumber,
      ifscCode: employee.bankAccount.ifscCode,
      status: 'pending',
    };

    this.disbursements.set(disbursement.id, disbursement);
    return disbursement;
  }

  /**
   * Process disbursement (simulate bank transfer)
   */
  async processDisbursement(disbursementId: string): Promise<DisbursementRecord> {
    const disbursement = this.disbursements.get(disbursementId);

    if (!disbursement) {
      throw new Error(`Disbursement ${disbursementId} not found`);
    }

    if (disbursement.status !== 'pending') {
      throw new Error(`Disbursement ${disbursementId} is not in pending status`);
    }

    disbursement.status = 'processing';
    this.disbursements.set(disbursementId, disbursement);

    // Simulate bank processing
    await this.simulateBankTransfer(disbursement);

    disbursement.status = 'completed';
    disbursement.processedAt = new Date();
    disbursement.transactionId = `TXN-${Date.now()}`;

    this.disbursements.set(disbursementId, disbursement);
    return disbursement;
  }

  /**
   * Bulk process disbursements
   */
  async bulkProcessDisbursements(disbursementIds: string[]): Promise<BulkDisbursementResult> {
    const results: DisbursementRecord[] = [];
    const failures: { id: string; error: string }[] = [];

    for (const id of disbursementIds) {
      try {
        const result = await this.processDisbursement(id);
        results.push(result);
      } catch (error) {
        failures.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        const disbursement = this.disbursements.get(id);
        if (disbursement) {
          disbursement.status = 'failed';
          disbursement.failureReason = error instanceof Error ? error.message : 'Unknown error';
          this.disbursements.set(id, disbursement);
        }
      }
    }

    return {
      total: disbursementIds.length,
      successful: results.length,
      failed: failures.length,
      results,
      failures,
    };
  }

  /**
   * Get disbursement by ID
   */
  getDisbursement(disbursementId: string): DisbursementRecord | undefined {
    return this.disbursements.get(disbursementId);
  }

  /**
   * Get disbursements by employee
   */
  getEmployeeDisbursements(employeeId: string): DisbursementRecord[] {
    return Array.from(this.disbursements.values()).filter(
      d => d.employeeId === employeeId
    );
  }

  /**
   * Get disbursement summary for a month
   */
  getMonthlySummary(month: number, year: number): DisbursementSummary {
    const allDisbursements = Array.from(this.disbursements.values());
    const monthDisbursements = allDisbursements.filter(d => {
      const date = d.processedAt || new Date();
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const pending = monthDisbursements.filter(d => d.status === 'pending').length;
    const processing = monthDisbursements.filter(d => d.status === 'processing').length;
    const completed = monthDisbursements.filter(d => d.status === 'completed').length;
    const failed = monthDisbursements.filter(d => d.status === 'failed').length;

    const totalAmount = monthDisbursements.reduce((sum, d) => sum + d.amount, 0);
    const processedAmount = monthDisbursements
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      month,
      year,
      totalDisbursements: monthDisbursements.length,
      pending,
      processing,
      completed,
      failed,
      totalAmount,
      processedAmount,
      pendingAmount: totalAmount - processedAmount,
    };
  }

  /**
   * Retry failed disbursement
   */
  async retryDisbursement(disbursementId: string): Promise<DisbursementRecord> {
    const disbursement = this.disbursements.get(disbursementId);

    if (!disbursement) {
      throw new Error(`Disbursement ${disbursementId} not found`);
    }

    if (disbursement.status !== 'failed') {
      throw new Error(`Disbursement ${disbursementId} is not in failed status`);
    }

    return this.processDisbursement(disbursementId);
  }

  private async simulateBankTransfer(disbursement: DisbursementRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          disbursement.status = 'failed';
          disbursement.failureReason = 'Bank transfer failed - invalid account details';
          reject(new Error(disbursement.failureReason));
        }
      }, 100);
    });
  }
}

export interface BulkDisbursementResult {
  total: number;
  successful: number;
  failed: number;
  results: DisbursementRecord[];
  failures: { id: string; error: string }[];
}

export interface DisbursementSummary {
  month: number;
  year: number;
  totalDisbursements: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalAmount: number;
  processedAmount: number;
  pendingAmount: number;
}

// ============================================================================
// Payroll Processing Engine
// ============================================================================

export class PayrollEngine {
  private attendanceTracker: AttendanceTracker;
  private disbursementManager: DisbursementManager;
  private payrollRuns: Map<string, PayrollRun> = new Map();
  private salarySlips: Map<string, SalarySlip> = new Map();

  constructor() {
    this.attendanceTracker = new AttendanceTracker();
    this.disbursementManager = new DisbursementManager();
  }

  /**
   * Run payroll for a month
   */
  async runPayroll(
    employees: Employee[],
    month: number,
    year: number
  ): Promise<PayrollRun> {
    const payrollRunId = `PAYRUN-${month}-${year}`;

    // Check if payroll already exists
    if (this.payrollRuns.has(payrollRunId)) {
      throw new Error(`Payroll for ${month}/${year} already exists`);
    }

    const salarySlips: SalarySlip[] = [];
    let totalGrossSalary = 0;
    let totalDeductions = 0;
    let totalNetSalary = 0;

    for (const employee of employees) {
      const attendanceRecords = this.attendanceTracker.getMonthlyAttendance(
        employee.id,
        month,
        year
      );

      const salarySlip = SalaryCalculator.generateSalarySlip(
        employee,
        attendanceRecords,
        month,
        year
      );

      salarySlips.push(salarySlip);
      this.salarySlips.set(salarySlip.id, salarySlip);

      totalGrossSalary += salarySlip.earnings.grossSalary;
      totalDeductions += salarySlip.deductions.totalDeductions;
      totalNetSalary += salarySlip.netSalary;

      // Create disbursement record
      this.disbursementManager.createDisbursement(salarySlip, employee);
    }

    const payrollRun: PayrollRun = {
      id: payrollRunId,
      month,
      year,
      processedAt: new Date(),
      totalEmployees: employees.length,
      totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetSalary: Math.round(totalNetSalary * 100) / 100,
      status: 'draft',
    };

    this.payrollRuns.set(payrollRunId, payrollRun);
    return payrollRun;
  }

  /**
   * Approve payroll run
   */
  approvePayroll(payrollRunId: string): PayrollRun {
    const payrollRun = this.payrollRuns.get(payrollRunId);

    if (!payrollRun) {
      throw new Error(`Payroll run ${payrollRunId} not found`);
    }

    if (payrollRun.status !== 'draft') {
      throw new Error(`Payroll run ${payrollRunId} is not in draft status`);
    }

    payrollRun.status = 'approved';
    this.payrollRuns.set(payrollRunId, payrollRun);
    return payrollRun;
  }

  /**
   * Disburse salary for a payroll run
   */
  async disbursePayroll(payrollRunId: string): Promise<BulkDisbursementResult> {
    const payrollRun = this.payrollRuns.get(payrollRunId);

    if (!payrollRun) {
      throw new Error(`Payroll run ${payrollRunId} not found`);
    }

    if (payrollRun.status !== 'approved') {
      throw new Error(`Payroll run ${payrollRunId} is not approved`);
    }

    const slipIds = Array.from(this.salarySlips.values())
      .filter(s => s.payrollRunId === payrollRunId)
      .map(s => s.id);

    const disbursements = Array.from(this.salarySlips.values())
      .filter(s => s.payrollRunId === payrollRunId)
      .map(s => this.disbursementManager.getEmployeeDisbursements(s.employeeId))
      .flat()
      .filter(d => d.salarySlipId && slipIds.includes(d.salarySlipId))
      .map(d => d.id);

    const result = await this.disbursementManager.bulkProcessDisbursements(disbursements);

    // Update payroll run status
    if (result.failed === 0) {
      payrollRun.status = 'disbursed';
    } else if (result.successful > 0) {
      payrollRun.status = 'approved'; // Partial disbursement
    } else {
      payrollRun.status = 'failed';
    }

    this.payrollRuns.set(payrollRunId, payrollRun);
    return result;
  }

  /**
   * Get payroll run details
   */
  getPayrollRun(payrollRunId: string): PayrollRun | undefined {
    return this.payrollRuns.get(payrollRunId);
  }

  /**
   * Get salary slip
   */
  getSalarySlip(slipId: string): SalarySlip | undefined {
    return this.salarySlips.get(slipId);
  }

  /**
   * Get all salary slips for an employee
   */
  getEmployeeSalarySlips(employeeId: string): SalarySlip[] {
    return Array.from(this.salarySlips.values()).filter(
      s => s.employeeId === employeeId
    );
  }

  /**
   * Get attendance tracker instance
   */
  getAttendanceTracker(): AttendanceTracker {
    return this.attendanceTracker;
  }

  /**
   * Get disbursement manager instance
   */
  getDisbursementManager(): DisbursementManager {
    return this.disbursementManager;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPayrollEngine(): PayrollEngine {
  return new PayrollEngine();
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getFinancialYear(month: number, year: number): { start: number; end: number } {
  if (month >= 4) {
    return { start: year, end: year + 1 };
  }
  return { start: year - 1, end: year };
}
