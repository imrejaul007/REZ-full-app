export interface WarrantyStatus {
    isValid: boolean;
    daysRemaining: number;
    expiresAt: Date;
    isClaimable: boolean;
    claimDeadline: Date;
}
export declare function getWarrantyStatus(serialId: string): Promise<WarrantyStatus | null>;
export declare function claimWarranty(serialId: string, userId: string, claimData: {
    issue: string;
    proof?: string;
    contactEmail?: string;
    contactPhone?: string;
}): Promise<{
    success: boolean;
    claimId?: string;
    error?: string;
}>;
export declare function getExpiringWarranties(userId: string, daysThreshold?: number): Promise<any>;
//# sourceMappingURL=warranty.d.ts.map