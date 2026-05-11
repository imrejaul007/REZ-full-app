import { Campaign, CampaignType } from '@prisma/client';
export interface CreateCampaignInput {
    brandId: string;
    productId?: string;
    name: string;
    description?: string;
    type: CampaignType;
    rewardAmount: number;
    cap?: number;
    startDate: Date;
    endDate?: Date;
    targeting?: {
        locations?: string[];
        timeSlots?: string[];
        deviceTypes?: string[];
    };
}
export interface CampaignEligibility {
    eligible: boolean;
    reason?: string;
    boostMultiplier?: number;
}
export declare function createCampaign(input: CreateCampaignInput): Promise<Campaign>;
export declare function activateCampaign(campaignId: string): Promise<Campaign>;
export declare function pauseCampaign(campaignId: string): Promise<Campaign>;
export declare function checkEligibility(campaignId: string, userId: string, location?: {
    city?: string;
    country?: string;
}): Promise<CampaignEligibility>;
export declare function getBestCampaign(brandId: string, productId?: string, location?: {
    city?: string;
}): Promise<Campaign | null>;
//# sourceMappingURL=manager.d.ts.map