export interface Serial {
    id: string;
    productId: string;
    serialNumber: string;
    signature: string;
    batchId?: string;
    batchName?: string;
    status: SerialStatus;
    firstScanAt?: Date;
    firstUserId?: string;
    scanCount: number;
    isGenuine: boolean;
    lastScannedAt?: Date;
    createdAt: Date;
}
export declare enum SerialStatus {
    CREATED = "CREATED",
    ACTIVE = "ACTIVE",
    SCANNED_FIRST = "SCANNED_FIRST",
    MULTI_SCAN = "MULTI_SCAN",
    FLAGGED = "FLAGGED",
    EXPIRED = "EXPIRED",
    INVALID = "INVALID"
}
export interface SerialBatch {
    batchId: string;
    productId: string;
    brandId: string;
    totalSerials: number;
    generatedAt: Date;
    serials: SerialGenerationItem[];
}
export interface SerialGenerationItem {
    serial: string;
    signature: string;
    qrDataUrl?: string;
}
export interface SerialLookupResult {
    found: boolean;
    serial?: Serial;
    product?: {
        id: string;
        name: string;
        brand: {
            id: string;
            name: string;
            slug: string;
        };
    };
    error?: string;
}
export interface SerialScanResult {
    serial: Serial;
    verification: {
        status: VerificationStatus;
        message: string;
        firstScan: boolean;
        scanCount: number;
    };
    product?: {
        id: string;
        name: string;
        brand: string;
        image?: string;
    };
    fraud?: {
        score: number;
        decision: FraudDecision;
        reasons: string[];
    };
    reward?: {
        eligible: boolean;
        campaign?: Campaign;
        amount?: number;
        coinType: CoinType;
    };
    ownership?: {
        alreadyOwned: boolean;
        ownedBy?: string;
        scannedAt?: Date;
    };
}
export type VerificationStatus = 'VERIFIED' | 'ALREADY_SCANNED' | 'SUSPICIOUS' | 'FAKE' | 'FLAGGED' | 'EXPIRED';
export type FraudDecision = 'ALLOW' | 'FLAG' | 'BLOCK';
export type CoinType = 'BRANDED' | 'REZ';
import type { Campaign } from './campaign';
//# sourceMappingURL=serial.d.ts.map