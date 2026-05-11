/**
 * Mock Data for Capital Service Integration Tests
 * Provides realistic test data for financial transactions, payments, and capital management
 */

export const transactions = {
  sale: {
    id: 'txn_001',
    type: 'sale',
    status: 'completed',
    amount: 1250.00,
    currency: 'USD',
    customerId: 'cust_001',
    orderId: 'ord_001',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'visa',
    },
    processingFee: 37.50,
    netAmount: 1212.50,
    createdAt: '2024-01-20T10:00:00Z',
    completedAt: '2024-01-20T10:00:05Z',
  },
  refund: {
    id: 'txn_002',
    type: 'refund',
    status: 'completed',
    amount: 299.99,
    currency: 'USD',
    customerId: 'cust_002',
    originalTransactionId: 'txn_original_001',
    orderId: 'ord_002',
    paymentMethod: {
      type: 'card',
      last4: '1234',
      brand: 'mastercard',
    },
    reason: 'Customer return',
    createdAt: '2024-01-21T14:00:00Z',
    completedAt: '2024-01-21T14:00:30Z',
  },
  payout: {
    id: 'txn_003',
    type: 'payout',
    status: 'pending',
    amount: 5000.00,
    currency: 'USD',
    merchantId: 'merchant_001',
    bankAccount: {
      last4: '5678',
      bankName: 'Chase Bank',
    },
    estimatedArrival: '2024-01-25',
    createdAt: '2024-01-20T09:00:00Z',
  },
  chargeback: {
    id: 'txn_004',
    type: 'chargeback',
    status: 'disputed',
    amount: 150.00,
    currency: 'USD',
    customerId: 'cust_003',
    orderId: 'ord_003',
    reason: 'Product not received',
    disputeDeadline: '2024-02-15',
    evidenceDue: '2024-02-10',
    createdAt: '2024-01-18T11:00:00Z',
  },
};

export const payments = {
  cardPayment: {
    id: 'pay_001',
    transactionId: 'txn_001',
    amount: 1250.00,
    currency: 'USD',
    status: 'succeeded',
    paymentMethod: {
      type: 'card',
      id: 'pm_card_001',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2026,
      funding: 'credit',
    },
    billingDetails: {
      name: 'John Doe',
      address: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    },
    capturedAt: '2024-01-20T10:00:05Z',
  },
  bankTransfer: {
    id: 'pay_002',
    transactionId: 'txn_003',
    amount: 5000.00,
    currency: 'USD',
    status: 'pending',
    paymentMethod: {
      type: 'bank_account',
      id: 'ba_001',
      bankName: 'Chase Bank',
      last4: '5678',
      accountType: 'checking',
    },
    createdAt: '2024-01-20T09:00:00Z',
  },
  failedPayment: {
    id: 'pay_003',
    transactionId: 'txn_failed_001',
    amount: 99.99,
    currency: 'USD',
    status: 'failed',
    failureReason: 'insufficient_funds',
    failureCode: 'card_declined',
    createdAt: '2024-01-19T15:30:00Z',
  },
};

export const invoices = {
  draft: {
    id: 'inv_001',
    customerId: 'cust_001',
    status: 'draft',
    items: [
      { description: 'Consulting Services', quantity: 10, unitPrice: 150.00, amount: 1500.00 },
      { description: 'Development Work', quantity: 20, unitPrice: 125.00, amount: 2500.00 },
    ],
    subtotal: 4000.00,
    tax: 320.00,
    total: 4320.00,
    currency: 'USD',
    dueDate: '2024-02-20',
    createdAt: '2024-01-15T10:00:00Z',
  },
  sent: {
    id: 'inv_002',
    customerId: 'cust_002',
    status: 'sent',
    items: [
      { description: 'Monthly Subscription', quantity: 1, unitPrice: 99.00, amount: 99.00 },
    ],
    subtotal: 99.00,
    tax: 7.92,
    total: 106.92,
    currency: 'USD',
    dueDate: '2024-02-01',
    sentAt: '2024-01-01T09:00:00Z',
    paidAt: null,
  },
  paid: {
    id: 'inv_003',
    customerId: 'cust_003',
    status: 'paid',
    items: [
      { description: 'Annual License', quantity: 1, unitPrice: 1200.00, amount: 1200.00 },
    ],
    subtotal: 1200.00,
    tax: 96.00,
    total: 1296.00,
    currency: 'USD',
    dueDate: '2024-01-15',
    sentAt: '2023-12-15T10:00:00Z',
    paidAt: '2024-01-10T14:30:00Z',
    paymentMethod: {
      type: 'card',
      last4: '4242',
    },
  },
  overdue: {
    id: 'inv_004',
    customerId: 'cust_004',
    status: 'overdue',
    items: [
      { description: 'Setup Fee', quantity: 1, unitPrice: 500.00, amount: 500.00 },
    ],
    subtotal: 500.00,
    tax: 40.00,
    total: 540.00,
    currency: 'USD',
    dueDate: '2024-01-01',
    daysOverdue: 20,
    remindersSent: 3,
  },
};

