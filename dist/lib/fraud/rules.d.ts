export interface FraudRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    weight: number;
    threshold: number;
    windowMs: number;
    action: FraudAction;
    severity: FraudSeverity;
}
export type FraudAction = 'FLAG' | 'BLOCK' | 'ALLOW';
export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export declare const FRAUD_RULES: Record<string, FraudRule>;
export declare const FRAUD_DECISIONS: {
    ALLOW: number;
    FLAG: number;
    BLOCK: number;
};
export declare function getFraudDecision(score: number): FraudAction;
export declare function getSeverityFromScore(score: number): FraudSeverity;
//# sourceMappingURL=rules.d.ts.map