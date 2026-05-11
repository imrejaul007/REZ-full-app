export interface EligibilityCheck {
    userId: string;
    brandId: string;
    productId?: string;
    serialId?: string;
    location?: {
        city?: string;
        country?: string;
        lat?: number;
        lng?: number;
    };
    time?: Date;
}
export declare function checkRewardEligibility(check: EligibilityCheck): Promise<{
    eligible: boolean;
    campaignId?: string;
    rewardAmount?: number;
    coinType?: 'BRANDED' | 'REZ';
    reason?: string;
}>;
//# sourceMappingURL=eligibility.d.ts.map