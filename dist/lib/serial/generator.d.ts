export declare function generateSerialNumber(brandPrefix: string, productCode: string): string;
export declare function generateSignature(serialNumber: string, secretKey: string): string;
export declare function verifySignature(serialNumber: string, signature: string, secretKey: string): boolean;
export declare function generateBatchId(): string;
export declare function generateSerialBatch(brandPrefix: string, productCode: string, quantity: number, secretKey: string): Array<{
    serial: string;
    signature: string;
    batchId: string;
}>;
export declare function parseSerialNumber(serial: string): {
    prefix: string;
    brand: string;
    product: string;
    random: string;
} | null;
export declare function generateQRContent(serialNumber: string, signature: string, baseUrl?: string): string;
export declare function generateQRData(serialNumber: string, signature: string, brandName: string, productName: string): {
    serial: string;
    signature: string;
    brand: string;
    product: string;
    qrUrl: string;
    createdAt: string;
};
//# sourceMappingURL=generator.d.ts.map