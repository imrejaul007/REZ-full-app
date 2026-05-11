import { FraudAction, FraudSeverity } from './rules';
export interface FraudCheckInput {
    serialId: string;
    userId?: string;
    deviceId?: string;
    ipAddress?: string;
    location?: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    userAgent?: string;
    fingerprint?: {
        browser?: string;
        os?: string;
        device?: string;
    };
    vpnDetected?: boolean;
    proxyDetected?: boolean;
    torDetected?: boolean;
}
export interface FraudCheckResult {
    score: number;
    decision: FraudAction;
    severity: FraudSeverity;
    triggeredRules: TriggeredRule[];
    details: FraudDetails;
}
export interface TriggeredRule {
    ruleId: string;
    ruleName: string;
    weight: number;
    threshold: number;
    actual: number;
    action: FraudAction;
    severity: FraudSeverity;
}
export interface FraudDetails {
    velocity?: {
        scans: number;
        windowHours: number;
    };
    travel?: {
        distanceKm: number;
        timeMinutes: number;
        speedKmh: number;
        previousLocation?: {
            lat: number;
            lng: number;
        };
        currentLocation?: {
            lat: number;
            lng: number;
        };
    };
    multiUser?: {
        count: number;
        users: string[];
    };
    vpn?: {
        detected: boolean;
    };
    proxy?: {
        detected: boolean;
    };
    tor?: {
        detected: boolean;
    };
    gps?: {
        accuracy: number;
        suspicious: boolean;
    };
    devicePatterns?: {
        count: number;
        patterns: string[];
    };
    ipGeo?: {
        mismatch: boolean;
        distanceKm: number;
    };
}
export declare function calculateFraudScore(input: FraudCheckInput, context: FraudContext): FraudCheckResult;
interface FraudContext {
    recentScansDevice?: Array<{
        timestamp: Date;
        serialId: string;
    }>;
    recentScansSerial?: Array<{
        timestamp: Date;
        userId: string;
        location?: {
            lat: number;
            lng: number;
        };
    }>;
    knownDevicePatterns?: string[];
}
export {};
//# sourceMappingURL=scoring.d.ts.map