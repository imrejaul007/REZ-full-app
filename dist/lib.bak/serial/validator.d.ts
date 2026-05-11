export interface ValidationResult {
    valid: boolean;
    error?: string;
    parsed?: {
        prefix: string;
        brand: string;
        product: string;
        random: string;
    };
}
export declare function validateSerialFormat(serial: string): ValidationResult;
export declare function validateSignature(serial: string, signature: string, secretKey: string): ValidationResult;
export declare function validateSerial(serial: string, signature: string, secretKey: string): ValidationResult;
//# sourceMappingURL=validator.d.ts.map