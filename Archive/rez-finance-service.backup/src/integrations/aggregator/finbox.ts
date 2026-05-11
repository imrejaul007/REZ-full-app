/**
 * FinBox Aggregator Adapter
 *
 * FinBox is a leading Indian fintech infra provider.
 * Docs: https://docs.finbox.in
 *
 * In Phase 1, this adapter uses their BankConnect + LendingBridge APIs.
 * Replace FINBOX_BASE_URL, FINBOX_API_KEY, FINBOX_API_SECRET in env.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../config/logger';
import type {
  IAggregatorAdapter,
  AggregatorOffer,
  ApplicationSubmitResult,
  ApplicationStatusResult,
} from './index';

export class FinBoxAdapter implements IAggregatorAdapter {
  readonly partnerId = 'finbox';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.FINBOX_BASE_URL || 'https://api.finbox.in',
      headers: {
        'x-api-key': process.env.FINBOX_API_KEY || '',
        'x-api-secret': process.env.FINBOX_API_SECRET || '',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async fetchOffers(userId: string, rezScore: number, monthlySpend: number): Promise<AggregatorOffer[]> {
    // If FinBox is not configured, return empty (partner not yet live)
    if (!process.env.FINBOX_API_KEY) {
      logger.warn('[FinBox] API key not configured — returning empty offers');
      return [];
    }

    try {
      const response = await this.client.post<{ offers: RawFinBoxOffer[] }>('/v1/offers', {
        customer_id: userId,
        rez_score: rezScore,
        monthly_income: monthlySpend,
      });
      return (response.data.offers || []).map((o) => this.mapOffer(o));
    } catch (err) {
      logger.error('[FinBox] fetchOffers error', { error: (err as Error).message, userId });
      return [];
    }
  }

  async submitApplication(
    userId: string,
    offerId: string,
    payload: Record<string, unknown>,
  ): Promise<ApplicationSubmitResult> {
    if (!process.env.FINBOX_API_KEY) {
      return { success: false, error: 'FinBox not configured' };
    }
    try {
      const response = await this.client.post<{ application_id: string; redirect_url?: string }>(
        '/v1/applications',
        { customer_id: userId, offer_id: offerId, ...payload },
      );
      return {
        success: true,
        partnerApplicationId: response.data.application_id,
        redirectUrl: response.data.redirect_url,
      };
    } catch (err) {
      logger.error('[FinBox] submitApplication error', { error: (err as Error).message, userId, offerId });
      return { success: false, error: 'Failed to submit application' };
    }
  }

  async getApplicationStatus(partnerApplicationId: string): Promise<ApplicationStatusResult> {
    if (!process.env.FINBOX_API_KEY) {
      return { status: 'pending' };
    }
    try {
      const response = await this.client.get<RawFinBoxStatus>(`/v1/applications/${partnerApplicationId}`);
      return this.mapStatus(response.data);
    } catch (err) {
      logger.error('[FinBox] getApplicationStatus error', { error: (err as Error).message, partnerApplicationId });
      return { status: 'pending' };
    }
  }

  private mapOffer(o: RawFinBoxOffer): AggregatorOffer {
    return {
      partnerOfferId: o.offer_id,
      partnerId: 'finbox',
      type: o.product_type === 'credit_card' ? 'credit_card' : 'personal_loan',
      displayName: o.lender_name,
      logoUrl: o.lender_logo,
      minAmount: o.min_amount,
      maxAmount: o.max_amount,
      minTenure: o.min_tenure,
      maxTenure: o.max_tenure,
      interestRate: o.interest_rate,
      processingFee: o.processing_fee,
      creditLimit: o.credit_limit,
      annualFee: o.annual_fee,
      isPreApproved: o.pre_approved ?? false,
      expiresAt: new Date(o.expires_at || Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private mapStatus(s: RawFinBoxStatus): ApplicationStatusResult {
    const statusMap: Record<string, ApplicationStatusResult['status']> = {
      APPROVED: 'approved',
      DISBURSED: 'disbursed',
      REJECTED: 'rejected',
      PENDING: 'pending',
      IN_REVIEW: 'pending',
    };
    return {
      status: statusMap[s.status] ?? 'pending',
      amount: s.approved_amount,
      interestRate: s.interest_rate,
      emi: s.emi_amount,
      rejectionReason: s.rejection_reason,
      disbursedAt: s.disbursal_date,
    };
  }
}

// Raw FinBox response shapes (based on public API docs)
interface RawFinBoxOffer {
  offer_id: string;
  lender_name: string;
  lender_logo?: string;
  product_type: string;
  min_amount?: number;
  max_amount?: number;
  min_tenure?: number;
  max_tenure?: number;
  interest_rate?: number;
  processing_fee?: number;
  credit_limit?: number;
  annual_fee?: number;
  pre_approved?: boolean;
  expires_at?: string;
}

interface RawFinBoxStatus {
  status: string;
  approved_amount?: number;
  interest_rate?: number;
  emi_amount?: number;
  rejection_reason?: string;
  disbursal_date?: string;
}

export const finBoxAdapter = new FinBoxAdapter();
