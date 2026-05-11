/**
 * Mock Data for Staff Service Integration Tests
 * Provides realistic test data for employee management, scheduling, and HR operations
 */

export const employees = {
  fullTime: {
    id: 'emp_001',
    employeeId: 'EMP-2020-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@rez.com',
    phone: '+1-555-0101',
    dateOfBirth: '1988-05-15',
    hireDate: '2020-03-15',
    status: 'active',
    department: {
      id: 'dept_sales',
      name: 'Sales',
    },
    position: {
      id: 'pos_sales_manager',
      title: 'Sales Manager',
      level: 'L4',
    },
    managerId: 'emp_010',
    workLocation: {
      type: 'hybrid',
      primaryLocation: 'NYC Office',
    },
    employmentType: 'full_time',
    compensation: {
      salary: 85000,
      currency: 'USD',
      payFrequency: 'bi_weekly',
    },
    benefits: {
      health: true,
      dental: true,
      vision: true,
      retirement401k: true,
      ptoDays: 20,
    },
    emergencyContact: {
      name: 'Michael Johnson',
      relationship: 'Spouse',
      phone: '+1-555-0102',
    },
    taxInfo: {
      ssn: '***-**-1234',
      filingStatus: 'single',
    },
    createdAt: '2020-03-15T09:00:00Z',
    updatedAt: '2024-01-15T14:00:00Z',
  },
  partTime: {
    id: 'emp_002',
    employeeId: 'EMP-2023-045',
    firstName: 'James',
    lastName: 'Williams',
    email: 'james.williams@rez.com',
    phone: '+1-555-0202',
    hireDate: '2023-06-01',
    status: 'active',
    department: {
      id: 'dept_warehouse',
      name: 'Warehouse Operations',
    },
    position: {
      id: 'pos_warehouse_associate',
      title: 'Warehouse Associate',
      level: 'L1',
    },
    workLocation: {
      type: 'on_site',
      location: 'Distribution Center',
    },
    employmentType: 'part_time',
    compensation: {
      hourlyRate: 18.50,
      currency: 'USD',
      payFrequency: 'weekly',
    },
    schedule: {
      hoursPerWeek: 25,
      shiftPreference: 'morning',
    },
    createdAt: '2023-06-01T08:00:00Z',
  },
  contractor: {
    id: 'emp_003',
    employeeId: 'CON-2024-012',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@contractor.com',
    hireDate: '2024-01-15',
    status: 'active',
    department: {
      id: 'dept_engineering',
      name: 'Engineering',
    },
    position: {
      id: 'pos_frontend_dev',
      title: 'Frontend Developer',
      level: 'L3',
    },
    employmentType: 'contractor',
    compensation: {
      hourlyRate: 75.00,
      currency: 'USD',
      contractEndDate: '2024-06-30',
    },
    createdAt: '2024-01-15T10:00:00Z',
  },
  terminated: {
    id: 'emp_004',
    employeeId: 'EMP-2019-078',
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@rez.com',
    status: 'terminated',
    hireDate: '2019-08-01',
    terminationDate: '2024-01-10',
    terminationReason: 'Resignation',
  },
};

export const departments = [
  {
    id: 'dept_engineering',
    name: 'Engineering',
    code: 'ENG',
    headId: 'emp_010',
    parentId: null,
    budget: 2500000,
    spent: 1850000,
    employeeCount: 45,
  },
  {
    id: 'dept_sales',
    name: 'Sales',
    code: 'SALES',
    headId: 'emp_010',
    parentId: null,
    budget: 1800000,
    spent: 1420000,
    employeeCount: 32,
  },
  {
    id: 'dept_warehouse',
    name: 'Warehouse Operations',
    code: 'WARE',
    headId: 'emp_015',
    parentId: null,
    budget: 800000,
    spent: 650000,
    employeeCount: 28,
  },
  {
    id: 'dept_hr',
    name: 'Human Resources',
    code: 'HR',
    headId: 'emp_020',
    parentId: null,
    budget: 400000,
    spent: 280000,
    employeeCount: 8,
  },
];

