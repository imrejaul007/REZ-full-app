import { describe, it, expect } from 'vitest';
import { api, helpers, mocks } from '../setup';

describe('Credit Score API', () => {
  describe('GET /api/finance/score', () => {
    it('should return credit score for valid user', async () => {
      const res = await helpers.getScore(mocks.userId);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('should return 400 for missing userId', async () => {
      const res = await api.get('/api/finance/score');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/finance/score/check', () => {
    it('should check credit eligibility', async () => {
      const res = await api
        .post('/api/finance/score/check')
        .send({ userId: mocks.userId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
