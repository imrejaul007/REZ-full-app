import { describe, it, expect } from 'vitest';
import { api, mocks } from '../setup';

describe('BNPL API', () => {
  describe('POST /api/finance/bnpl/check', () => {
    it('should check BNPL eligibility', async () => {
      const res = await api
        .post('/api/finance/bnpl/check')
        .send({ userId: mocks.userId, amount: 5000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
