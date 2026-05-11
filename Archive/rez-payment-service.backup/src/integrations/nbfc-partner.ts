/**
 * NBFC Partner abstraction layer.
 *
 * Production status: STUB only.
 * A real NBFC partner (e.g. Lendingkart, Flexiloans) must be integrated
 * by replacing StubNbfcPartner with a concrete implementation and wiring
 * the NBFC_PARTNER env var.
 *
 * IMPORTANT: No real financial institution credentials or payment flows
 * are implemented here. All methods simulate responses for development.
 */

import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

// ── Shared types ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'closed';

export interface CreditApplication {
  merchantId: string;
  requestedAmount: number;
  /** payment tenor in days */
  tenor: number;
  purpose: 'supplier_payment' | 'working_capital';
  creditScore: number;
  merchantName: string;
  gstin?: string;
}

export interface ApplicationRecord extends CreditApplication {
  applicationId: string;
  status: ApplicationStatus;
  approvedAmount?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementRequest {
  applicationId: string;
  merchantId: string;
  amount: number;
  destinationAccountId?: string;
}

export interface Disbursement {
  disbursementId: string;
  applicationId: string;
  amount: number;
  status: 'initiated' | 'completed' | 'failed';
  transactionRef?: string;
  disbursedAt: string;
}

// ── Interface contract ────────────────────────────────────────────────────────

export interface NbfcPartner {
  name: string;
  applyForCredit(application: CreditApplication): Promise<ApplicationRecord>;
  checkStatus(applicationId: string): Promise<ApplicationStatus>;
  disburse(request: DisbursementRequest): Promise<Disbursement>;
}

// ── Stub implementation ───────────────────────────────────────────────────────

/**
 * StubNbfcPartner — simulates NBFC behaviour for development and testing.
 *
 * Decision logic (mirrors a typical risk model):
 *   score > 60  → approved within simulated 24h
 *   score 40-60 → pending (manual review)
 *   score < 40  → rejected immediately
 */
export class StubNbfcPartner implements NbfcPartner {
  readonly name = 'stub-nbfc';

  async applyForCredit(application: CreditApplication): Promise<ApplicationRecord> {
    logger.info('[StubNbfcPartner] applyForCredit — would POST to real NBFC API', {
      merchantId: application.merchantId,
      requestedAmount: application.requestedAmount,
      tenor: application.tenor,
      purpose: application.purpose,
      creditScore: application.creditScore,
      // NOTE: sensitive fields (gstin, merchantName) would be transmitted securely
    });

    const now = new Date().toISOString();
    const applicationId = `STUB-APP-${Date.now()}-${randomUUID().replace(/-/g, '').slice(2, 6).toUpperCase()}`;

    let status: ApplicationStatus;
    let approvedAmount: number | undefined;
    let rejectionReason: string | undefined;

    if (application.creditScore > 60) {
      status = 'approved';
      approvedAmount = application.requestedAmount;
    } else if (application.creditScore >= 40) {
      status = 'under_review';
    } else {
      status = 'rejected';
      rejectionReason = 'Credit score below minimum threshold for NBFC facility';
    }

    const record: ApplicationRecord = {
      ...application,
      applicationId,
      status,
      approvedAmount,
      rejectionReason,
      createdAt: now,
      updatedAt: now,
    };

    logger.info('[StubNbfcPartner] application created (stub)', {
      applicationId,
      status,
      approvedAmount,
    });

    return record;
  }

  async checkStatus(applicationId: string): Promise<ApplicationStatus> {
    logger.info('[StubNbfcPartner] checkStatus — would GET from real NBFC API', {
      applicationId,
    });

    // Stub: applications prefixed STUB-APP are always treated as approved
    if (applicationId.startsWith('STUB-APP-')) {
      return 'approved';
    }

    return 'pending';
  }

  async disburse(request: DisbursementRequest): Promise<Disbursement> {
    logger.info('[StubNbfcPartner] disburse — would POST to real NBFC disbursal API', {
      applicationId: request.applicationId,
      amount: request.amount,
      merchantId: request.merchantId,
    });

    const disbursement: Disbursement = {
      disbursementId: `STUB-DISB-${Date.now()}`,
      applicationId: request.applicationId,
      amount: request.amount,
      status: 'completed',
      transactionRef: `STUB-TXN-${Date.now()}`,
      disbursedAt: new Date().toISOString(),
    };

    logger.info('[StubNbfcPartner] disbursement simulated (stub)', disbursement);
    return disbursement;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns the configured NBFC partner.
 * Swap the implementation here when a real partner is onboarded:
 *
 *   if (partner === 'lendingkart') return new LendingkartPartner();
 *   if (partner === 'flexiloans') return new FlexiloansPartner();
 */
export function getNbfcPartner(): NbfcPartner {
  const partner = process.env.NBFC_PARTNER ?? 'stub';

  if (partner !== 'stub') {
    logger.warn(`[getNbfcPartner] Unknown NBFC_PARTNER "${partner}" — falling back to stub`);
  }

  return new StubNbfcPartner();
}

// Re-export for use from other modules without re-importing the factory
export { getNbfcPartner as default };
