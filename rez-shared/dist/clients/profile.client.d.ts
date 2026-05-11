/**
 * Profile Client - Service-to-service client for REZ Auth Profile Service
 *
 * Used by all vertical services to record user transactions and engagement
 * after successful order/payment completion.
 */
export type Vertical = 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c';
export interface ProfileTransactionParams {
    userId: string;
    phone: string;
    vertical: Vertical;
    amount: number;
    merchantId: string;
    category?: string;
}
export interface ProfileEngagementParams {
    userId: string;
    phone: string;
}
export interface ProfileSummaryParams {
    userId: string;
    phone: string;
}
export interface ProfileClientConfig {
    baseUrl?: string;
    internalToken?: string;
    serviceName?: string;
    timeout?: number;
}
export declare class ProfileClient {
    private baseUrl;
    private internalToken;
    private serviceName;
    private timeout;
    constructor(config?: ProfileClientConfig);
    /**
     * Record a transaction after successful order/payment completion
     */
    recordTransaction(params: ProfileTransactionParams): Promise<void>;
    /**
     * Record user engagement (app open, etc.)
     */
    recordEngagement(params: ProfileEngagementParams): Promise<void>;
    /**
     * Get user profile summary
     */
    getProfileSummary(params: ProfileSummaryParams): Promise<{
        userId: string;
        phone: string;
        totalLifetimeSpend: number;
        totalTransactions: number;
        averageOrderValue: number;
        lifetimeValue: number;
        engagementScore: number;
        tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    }>;
}
export declare function getProfileClient(): ProfileClient;