export const positions = [
  {
    id: 'pos_sales_manager',
    title: 'Sales Manager',
    level: 'L4',
    departmentId: 'dept_sales',
    salaryRange: {
      min: 75000,
      max: 120000,
      currency: 'USD',
    },
    headcount: 3,
    filled: 2,
    open: 1,
  },
  {
    id: 'pos_software_engineer',
    title: 'Software Engineer',
    level: 'L3',
    departmentId: 'dept_engineering',
    salaryRange: {
      min: 90000,
      max: 140000,
      currency: 'USD',
    },
    headcount: 25,
    filled: 23,
    open: 2,
  },
];

export const schedules = {
  weekly: {
    employeeId: 'emp_001',
    weekStart: '2024-01-15',
    weekEnd: '2024-01-21',
    shifts: [
      {
        id: 'shift_001',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
        type: 'regular',
        breakMinutes: 60,
        location: 'NYC Office',
      },
      {
        id: 'shift_002',
        date: '2024-01-16',
        startTime: '09:00',
        endTime: '17:00',
        type: 'regular',
        breakMinutes: 60,
        location: 'NYC Office',
      },
      {
        id: 'shift_003',
        date: '2024-01-17',
        startTime: '09:00',
        endTime: '17:00',
        type: 'regular',
        breakMinutes: 60,
        location: 'Remote',
      },
      {
        id: 'shift_004',
        date: '2024-01-18',
        startTime: '09:00',
        endTime: '17:00',
        type: 'regular',
        breakMinutes: 60,
        location: 'NYC Office',
      },
      {
        id: 'shift_005',
        date: '2024-01-19',
        startTime: '09:00',
        endTime: '17:00',
        type: 'regular',
        breakMinutes: 60,
        location: 'NYC Office',
      },
    ],
    totalHours: 40,
    overtimeHours: 0,
  },
  rotating: {
    employeeId: 'emp_002',
    weekStart: '2024-01-15',
    weekEnd: '2024-01-21',
    shifts: [
      {
        id: 'shift_010',
        date: '2024-01-15',
        startTime: '06:00',
        endTime: '14:00',
        type: 'morning',
        breakMinutes: 30,
        location: 'Distribution Center',
      },
      {
        id: 'shift_011',
        date: '2024-01-16',
        startTime: '06:00',
        endTime: '14:00',
        type: 'morning',
        breakMinutes: 30,
        location: 'Distribution Center',
      },
    ],
    totalHours: 16,
    overtimeHours: 0,
  },
};

export const timeOff = {
  vacation: {
    id: 'pto_001',
    employeeId: 'emp_001',
    type: 'vacation',
    startDate: '2024-02-15',
    endDate: '2024-02-22',
    totalDays: 6,
    status: 'approved',
    approvedBy: 'emp_010',
    approvedAt: '2024-01-20T10:00:00Z',
  },
  sick: {
    id: 'pto_002',
    employeeId: 'emp_002',
    type: 'sick',
    startDate: '2024-01-18',
    endDate: '2024-01-19',
    totalDays: 2,
    status: 'approved',
    approvedBy: 'emp_015',
    approvedAt: '2024-01-18T08:30:00Z',
  },
  pending: {
    id: 'pto_003',
    employeeId: 'emp_001',
    type: 'personal',
    startDate: '2024-03-01',
    endDate: '2024-03-01',
    totalDays: 1,
    status: 'pending',
    submittedAt: '2024-01-20T15:00:00Z',
  },
};

export const payroll = {
  periods: [
    {
      id: 'payroll_001',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      payDate: '2024-01-19',
      status: 'processed',
    },
    {
      id: 'payroll_002',
      periodStart: '2024-01-16',
      periodEnd: '2024-01-31',
      payDate: '2024-02-02',
      status: 'upcoming',
    },
  ],
  entries: [
    {
      id: 'entry_001',
      employeeId: 'emp_001',
      payrollPeriodId: 'payroll_001',
      grossPay: 3269.23,
      deductions: {
        federal: 491.00,
        state: 163.00,
        socialSecurity: 202.69,
        medicare: 47.40,
        healthInsurance: 250.00,
        retirement401k: 327.00,
      },
      netPay: 1788.14,
      hoursWorked: 80,
      overtimeHours: 0,
    },
  ],
};

