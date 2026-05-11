/**
 * REE Client for Merchant Service
 *
 * Connects to REE for:
 * - Commission rates
 * - Feature flags
 * - Fraud checks
 * - Branded coin campaigns
 */

const REE_URL = process.env.RZ_SERVICE_URL || 'http://localhost:4000/api';

interface REECommissionResult {
  platformFee: number;
  merchantReceives: number;
  userCashback: number;
  userSocial: number;
  commissionRate: number;
}

interface REEFeatureResult {
  canCreateBrandedCoins: boolean;
  commissionRate: number;
  maxQRCodes: number;
  [key: string]: any;
}

class MerchantREEClient {
  private timeout = 5000;

  private async request<T>(
    endpoint: string,
    body?: Record<string, any>
  ): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${REE_URL}${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        'X-Service-Key': process.env.RZ_SERVICE_KEY || 'dev-key',
          ...(body && { body: JSON.stringify(body) }),
          signal: controller.signal,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[REE] Request failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`[REE] Error:`, error);
      return null;
    }
  }

  /**
   * Get merchant commission rates
   */
  async getCommission(
    tier: string,
    amount: number
  ): Promise<REECommissionResult | null> {
    return this.request<REECommissionResult>('/features/commission', { tier, amount });
  }

  /**
   * Get merchant features from REE
   */
  async getFeatures(tier: string): Promise<REEFeatureResult | null> {
    return this.request<REEFeatureResult>('/features/merchant', { tier });
  }

  /**
   * Check if merchant can create branded coins
   */
  async canCreateBrandedCoins(tier: string): Promise<boolean> {
    const features = await this.getFeatures(tier);
    return features?.canCreateBrandedCoins ?? false;
  }

  /**
   * Get branded coin budget from REE
   */
  async getBrandedCoinBudget(campaignId: string): Promise<{
    total: number;
    remaining: number;
    perUserLimit: number;
  } | null> {
    return this.request<any>('/query/coins/branded/budget', { campaignId });
  }

  /**
   * Record branded coin transaction
   */
  async recordBrandedCoin(
    userId: string,
    merchantId: string,
    campaignId: string,
    amount: number
  ): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('/events', {
      eventType: 'branded.coin_earned',
      source: 'merchant-service',
      userId,
      data: { merchantId, campaignId, amount },
    });
    return result?.success ?? false;
  }

  /**
   * Check fraud for merchant action
   */
  async checkFraud(
    merchantId: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const result = await this.request<{
      isFraud: boolean;
      action: string;
      reasons: string[];
    }>('/query/fraud', {
      context: { merchantId, event: { type: action },
    });

    if (result?.isFraud && result.action === 'block') {
      return {
        allowed: false,
        reason: result.reasons?.join(', ') || 'Blocked',
      };
    }

    return { allowed: true };
  }
}

export const merchantREE = new MerchantREEClient();
export default merchantREE;
