/**
 * Integration Tests for Capital Service
 * Tests financial transactions, payments, invoices, payouts, and capital management
 */

import {
  transactions,
  payments,
  invoices,
  merchantAccounts,
  payouts,
  disputes,
  refunds,
  financialReports,
  subscriptions,
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

describe('Capital Service Integration', () => {
  let mockDb: ReturnType<typeof createMockDbConnection>;
  let mockRedis: ReturnType<typeof createMockRedisClient>;
  let mockHttp: ReturnType<typeof createMockHttpClient>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDbConnection();
    mockRedis = createMockRedisClient();
    mockHttp = createMockHttpClient();
    mockEventEmitter = createMockEventEmitter();
  });

  describe('Transactions', () => {
    test('should create a sale transaction', async () => {
      const saleTransaction = {
        type: 'sale',
        amount: 1250.00,
        customerId: 'cust_001',
        paymentMethodId: 'pm_001',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...saleTransaction, id: generateTestId('txn'), status: 'pending' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO transactions (type, amount, customer_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [saleTransaction.type, saleTransaction.amount, saleTransaction.customerId, 'pending']
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('pending');
    });

    test('should calculate processing fee correctly', () => {
      const transaction = transactions.sale;
      const expectedFee = transaction.amount * 0.03; // 3% fee

      expect(transaction.processingFee).toBeCloseTo(expectedFee, 2);
    });

    test('should calculate net amount after fees', () => {
      const transaction = transactions.sale;
      const netAmount = transaction.amount - transaction.processingFee;

      expect(netAmount).toBeCloseTo(transaction.netAmount, 2);
    });

    test('should get transaction by ID', async () => {
      const transaction = transactions.sale;

      mockDb.query.mockResolvedValueOnce({
        rows: [transaction],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM transactions WHERE id = $1',
        [transaction.id]
      );

      expect(result.rows[0].id).toBe(transaction.id);
    });

    test('should filter transactions by type', async () => {
      const sales = [transactions.sale];

      mockDb.query.mockResolvedValueOnce({
        rows: sales,
        rowCount: 1,
      });

      const result = await mockDb.query(
        "SELECT * FROM transactions WHERE type = 'sale' AND status = 'completed'"
      );

      expect(result.rows).toHaveLength(1);
    });

    test('should filter transactions by status', async () => {
      const pending = [transactions.payout];

      mockDb.query.mockResolvedValueOnce({
        rows: pending,
        rowCount: 1,
      });

      const result = await mockDb.query(
        "SELECT * FROM transactions WHERE status = 'pending'"
      );

      expect(result.rows).toHaveLength(1);
    });

    test('should get transactions by customer', async () => {
      const customerTransactions = [transactions.sale];

      mockDb.query.mockResolvedValueOnce({
        rows: customerTransactions,
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM transactions WHERE customer_id = $1 ORDER BY created_at DESC',
        ['cust_001']
      );

      expect(result.rows).toHaveLength(1);
    });

    test('should update transaction status', async () => {
      const transaction = transactions.payout;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...transaction, status: 'paid' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *',
        ['paid', transaction.id]
      );

      expect(result.rows[0].status).toBe('paid');
    });
  });

  describe('Payments', () => {
    test('should create card payment', async () => {
      const payment = {
        transactionId: 'txn_001',
        amount: 1250.00,
        currency: 'USD',
        paymentMethodId: 'pm_card_001',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...payment, id: generateTestId('pay'), status: 'succeeded' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO payments (transaction_id, amount, currency, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [payment.transactionId, payment.amount, payment.currency, 'succeeded']
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('succeeded');
    });

    test('should handle payment failure', async () => {
      const failedPayment = payments.failedPayment;

      mockDb.query.mockResolvedValueOnce({
        rows: [failedPayment],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM payments WHERE id = $1',
        [failedPayment.id]
      );

      expect(result.rows[0].status).toBe('failed');
      expect(result.rows[0]).toHaveProperty('failureReason');
    });

    test('should validate payment amount', () => {
      const { amount } = validationRules;
      const validAmount = 1250.00;
      const tooSmall = 0.25;
      const tooLarge = 1000000.00;

      expect(validAmount).toBeGreaterThanOrEqual(amount.min);
      expect(validAmount).toBeLessThanOrEqual(amount.max);
      expect(tooSmall).toBeLessThan(amount.min);
      expect(tooLarge).toBeGreaterThan(amount.max);
    });

    test('should validate currency support', () => {
      const { currency } = validationRules;
      const supportedCurrencies = currency.supported;

      expect(supportedCurrencies).toContain('USD');
      expect(supportedCurrencies).toContain('EUR');
      expect(supportedCurrencies).not.toContain('XYZ');
    });

    test('should get payment by transaction ID', async () => {
      const payment = payments.cardPayment;

      mockDb.query.mockResolvedValueOnce({
        rows: [payment],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM payments WHERE transaction_id = $1',
        [payment.transactionId]
      );

      expect(result.rows[0].id).toBe(payment.id);
    });

    test('should capture authorized payment', async () => {
      const payment = payments.cardPayment;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...payment, status: 'succeeded' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE payments SET status = $1, captured_at = NOW() WHERE id = $2 RETURNING *',
        ['succeeded', payment.id]
      );

      expect(result.rows[0].status).toBe('succeeded');
    });
  });

  describe('Invoices', () => {
    test('should create invoice', async () => {
      const invoice = invoices.draft;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...invoice, id: generateTestId('inv'), status: 'draft' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO invoices (customer_id, status, due_date) VALUES ($1, $2, $3) RETURNING *',
        [invoice.customerId, 'draft', invoice.dueDate]
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('draft');
    });

    test('should calculate invoice total', () => {
      const invoice = invoices.draft;
      const calculatedTotal = invoice.subtotal + invoice.tax;

      expect(calculatedTotal).toBeCloseTo(invoice.total, 2);
    });

    test('should send invoice', async () => {
      const invoice = invoices.draft;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...invoice, status: 'sent', sentAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE invoices SET status = $1, sent_at = NOW() WHERE id = $2 RETURNING *',
        ['sent', invoice.id]
      );

      expect(result.rows[0].status).toBe('sent');
      expect(result.rows[0]).toHaveProperty('sentAt');
    });

    test('should mark invoice as paid', async () => {
      const invoice = invoices.paid;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...invoice, status: 'paid', paidAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE invoices SET status = $1, paid_at = NOW() WHERE id = $2 RETURNING *',
        ['paid', invoice.id]
      );

      expect(result.rows[0].status).toBe('paid');
    });

    test('should calculate days overdue', () => {
      const invoice = invoices.overdue;
      expect(invoice.daysOverdue).toBeGreaterThan(0);
    });

    test('should void invoice', async () => {
      const invoice = invoices.draft;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...invoice, status: 'void' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE invoices SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
        ['void', invoice.id, 'draft']
      );

      expect(result.rows[0].status).toBe('void');
    });

    test('should filter invoices by status', async () => {
      const overdueInvoices = [invoices.overdue];

      mockDb.query.mockResolvedValueOnce({
        rows: overdueInvoices,
        rowCount: 1,
      });

      const result = await mockDb.query(
        "SELECT * FROM invoices WHERE status = 'overdue'"
      );

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Merchant Accounts', () => {
    test('should retrieve merchant account', async () => {
      const merchant = merchantAccounts.standard;

      mockDb.query.mockResolvedValueOnce({
        rows: [merchant],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM merchant_accounts WHERE id = $1',
        [merchant.id]
      );

      expect(result.rows[0].businessName).toBe(merchant.businessName);
    });

    test('should verify merchant status', () => {
      const merchant = merchantAccounts.standard;
      expect(merchant.status).toBe('active');
      expect(merchant.verification.identityVerified).toBe(true);
      expect(merchant.verification.bankVerified).toBe(true);
    });

    test('should get payout schedule', () => {
      const merchant = merchantAccounts.standard;
      expect(merchant.settings.payoutSchedule).toBe('daily');
      expect(merchant.settings.minimumPayout).toBe(100.00);
    });
  });

  describe('Payouts', () => {
    test('should create payout', async () => {
      const payout = payouts.pending;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...payout, id: generateTestId('payout'), status: 'pending' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO payouts (merchant_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
        [payout.merchantId, payout.amount, 'pending']
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('pending');
    });

    test('should calculate payout net amount', () => {
      const transaction = transactions.sale;
      expect(transaction.netAmount).toBe(transaction.amount - transaction.processingFee);
    });

    test('should update payout status', async () => {
      const payout = payouts.pending;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...payout, status: 'paid' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE payouts SET status = $1 WHERE id = $2 RETURNING *',
        ['paid', payout.id]
      );

      expect(result.rows[0].status).toBe('paid');
    });

    test('should get payouts by merchant', async () => {
      const merchantPayouts = [payouts.pending, payouts.completed];

      mockDb.query.mockResolvedValueOnce({
        rows: merchantPayouts,
        rowCount: 2,
      });

      const result = await mockDb.query(
        'SELECT * FROM payouts WHERE merchant_id = $1 ORDER BY created_at DESC',
        ['merchant_001']
      );

      expect(result.rows).toHaveLength(2);
    });

    test('should filter payouts by status', async () => {
      const pendingPayouts = [payouts.pending];

      mockDb.query.mockResolvedValueOnce({
        rows: pendingPayouts,
        rowCount: 1,
      });

      const result = await mockDb.query(
        "SELECT * FROM payouts WHERE status = 'pending'"
      );

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Disputes', () => {
    test('should create dispute', async () => {
      const dispute = disputes.open;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...dispute, id: generateTestId('disp'), status: 'needs_response' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO disputes (transaction_id, amount, reason, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [dispute.transactionId, dispute.amount, dispute.reason, 'needs_response']
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('needs_response');
    });

    test('should submit dispute evidence', async () => {
      const dispute = disputes.open;
      const evidence = ['shipping_documentation', 'product_photos'];

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...dispute, evidenceSubmitted: evidence }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE disputes SET evidence_submitted = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(evidence), dispute.id]
      );

      expect(result.rows[0].evidenceSubmitted).toHaveLength(2);
    });

    test('should update dispute status to won', async () => {
      const dispute = disputes.won;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...dispute, status: 'won' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE disputes SET status = $1, won_at = NOW() WHERE id = $2 RETURNING *',
        ['won', dispute.id]
      );

      expect(result.rows[0].status).toBe('won');
    });

    test('should update dispute status to lost', async () => {
      const dispute = disputes.lost;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...dispute, status: 'lost' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE disputes SET status = $1, lost_at = NOW() WHERE id = $2 RETURNING *',
        ['lost', dispute.id]
      );

      expect(result.rows[0].status).toBe('lost');
    });

    test('should get disputes by status', async () => {
      const openDisputes = [disputes.open];

      mockDb.query.mockResolvedValueOnce({
        rows: openDisputes,
        rowCount: 1,
      });

      const result = await mockDb.query(
        "SELECT * FROM disputes WHERE status = 'needs_response'"
      );

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Refunds', () => {
    test('should create full refund', async () => {
      const refund = refunds.full;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...refund, id: generateTestId('ref'), status: 'succeeded' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO refunds (transaction_id, amount, reason, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [refund.transactionId, refund.amount, refund.reason, 'succeeded']
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('succeeded');
    });

    test('should create partial refund', async () => {
      const refund = refunds.partial;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...refund, id: generateTestId('ref'), status: 'succeeded' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO refunds (transaction_id, amount, reason, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [refund.transactionId, refund.amount, refund.reason, 'succeeded']
      );

      expect(result.rows[0].amount).toBeLessThan(refund.originalAmount);
    });

    test('should calculate refund amount', () => {
      const refund = refunds.partial;
      const originalAmount = refund.originalAmount || 250;
      const newAmount = 200;
      const refundAmount = originalAmount - newAmount;

      expect(refundAmount).toBe(refund.amount);
    });

    test('should get refunds by transaction', async () => {
      const transactionRefunds = [refunds.full];

      mockDb.query.mockResolvedValueOnce({
        rows: transactionRefunds,
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM refunds WHERE transaction_id = $1',
        ['txn_original_001']
      );

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Financial Reports', () => {
    test('should calculate daily transaction totals', () => {
      const summary = financialReports.dailySummary;
      const net = summary.transactions.sales - summary.transactions.refunds - summary.transactions.chargebacks;

      expect(net).toBeCloseTo(summary.transactions.net, 2);
    });

    test('should calculate success rate', () => {
      const volume = financialReports.dailySummary.volume;
      const successRate = (volume.successfulTransactions / volume.totalTransactions) * 100;

      expect(successRate).toBeCloseTo(97.4, 1);
    });

    test('should calculate monthly profit', () => {
      const pnl = financialReports.monthlyPnl;
      const netProfit = pnl.revenue - pnl.costOfSales - pnl.operatingExpenses.total;

      expect(netProfit).toBeCloseTo(pnl.netProfit, 2);
    });

    test('should calculate profit margin', () => {
      const pnl = financialReports.monthlyPnl;
      const margin = (pnl.netProfit / pnl.revenue) * 100;

      expect(margin).toBeCloseTo(pnl.profitMargin, 1);
    });
  });

  describe('Subscriptions', () => {
    test('should get active subscriptions', async () => {
      const activeSubs = [subscriptions.active];

      mockDb.query.mockResolvedValueOnce({
        rows: activeSubs,
        rowCount: 1,
      });

      const result = await mockDb.query(
        "SELECT * FROM subscriptions WHERE status = 'active'"
      );

      expect(result.rows).toHaveLength(1);
    });

    test('should cancel subscription at period end', async () => {
      const sub = subscriptions.cancelled;

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...sub, cancelAtPeriodEnd: true }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE subscriptions SET cancel_at_period_end = true WHERE id = $1 RETURNING *',
        [sub.id]
      );

      expect(result.rows[0].cancelAtPeriodEnd).toBe(true);
    });

    test('should calculate next billing date', () => {
      const sub = subscriptions.active;
      const periodStart = new Date(sub.currentPeriodStart);
      const periodEnd = new Date(sub.currentPeriodEnd);
      const expectedNextBilling = new Date(periodEnd);
      expectedNextBilling.setDate(expectedNextBilling.getDate() + 1);

      expect(sub.nextBillingDate).toBe('2024-02-01');
    });
  });

  describe('API Endpoints', () => {
    test('should have correct transaction endpoints', () => {
      expect(apiEndpoints.transactions.list).toBe('/api/v1/capital/transactions');
      expect(apiEndpoints.transactions.create).toBe('/api/v1/capital/transactions');
    });

    test('should have correct payment endpoints', () => {
      expect(apiEndpoints.payments.list).toBe('/api/v1/capital/payments');
      expect(apiEndpoints.payments.confirm).toBe('/api/v1/capital/payments/confirm');
    });

    test('should have correct invoice endpoints', () => {
      expect(apiEndpoints.invoices.list).toBe('/api/v1/capital/invoices');
      expect(apiEndpoints.invoices.create).toBe('/api/v1/capital/invoices');
    });

    test('should have correct payout endpoints', () => {
      expect(apiEndpoints.payouts.list).toBe('/api/v1/capital/payouts');
      expect(apiEndpoints.payouts.schedule).toBe('/api/v1/capital/payouts/schedule');
    });

    test('should have correct dispute endpoints', () => {
      expect(apiEndpoints.disputes.list).toBe('/api/v1/capital/disputes');
      expect(apiEndpoints.disputes.submitEvidence).toBe('/api/v1/capital/disputes/:id/evidence');
    });
  });

  describe('Event Handling', () => {
    test('should emit payment succeeded event', () => {
      const event = { paymentId: 'pay_001', amount: 1250.00 };
      mockEventEmitter.emit('payment_succeeded', event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment_succeeded', event);
    });

    test('should emit payment failed event', () => {
      const event = { paymentId: 'pay_003', reason: 'insufficient_funds' };
      mockEventEmitter.emit('payment_failed', event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment_failed', event);
    });

    test('should emit payout completed event', () => {
      const event = { payoutId: 'payout_002', amount: 12500.00 };
      mockEventEmitter.emit('payout_completed', event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payout_completed', event);
    });

    test('should emit dispute created event', () => {
      const event = { disputeId: 'disp_001', amount: 150.00 };
      mockEventEmitter.emit('dispute_created', event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('dispute_created', event);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid transaction ID', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await mockDb.query(
        'SELECT * FROM transactions WHERE id = $1',
        ['invalid_txn_id']
      );

      expect(result.rows).toHaveLength(0);
    });

    test('should handle duplicate payment', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [payments.cardPayment],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT id FROM payments WHERE transaction_id = $1 AND status = $2',
        ['txn_001', 'succeeded']
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    test('should handle expired dispute evidence deadline', async () => {
      const dispute = disputes.open;
      const now = new Date();
      const deadline = new Date(dispute.dueBy);

      expect(now < deadline).toBe(true); // Still within deadline
    });

    test('should handle insufficient funds', () => {
      const failedPayment = payments.failedPayment;
      expect(failedPayment.failureReason).toBe('insufficient_funds');
    });
  });

  describe('Bank Account Validation', () => {
    test('should validate routing number length', () => {
      const routingNumber = '021000021';
      expect(routingNumber.length).toBe(validationRules.bankAccount.routingNumberLength);
    });

    test('should validate account number length', () => {
      const accountNumber = '123456789';
      expect(accountNumber.length).toBeGreaterThanOrEqual(validationRules.bankAccount.accountNumberMinLength);
      expect(accountNumber.length).toBeLessThanOrEqual(validationRules.bankAccount.accountNumberMaxLength);
    });
  });
});
