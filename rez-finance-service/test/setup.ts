import supertest from 'supertest';

export const api = supertest('http://localhost:4006');

// Helper to make requests
export const helpers = {
  getScore: (userId: string) => api.get(`/api/finance/score?userId=${userId}`),
  applyLoan: (body: object) => api.post('/api/finance/apply').send(body),
  checkBnpl: (body: object) => api.post('/api/finance/bnpl/check').send(body),
};

// Mock data
export const mocks = {
  userId: 'user_123',
  validLoan: {
    offerId: 'offer_123',
    amount: 50000,
    tenure: 12,
  },
};
