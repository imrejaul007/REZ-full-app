/**
 * Aggregator Adapter — common interface for all partner aggregators
 *
 * Phase 1: FinBox
 * Phase 2: Perfios, Karza, direct bank APIs
 */

import { OfferType } from '../../models/PartnerOffer';

export interface AggregatorOffer {
  partnerOfferId: string;
  partnerId: string;
  type: OfferType;
  displayName: string;
  logoUrl?: string;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  minTenure?: number;
  maxTenure?: number;
  interestRate?: number;
  processingFee?: number;
  creditLimit?: number;
  annualFee?: number;
  isPreApproved: boolean;
  expiresAt: Date;
}

export interface ApplicationSubmitResult {
  success: boolean;
  partnerApplicationId?: string;
  redirectUrl?: string;           // for KYC / in-app webview
  error?: string;
}

export interface ApplicationStatusResult {
  status: 'pending' | 'approved' | 'disbursed' | 'rejected';
  amount?: number;
  interestRate?: number;
  emi?: number;
  rejectionReason?: string;
  disbursedAt?: string;
}

export interface IAggregatorAdapter {
  partnerId: string;
  fetchOffers(userId: string, rezScore: number, monthlySpend: number): Promise<AggregatorOffer[]>;
  submitApplication(userId: string, offerId: string, payload: Record<string, unknown>): Promise<ApplicationSubmitResult>;
  getApplicationStatus(partnerApplicationId: string): Promise<ApplicationStatusResult>;
}
