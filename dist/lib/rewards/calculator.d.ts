export interface RewardCalculation {
    baseAmount: number;
    karmaMultiplier: number;
    loyaltyMultiplier: number;
    finalAmount: number;
    coinType: 'BRANDED' | 'REZ';
    breakdown: {
        brandReward: number;
        karmaBonus: number;
        loyaltyBonus: number;
        total: number;
    };
}
export declare function calculateReward(brandId: string, userId: string, karmaLevel: string, loyaltyTier: string, campaignId?: string): Promise<RewardCalculation>;
export declare function calculateRewardSimple(baseAmount: number, karmaMultiplier?: number, loyaltyMultiplier?: number): RewardCalculation;
export declare function getUserMultipliers(userId: string): Promise<{
    karmaMultiplier: number;
    loyaltyMultiplier: number;
    karmaLevel: string;
    loyaltyTier: string;
}>;
//# sourceMappingURL=calculator.d.ts.map