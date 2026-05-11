/**
 * Credit Client - Service-to-service client for REZ Wallet Credit Service
 *
 * Used by vertical services to check BNPL eligibility, create BNPL transactions,
 * and record repayments.
 */
export type CreditVertical = 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c';
export interface BNPLApplyParams {
    userId: string;
    phone: string;
    merchantId: string;
    merchantName?: string;
    vertical: CreditVertical;
    amount: number;
}
export interface BNPLRepayParams {
    userId: string;
    transactionId: string;
    amount: number;
}
export interface BNPLEligibilityParams {
    userId: string;
    phone: string;
    amount: number;
}
export interface CreditSummaryParams {
    userId: string;
    phone: string;
}
export interface CreditClientConfig {
    baseUrl?: string;
    internalToken?: string;
    serviceName?: string;
    timeout?: number;
}
export declare class CreditClient {
    private baseUrl;
    private internalToken;
    private serviceName;
    private timeout;
    constructor(config?: CreditClientConfig);
    /**
     * Check BNPL eligibility for a user
     */
    checkEligibility(params: BNPLEligibilityParams): Promise<{
        eligible: boolean;
        reason?: string;
        approvedAmount?: number;
        interestRate?: number;
        dueDate?: Date;
    }>;
    /**
     * Create a BNPL transaction
     */
    applyBNPL(params: BNPLApplyParams): Promise<{
        _id: string;
        userId: string;
        amount: number;
        totalDue: number;
        dueDate: Date;
        status: string;
    }>;
    /**
     * Repay a BNPL transaction
     */
    repayBNPL(params: BNPLRepayParams): Promise<{
        _id: string;
        status: string;
        totalDue: number;
    }>;
    /**
     * Get active BNPL transactions for a user
     */
    getActiveBNPLs(userId: string): Promise<any[]>;
    /**
     * Get credit score summary for a user
     */
    getCreditSummary(params: CreditSummaryParams): Promise<{
        compositeScore: number;
        riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
        creditLimit: number;
        creditUsed: number;
        creditAvailable: number;
        interestRate: number;
        activeBNPLCount: number;
        totalOutstanding: number;
    }>;
}
export declare function getCreditClient(): CreditClient;
