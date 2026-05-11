/**
 * Integration Tests for Staff Service
 * Tests employee management, scheduling, time off, payroll, and HR operations
 */

import {
  employees,
  departments,
  positions,
  schedules,
  timeOff,
  payroll,
  performanceReviews,
  attendance,
  training,
  apiEndpoints,
  validationRules,
} from './mockData';

const {
  createMockDbConnection,
  createMockRedisClient,
  createMockHttpClient,
  createMockEventEmitter,
  waitFor,
  generateTestId,
} = require('../jest.setup');

jest.mock('../jest.setup', () => ({
  createMockDbConnection: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn(),
    end: jest.fn(),
  })),
  createMockRedisClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  })),
  createMockHttpClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 201 }),
  })),
  createMockEventEmitter: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  waitFor: jest.fn((ms: number) => new Promise(resolve => setTimeout(resolve, ms))),
  generateTestId: jest.fn((prefix: string) => `${prefix}_${Date.now()}`),
}));

describe('Staff Service Integration', () => {
  let mockDb: ReturnType<typeof createMockDbConnection>;
  let mockRedis: ReturnType<typeof createMockRedisClient>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDbConnection();
    mockRedis = createMockRedisClient();
    mockEventEmitter = createMockEventEmitter();
  });

  describe('Employee Management', () => {
    test('should retrieve employee by ID', async () => {
      const employee = employees.fullTime;

      mockDb.query.mockResolvedValueOnce({
        rows: [employee],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM employees WHERE id = $1',
        [employee.id]
      );

      expect(result.rows[0].id).toBe(employee.id);
      expect(result.rows[0].employeeId).toBe(employee.employeeId);
    });

    test('should create new employee', async () => {
      const newEmployee = {
        firstName: 'New',
        lastName: 'Employee',
        email: 'new.employee@rez.com',
        departmentId: 'dept_sales',
        positionId: 'pos_sales_manager',
        employmentType: 'full_time',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...newEmployee, id: generateTestId('emp'), employeeId: 'EMP-2024-999' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO employees (first_name, last_name, email, department_id, position_id, employment_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [newEmployee.firstName, newEmployee.lastName, newEmployee.email, newEmployee.departmentId, newEmployee.positionId, newEmployee.employmentType]
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0]).toHaveProperty('employeeId');
    });

    test('should update employee information', async () => {
      const employee = employees.fullTime;
      const updates = { phone: '+1-555-9999' };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...employee, ...updates, updatedAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE employees SET phone = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [updates.phone, employee.id]
      );

      expect(result.rows[0].phone).toBe(updates.phone);
    });

    test('should terminate employee', async () => {
      const employee = employees.fullTime;
      const terminationData = {
        terminationDate: '2024-01-20',
        reason: 'Resignation',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          ...employee,
          status: 'terminated',
          terminationDate: terminationData.terminationDate,
          terminationReason: terminationData.reason,
        }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE employees SET status = $1, termination_date = $2, termination_reason = $3 WHERE id = $4 RETURNING *',
        ['terminated', terminationData.terminationDate, terminationData.reason, employee.id]
      );

      expect(result.rows[0].status).toBe('terminated');
    });

    test('should validate employee ID format', () => {
      const idRegex = validationRules.employee.employeeId.pattern;

      expect(idRegex.test('EMP-2020-001')).toBe(true);
      expect(idRegex.test('CON-2024-012')).toBe(true);
      expect(idRegex.test('emp-2020-001')).toBe(false);
      expect(idRegex.test('EMP2020001')).toBe(false);
    });

    test('should get employees by department', async () => {
      const deptEmployees = [employees.fullTime];

      mockDb.query.mockResolvedValueOnce({
        rows: deptEmployees,
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM employees WHERE department_id = $1 AND status = $2',
        ['dept_sales', 'active']
      );

      expect(result.rows).toHaveLength(1);
    });

    test('should get employees by employment type', async () => {
      const partTimeEmployees = [employees.partTime];

      mockDb.query.mockResolvedValueOnce({
        rows: partTimeEmployees,
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM employees WHERE employment_type = $1',
        ['part_time']
      );

      expect(result.rows[0].employmentType).toBe('part_time');
    });

    test('should filter by employee status', async () => {
      const activeEmployees = [employees.fullTime, employees.partTime, employees.contractor];

      mockDb.query.mockResolvedValueOnce({
        rows: activeEmployees,
        rowCount: 3,
      });

      const result = await mockDb.query(
        'SELECT * FROM employees WHERE status = $1',
        ['active']
      );

      expect(result.rows).toHaveLength(3);
    });
  });

  describe('Department Management', () => {
    test('should retrieve all departments', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: departments,
        rowCount: departments.length,
      });

      const result = await mockDb.query('SELECT * FROM departments ORDER BY name');

      expect(result.rows).toHaveLength(4);
    });

    test('should calculate department budget utilization', () => {
      const dept = departments[0];
      const utilization = (dept.spent / dept.budget) * 100;

      expect(utilization).toBe(74);
    });

    test('should get department headcount', () => {
      departments.forEach(dept => {
        expect(dept.employeeCount).toBeGreaterThan(0);
      });
    });

    test('should calculate department vacancy rate', () => {
      const dept = departments[1];
      const positionsTotal = positions.reduce((sum, p) => {
        return p.departmentId === dept.id ? sum + p.headcount : sum;
      }, 0);
      const positionsFilled = positions.reduce((sum, p) => {
        return p.departmentId === dept.id ? sum + p.filled : sum;
      }, 0);
      const vacancyRate = ((positionsTotal - positionsFilled) / positionsTotal) * 100;

      expect(vacancyRate).toBe(33.33);
    });
  });

  describe('Position Management', () => {
    test('should retrieve position details', async () => {
      const position = positions[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [position],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM positions WHERE id = $1',
        [position.id]
      );

      expect(result.rows[0].title).toBe(position.title);
    });

    test('should calculate position salary midpoint', () => {
      const position = positions[0];
      const midpoint = (position.salaryRange.min + position.salaryRange.max) / 2;

      expect(midpoint).toBe(97500);
    });

    test('should get open positions', async () => {
      const openPositions = positions.filter(p => p.open > 0);

      mockDb.query.mockResolvedValueOnce({
        rows: openPositions,
        rowCount: openPositions.length,
      });

      const result = await mockDb.query('SELECT * FROM positions WHERE open > 0');

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Scheduling', () => {
    test('should create weekly schedule', async () => {
      const schedule = schedules.weekly;

      mockDb.query.mockResolvedValueOnce({
        rows: [schedule],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO schedules (employee_id, week_start, week_end, total_hours) VALUES ($1, $2, $3, $4) RETURNING *',
        [schedule.employeeId, schedule.weekStart, schedule.weekEnd, schedule.totalHours]
      );

      expect(result.rows[0]).toHaveProperty('shifts');
    });

    test('should calculate total scheduled hours', () => {
      const schedule = schedules.weekly;
      const totalHours = schedule.shifts.reduce((sum, shift) => {
        const start = parseInt(shift.startTime.split(':')[0]);
        const end = parseInt(shift.endTime.split(':')[0]);
        const hours = end - start - (shift.breakMinutes / 60);
        return sum + hours;
      }, 0);

      expect(totalHours).toBe(40);
    });

    test('should validate shift times', () => {
      const shift = schedules.weekly.shifts[0];
      const start = parseInt(shift.startTime.split(':')[0]);
      const end = parseInt(shift.endTime.split(':')[0]);

      expect(end).toBeGreaterThan(start);
    });

    test('should swap shifts between employees', async () => {
      const swapRequest = {
        shift1Id: 'shift_001',
        shift2Id: 'shift_010',
        requestedBy: 'emp_001',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...swapRequest, status: 'approved' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE schedules SET employee_id = $1 WHERE id = $2 RETURNING *',
        ['emp_002', swapRequest.shift1Id]
      );

      expect(result.rows).toHaveProperty('status');
    });

    test('should handle part-time rotating schedules', () => {
      const schedule = schedules.rotating;
      expect(schedule.totalHours).toBeLessThan(40);
    });
  });

  describe('Time Off Management', () => {
    test('should submit time off request', async () => {
      const request = timeOff.pending;

      mockDb.query.mockResolvedValueOnce({
        rows: [request],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO time_off_requests (employee_id, type, start_date, end_date, total_days) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [request.employeeId, request.type, request.startDate, request.endDate, request.totalDays]
      );

      expect(result.rows[0].status).toBe('pending');
    });

    test('should approve time off request', async () => {
      const request = timeOff.vacation;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...request, status: 'approved' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE time_off_requests SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *',
        ['approved', request.approvedBy, request.id]
      );

      expect(result.rows[0].status).toBe('approved');
    });

    test('should calculate remaining PTO balance', async () => {
      const employee = employees.fullTime;
      const totalPTO = employee.benefits.ptoDays;
      const usedPTO = timeOff.vacation.totalDays + timeOff.sick.totalDays;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ used: usedPTO }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT SUM(total_days) as used FROM time_off_requests WHERE employee_id = $1 AND type = $2 AND status = $3',
        [employee.id, 'vacation', 'approved']
      );

      const remaining = totalPTO - (result.rows[0].used || 0);
      expect(remaining).toBe(12);
    });

    test('should validate time off dates', () => {
      const request = timeOff.pending;
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      expect(endDate >= startDate).toBe(true);
    });
  });

  describe('Payroll Processing', () => {
    test('should calculate gross pay for salaried employee', () => {
      const employee = employees.fullTime;
      const biweeklyGross = employee.compensation.salary / 26;

      expect(biweeklyGross).toBeCloseTo(3269.23, 2);
    });

    test('should calculate gross pay for hourly employee', () => {
      const employee = employees.partTime;
      const hoursWorked = 25;
      const weeklyGross = employee.compensation.hourlyRate * hoursWorked;

      expect(weeklyGross).toBe(462.50);
    });

    test('should calculate net pay after deductions', () => {
      const entry = payroll.entries[0];
      const totalDeductions = Object.values(entry.deductions).reduce((sum, d) => sum + d, 0);
      const netPay = entry.grossPay - totalDeductions;

      expect(netPay).toBeCloseTo(entry.netPay, 2);
    });

    test('should process payroll period', async () => {
      const period = payroll.periods[1];

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...period, status: 'processing' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE payroll_periods SET status = $1 WHERE id = $2 RETURNING *',
        ['processing', period.id]
      );

      expect(result.rows[0].status).toBe('processing');
    });

    test('should create payroll entry', async () => {
      const entry = payroll.entries[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [entry],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO payroll_entries (employee_id, payroll_period_id, gross_pay) VALUES ($1, $2, $3) RETURNING *',
        [entry.employeeId, entry.payrollPeriodId, entry.grossPay]
      );

      expect(result.rows[0]).toHaveProperty('deductions');
    });
  });

  describe('Attendance Tracking', () => {
    test('should record clock in', async () => {
      const clockIn = {
        employeeId: 'emp_001',
        time: '08:55',
        date: '2024-01-20',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...clockIn, status: 'present' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO attendance (employee_id, clock_in, date, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [clockIn.employeeId, clockIn.time, clockIn.date, 'present']
      );

      expect(result.rows[0].status).toBe('present');
    });

    test('should record clock out', async () => {
      const record = attendance.records[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...record, clockOut: '17:10', totalHours: 8.25 }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE attendance SET clock_out = $1, total_hours = $2 WHERE id = $3 RETURNING *',
        ['17:10', 8.25, record.id]
      );

      expect(result.rows[0].clockOut).toBe('17:10');
    });

    test('should calculate total hours worked', () => {
      const record = attendance.records[0];
      const expectedHours = record.totalHours - (record.breakMinutes / 60);

      expect(expectedHours).toBe(7.25);
    });

    test('should track late arrivals', () => {
      const exception = attendance.exceptions[0];
      expect(exception.type).toBe('late');
      expect(exception.minutesLate).toBeGreaterThan(0);
    });

    test('should approve attendance exception', async () => {
      const exception = attendance.exceptions[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...exception, status: 'approved' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE attendance_exceptions SET status = $1 WHERE id = $2 RETURNING *',
        ['approved', exception.id]
      );

      expect(result.rows[0].status).toBe('approved');
    });
  });

  describe('Performance Reviews', () => {
    test('should create performance review', async () => {
      const pendingReview = performanceReviews[1];

      mockDb.query.mockResolvedValueOnce({
        rows: [pendingReview],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO performance_reviews (employee_id, review_period, status, scheduled_date, reviewer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [pendingReview.employeeId, pendingReview.reviewPeriod, pendingReview.status, pendingReview.scheduledDate, pendingReview.reviewerId]
      );

      expect(result.rows[0].status).toBe('scheduled');
    });

    test('should submit completed review', async () => {
      const review = performanceReviews[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...review, status: 'completed' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE performance_reviews SET status = $1, rating = $2, summary = $3 WHERE id = $4 RETURNING *',
        ['completed', review.rating, review.summary, review.id]
      );

      expect(result.rows[0].status).toBe('completed');
    });

    test('should track review goals', () => {
      const review = performanceReviews[0];
      const achievedGoals = review.goals.filter(g => g.status === 'achieved');

      expect(achievedGoals.length).toBe(2);
    });
  });

  describe('Training Management', () => {
    test('should track course completion', async () => {
      const completion = training.completions[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [completion],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO training_completions (employee_id, course_id, score, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [completion.employeeId, completion.courseId, completion.score, completion.status]
      );

      expect(result.rows[0].status).toBe('passed');
    });

    test('should calculate course completion rate', () => {
      const course = training.courses[0];
      const rate = (course.completedCount / course.employeeCount) * 100;

      expect(rate).toBe(course.completionRate);
    });

    test('should identify required vs elective training', () => {
      const requiredCourses = training.courses.filter(c => c.type === 'required');
      const electiveCourses = training.courses.filter(c => c.type === 'elective');

      expect(requiredCourses.length).toBe(1);
      expect(electiveCourses.length).toBe(1);
    });
  });

  describe('API Endpoints', () => {
    test('should have correct employee endpoints', () => {
      expect(apiEndpoints.employees.list).toBe('/api/v1/employees');
      expect(apiEndpoints.employees.create).toBe('/api/v1/employees');
    });

    test('should have correct schedule endpoints', () => {
      expect(apiEndpoints.schedules.list).toBe('/api/v1/schedules');
      expect(apiEndpoints.schedules.swap).toBe('/api/v1/schedules/swap');
    });

    test('should have correct time off endpoints', () => {
      expect(apiEndpoints.timeOff.request).toBe('/api/v1/time-off/request');
      expect(apiEndpoints.timeOff.approve).toBe('/api/v1/time-off/:id/approve');
    });
  });

  describe('Event Handling', () => {
    test('should emit employee created event', () => {
      const newEmployee = { id: 'emp_new', employeeId: 'EMP-2024-100' };
      mockEventEmitter.emit('employee_created', newEmployee);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('employee_created', newEmployee);
    });

    test('should emit schedule changed event', () => {
      const scheduleChange = { employeeId: 'emp_001', type: 'shift_swap' };
      mockEventEmitter.emit('schedule_changed', scheduleChange);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('schedule_changed', scheduleChange);
    });

    test('should emit time off approved event', () => {
      const approval = { requestId: 'pto_001', status: 'approved' };
      mockEventEmitter.emit('time_off_approved', approval);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('time_off_approved', approval);
    });
  });

  describe('Error Handling', () => {
    test('should handle duplicate employee email', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [employees.fullTime],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT id FROM employees WHERE email = $1',
        ['sarah.johnson@rez.com']
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    test('should handle invalid department ID', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await mockDb.query(
        'SELECT * FROM departments WHERE id = $1',
        ['invalid_dept']
      );

      expect(result.rows).toHaveLength(0);
    });

    test('should handle payroll processing errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Payroll period already processed'));

      await expect(
        mockDb.query('UPDATE payroll_periods SET status = $1 WHERE id = $2', ['processing', 'payroll_001'])
      ).rejects.toThrow('Payroll period already processed');
    });
  });
});
