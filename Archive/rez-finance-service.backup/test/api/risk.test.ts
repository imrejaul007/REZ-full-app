import { describe, it, expect } from 'vitest';
import { api, mocks } from '../setup';

describe('Risk Engine API', () => {
  describe('GET /api/finance/risk/fraud/:userId', () => {
    it('should return fraud detection result', async () => {
      const res = await api.get(`/api/finance/risk/fraud/${mocks.userId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/finance/risk/default/:userId', () => {
    it('should return default prediction', async () => {
      const res = await api.get(`/api/finance/risk/default/${mocks.userId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('probability');
    });
  });
});
