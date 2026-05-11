import { Reward } from '@prisma/client';
export interface IssueRewardInput {
    serialId: string;
    brandId: string;
    userId: string;
    campaignId?: string;
    amount: number;
    coinType: 'BRANDED' | 'REZ';
    expiresInDays?: number;
}
export interface IssueRewardResult {
    success: boolean;
    reward?: Reward;
    error?: string;
}
export declare function issueReward(input: IssueRewardInput): Promise<IssueRewardResult>;
export declare function claimReward(rewardId: string, userId: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
}>;
export declare function getUserRewards(userId: string, options?: {
    status?: string;
    limit?: number;
}): Promise<any>;
//# sourceMappingURL=issuer.d.ts.map