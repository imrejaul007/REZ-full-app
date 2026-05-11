export interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
export declare function generateQRCode(data: string, options?: QRCodeOptions): Promise<string>;
export declare function generateQRCodeBuffer(data: string, options?: QRCodeOptions): Promise<Buffer>;
export declare function generateQRSvg(data: string, options?: QRCodeOptions): Promise<string>;
export declare function batchGenerateQRCodes(items: Array<{
    serial: string;
    signature: string;
    baseUrl?: string;
}>, options?: QRCodeOptions): Promise<Array<{
    serial: string;
    qrBase64: string;
}>>;
export interface QRSheetItem {
    serial: string;
    signature: string;
    productName?: string;
    brandName?: string;
}
export declare function generateQRSheet(items: QRSheetItem[], options?: QRCodeOptions): Promise<{
    totalItems: number;
    qrCodes: Array<{
        serial: string;
        qrBase64: string;
    }>;
}>;
//# sourceMappingURL=qr.d.ts.map