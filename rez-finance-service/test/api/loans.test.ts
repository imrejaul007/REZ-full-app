import { describe, it, expect } from 'vitest';
import { api, helpers, mocks } from '../setup';

describe('Loans API', () => {
  describe('GET /api/finance/offers', () => {
    it('should return loan offers', async () => {
      const res = await api.get('/api/finance/offers');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/finance/apply', () => {
    it('should submit loan application', async () => {
      const res = await helpers.applyLoan(mocks.validLoan);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid amount', async () => {
      const res = await helpers.applyLoan({
        ...mocks.validLoan,
        amount: -100,
      });

      expect(res.status).toBe(400);
    });
  });
});
