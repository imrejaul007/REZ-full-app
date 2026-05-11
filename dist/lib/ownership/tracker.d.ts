export interface OwnershipRecord {
    id: string;
    serialId: string;
    userId: string;
    scannedAt: Date;
    purchaseProof: boolean;
    warrantyStart?: Date;
    warrantyEnd?: Date;
    warrantyClaimed: boolean;
    transferredAt?: Date;
    previousOwnerId?: string;
}
export interface CreateOwnershipInput {
    serialId: string;
    userId: string;
    warrantyMonths?: number;
}
export declare function recordOwnership(input: CreateOwnershipInput): Promise<OwnershipRecord>;
export declare function transferOwnership(serialId: string, fromUserId: string, toUserId: string): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function getUserOwnerships(userId: string, options?: {
    active?: boolean;
    limit?: number;
}): Promise<any>;
export declare function getOwnershipHistory(serialId: string): Promise<{
    current: any;
    history: any[];
}>;
//# sourceMappingURL=tracker.d.ts.map