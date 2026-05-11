import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data for development
import { MOCK_DATA } from './mockData';

// Add auth token if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

class TryApi {
  async getFeed(lat: number, lng: number) {
    if (USE_MOCK) return MOCK_DATA.trials;
    const res = await apiClient.get('/try/feed', { params: { lat, lng } });
    return res.data.data || res.data;
  }

  async getTrialDetails(trialId: string) {
    if (USE_MOCK) return MOCK_DATA.trials.find(t => t.id === trialId) || null;
    const res = await apiClient.get(`/try/${trialId}`);
    return res.data.data || res.data;
  }

  async bookTrial(request: any) {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          bookingId: 'mock-booking-' + Date.now(),
          qrToken: 'mock-qr-' + Date.now(),
          qrExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
    const res = await apiClient.post('/try/book', request);
    return res.data;
  }

  async getBookingDetails(bookingId: string) {
    if (USE_MOCK) return MOCK_DATA.history.find(h => h.bookingId === bookingId) || MOCK_DATA.history[0];
    const res = await apiClient.get(`/try/bookings/${bookingId}`);
    return res.data.data || res.data;
  }

  async getHistory() {
    if (USE_MOCK) return MOCK_DATA.history;
    const res = await apiClient.get('/try/history');
    return res.data.data || res.data;
  }

  async getCoins() {
    if (USE_MOCK) return MOCK_DATA.coins;
    const res = await apiClient.get('/try/coins');
    return res.data.data || res.data;
  }

  async getScore() {
    if (USE_MOCK) return MOCK_DATA.score;
    const res = await apiClient.get('/try/score');
    return res.data.data || res.data;
  }

  async getMissions() {
    if (USE_MOCK) return MOCK_DATA.missions;
    const res = await apiClient.get('/try/missions');
    return res.data.data || res.data;
  }

  async getBadges() {
    if (USE_MOCK) return MOCK_DATA.badges;
    const res = await apiClient.get('/try/badges');
    return res.data.data || res.data;
  }

  async getLeaderboard(city: string, period: 'weekly' | 'monthly' | 'alltime') {
    if (USE_MOCK) return MOCK_DATA.leaderboard;
    const res = await apiClient.get('/try/leaderboard', { params: { city, period } });
    return res.data.data || res.data;
  }

  async getSurpriseTrial() {
    if (USE_MOCK) return MOCK_DATA.surprise;
    const res = await apiClient.get('/try/surprise');
    return res.data.data || res.data;
  }

  async getBundles(category?: string) {
    if (USE_MOCK) return MOCK_DATA.bundles;
    const res = await apiClient.get('/try/bundles', { params: { category } });
    return res.data.data || res.data;
  }

  async getMyBundles() {
    if (USE_MOCK) return MOCK_DATA.myBundles;
    const res = await apiClient.get('/try/bundles/mine');
    return res.data.data || res.data;
  }

  async getCampaigns(city: string) {
    if (USE_MOCK) return MOCK_DATA.campaigns;
    const res = await apiClient.get('/try/campaigns', { params: { city } });
    return res.data.data || res.data;
  }

  async createPaymentOrder(params: {
    amount: number;
    trialId?: string;
    bundleId?: string;
    packIndex?: number;
    source?: 'trial_commitment' | 'trial_coins' | 'trial_bundle';
  }) {
    if (USE_MOCK) {
      return {
        razorpayOrderId: 'mock-order-' + Date.now(),
        amount: params.amount * 100,
        currency: 'INR',
      };
    }
    const res = await apiClient.post('/razorpay/create-order', params);
    return res.data;
  }
}

export const tryApi = new TryApi();
export default tryApi;