export const merchantAccounts = {
  standard: {
    id: 'merchant_001',
    businessName: 'ReZ Commerce Inc.',
    legalName: 'ReZ Commerce Incorporated',
    status: 'active',
    type: 'standard',
    email: 'payments@rez.com',
    phone: '+1-555-0100',
    website: 'https://rez.com',
    address: {
      line1: '100 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    },
    bankAccount: {
      id: 'ba_001',
      last4: '5678',
      bankName: 'Chase Bank',
      routingNumber: '021000021',
    },
    settings: {
      payoutSchedule: 'daily',
      payoutCurrency: 'USD',
      minimumPayout: 100.00,
    },
    verification: {
      identityVerified: true,
      addressVerified: true,
      bankVerified: true,
    },
    createdAt: '2023-01-01T00:00:00Z',
  },
};

export const payouts = {
  pending: {
    id: 'payout_001',
    merchantId: 'merchant_001',
    amount: 5000.00,
    currency: 'USD',
    status: 'pending',
    arrivalDate: '2024-01-25',
    method: 'bank_account',
    bankAccount: {
      last4: '5678',
      bankName: 'Chase Bank',
    },
    transactions: ['txn_001', 'txn_002'],
    createdAt: '2024-01-20T09:00:00Z',
  },
  completed: {
    id: 'payout_002',
    merchantId: 'merchant_001',
    amount: 12500.00,
    currency: 'USD',
    status: 'paid',
    arrivalDate: '2024-01-19',
    method: 'bank_account',
    bankAccount: {
      last4: '5678',
      bankName: 'Chase Bank',
    },
    transactions: ['txn_prev_001', 'txn_prev_002', 'txn_prev_003'],
    createdAt: '2024-01-18T09:00:00Z',
    paidAt: '2024-01-19T08:00:00Z',
  },
};

export const disputes = {
  open: {
    id: 'disp_001',
    transactionId: 'txn_004',
    amount: 150.00,
    currency: 'USD',
    reason: 'product_not_as_described',
    status: 'needs_response',
    dueBy: '2024-02-10T23:59:59Z',
    evidence: {
      required: ['shipping_documentation', 'product_description', 'communication_history'],
      submitted: [],
    },
    createdAt: '2024-01-18T11:00:00Z',
  },
  won: {
    id: 'disp_002',
    transactionId: 'txn_disp_002',
    amount: 75.00,
    currency: 'USD',
    reason: 'credit_not_processed',
    status: 'won',
    wonAt: '2024-01-15T10:00:00Z',
    evidenceSubmitted: ['receipt', 'communication_history'],
    createdAt: '2024-01-10T14:00:00Z',
    resolvedAt: '2024-01-15T10:00:00Z',
  },
  lost: {
    id: 'disp_003',
    transactionId: 'txn_disp_003',
    amount: 200.00,
    currency: 'USD',
    reason: 'fraudulent_transaction',
    status: 'lost',
    lostAt: '2024-01-12T16:00:00Z',
    createdAt: '2024-01-05T09:00:00Z',
    resolvedAt: '2024-01-12T16:00:00Z',
  },
};

export const refunds = {
  full: {
    id: 'ref_001',
    transactionId: 'txn_original_001',
    amount: 299.99,
    currency: 'USD',
    reason: 'customer_request',
    status: 'succeeded',
    orderId: 'ord_002',
    customerId: 'cust_002',
    createdAt: '2024-01-21T14:00:00Z',
    completedAt: '2024-01-21T14:00:30Z',
  },
  partial: {
    id: 'ref_002',
    transactionId: 'txn_original_002',
    amount: 50.00,
    currency: 'USD',
    reason: ' promotional_adjustment',
    status: 'succeeded',
    orderId: 'ord_003',
    customerId: 'cust_003',
    originalAmount: 250.00,
    newAmount: 200.00,
    createdAt: '2024-01-20T11:00:00Z',
    completedAt: '2024-01-20T11:00:15Z',
  },
};

export const financialReports = {
  dailySummary: {
    date: '2024-01-20',
    transactions: {
      sales: 45000.00,
      refunds: 1250.00,
      chargebacks: 150.00,
      net: 43600.00,
    },
    fees: {
      processing: 1350.00,
      payout: 25.00,
      total: 1375.00,
    },
    volume: {
      totalTransactions: 234,
      successfulTransactions: 228,
      failedTransactions: 6,
    },
  },
  monthlyPnl: {
    period: '2024-01',
    revenue: 125000.00,
    costOfSales: 75000.00,
    grossProfit: 50000.00,
    operatingExpenses: {
      marketing: 15000.00,
      salaries: 25000.00,
      infrastructure: 5000.00,
      total: 45000.00,
    },
    netProfit: 5000.00,
    profitMargin: 4.0,
  },
};

export const subscriptions = {
  active: {
    id: 'sub_001',
    customerId: 'cust_001',
    planId: 'plan_premium',
    status: 'active',
    currentPeriodStart: '2024-01-01',
    currentPeriodEnd: '2024-01-31',
    amount: 99.00,
    currency: 'USD',
    interval: 'monthly',
    nextBillingDate: '2024-02-01',
    cancelAtPeriodEnd: false,
    createdAt: '2023-06-01T00:00:00Z',
  },
  cancelled: {
    id: 'sub_002',
    customerId: 'cust_002',
    planId: 'plan_basic',
    status: 'canceled',
    currentPeriodStart: '2024-01-01',
    currentPeriodEnd: '2024-01-31',
    amount: 29.00,
    currency: 'USD',
    interval: 'monthly',
    canceledAt: '2024-01-15T10:00:00Z',
    cancelAtPeriodEnd: true,
    willCancelAt: '2024-01-31T23:59:59Z',
    createdAt: '2023-09-01T00:00:00Z',
  },
};

export const apiEndpoints = {
  transactions: {
    list: '/api/v1/capital/transactions',
    get: '/api/v1/capital/transactions/:id',
    create: '/api/v1/capital/transactions',
    refund: '/api/v1/capital/transactions/:id/refund',
  },
  payments: {
    list: '/api/v1/capital/payments',
    get: '/api/v1/capital/payments/:id',
    confirm: '/api/v1/capital/payments/confirm',
    cancel: '/api/v1/capital/payments/:id/cancel',
  },
  invoices: {
    list: '/api/v1/capital/invoices',
    get: '/api/v1/capital/invoices/:id',
    create: '/api/v1/capital/invoices',
    send: '/api/v1/capital/invoices/:id/send',
    void: '/api/v1/capital/invoices/:id/void',
  },
  payouts: {
    list: '/api/v1/capital/payouts',
    get: '/api/v1/capital/payouts/:id',
    schedule: '/api/v1/capital/payouts/schedule',
  },
  disputes: {
    list: '/api/v1/capital/disputes',
    get: '/api/v1/capital/disputes/:id',
    submitEvidence: '/api/v1/capital/disputes/:id/evidence',
  },
};

export const validationRules = {
  amount: {
    min: 0.50,
    max: 999999.99,
  },
  currency: {
    supported: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  },
  bankAccount: {
    routingNumberLength: 9,
    accountNumberMinLength: 8,
    accountNumberMaxLength: 17,
  },
};