export const performanceReviews = [
  {
    id: 'review_001',
    employeeId: 'emp_001',
    reviewPeriod: '2023',
    status: 'completed',
    rating: 4,
    summary: 'Exceeds expectations consistently',
    goals: [
      { id: 'goal_001', description: 'Increase team sales by 15%', status: 'achieved' },
      { id: 'goal_002', description: 'Train 3 new team members', status: 'achieved' },
    ],
    submittedAt: '2024-01-15T10:00:00Z',
    reviewedBy: 'emp_010',
  },
  {
    id: 'review_002',
    employeeId: 'emp_002',
    reviewPeriod: '2023',
    status: 'scheduled',
    scheduledDate: '2024-01-25T14:00:00Z',
    reviewerId: 'emp_015',
  },
];

export const attendance = {
  records: [
    {
      id: 'att_001',
      employeeId: 'emp_001',
      date: '2024-01-20',
      clockIn: '08:55',
      clockOut: '17:10',
      totalHours: 8.25,
      breakMinutes: 60,
      status: 'present',
    },
    {
      id: 'att_002',
      employeeId: 'emp_002',
      date: '2024-01-20',
      clockIn: '05:58',
      clockOut: '14:05',
      totalHours: 8.12,
      breakMinutes: 30,
      status: 'present',
    },
  ],
  exceptions: [
    {
      id: 'exc_001',
      employeeId: 'emp_001',
      date: '2024-01-18',
      type: 'late',
      minutesLate: 15,
      reason: 'Traffic delay',
      status: 'approved',
    },
  ],
};

export const training = {
  courses: [
    {
      id: 'course_001',
      name: 'Workplace Safety Fundamentals',
      type: 'required',
      duration: 120,
      completionRate: 85,
      employeeCount: 120,
      completedCount: 102,
    },
    {
      id: 'course_002',
      name: 'Customer Service Excellence',
      type: 'elective',
      duration: 240,
      completionRate: 60,
      employeeCount: 120,
      completedCount: 72,
    },
  ],
  completions: [
    {
      id: 'completion_001',
      employeeId: 'emp_001',
      courseId: 'course_001',
      completedAt: '2024-01-10T14:00:00Z',
      score: 95,
      status: 'passed',
    },
  ],
};

export const apiEndpoints = {
  employees: {
    list: '/api/v1/employees',
    get: '/api/v1/employees/:id',
    create: '/api/v1/employees',
    update: '/api/v1/employees/:id',
    terminate: '/api/v1/employees/:id/terminate',
  },
  schedules: {
    list: '/api/v1/schedules',
    getByEmployee: '/api/v1/employees/:id/schedule',
    create: '/api/v1/schedules',
    swap: '/api/v1/schedules/swap',
  },
  timeOff: {
    list: '/api/v1/time-off',
    request: '/api/v1/time-off/request',
    approve: '/api/v1/time-off/:id/approve',
    reject: '/api/v1/time-off/:id/reject',
  },
  payroll: {
    process: '/api/v1/payroll/process',
    periods: '/api/v1/payroll/periods',
    runPayroll: '/api/v1/payroll/run',
  },
  attendance: {
    clockIn: '/api/v1/attendance/clock-in',
    clockOut: '/api/v1/attendance/clock-out',
    records: '/api/v1/attendance/records',
  },
};

export const validationRules = {
  employee: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: true, pattern: /^\+?[1-9]\d{1,14}$/ },
    employeeId: { required: true, pattern: /^[A-Z]{3}-\d{4}-\d{3}$/ },
  },
  schedule: {
    startTime: { required: true },
    endTime: { required: true },
  },
  timeOff: {
    startDate: { required: true, notPast: true },
    endDate: { required: true, afterOrEqual: 'startDate' },
  },
};
