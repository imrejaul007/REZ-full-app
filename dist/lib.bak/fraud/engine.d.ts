import { FraudAction, FraudSeverity } from './rules';
export interface FraudEngineInput {
    serialId: string;
    serialNumber: string;
    userId?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    fingerprint?: {
        browser?: string;
        os?: string;
        device?: string;
    };
}
export interface FraudEngineResult {
    allowed: boolean;
    score: number;
    decision: FraudAction;
    severity: FraudSeverity;
    triggeredRules: string[];
    reasons: string[];
    flagId?: string;
}
export declare function runFraudCheck(input: FraudEngineInput): Promise<FraudEngineResult>;
export declare function resolveFraudFlag(flagId: string, resolution: 'CONFIRMED' | 'DISMISSED', resolvedBy: string, notes?: string): Promise<void>;
export declare function getFraudStats(brandId: string, days?: number): Promise<{
    totalFlags: any;
    bySeverity: any;
    byReason: any;
}>;
//# sourceMappingURL=engine.d.ts.map