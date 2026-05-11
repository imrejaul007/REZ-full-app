export interface BrandCoinConfig {
    coinName: string;
    coinSymbol: string;
    valuePerCoin: number;
    minRedeem: number;
    expiryDays: number;
    allowRedemption: boolean;
    allowConversion: boolean;
}
export declare function getBrandCoinConfig(brandId: string): Promise<BrandCoinConfig | null>;
export declare function updateBrandCoinConfig(brandId: string, config: Partial<BrandCoinConfig>): Promise<void>;
export declare function convertToReZCoins(userId: string, brandId: string, amount: number): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function redeemAtBrand(userId: string, brandId: string, amount: number, orderId?: string): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function getUserBrandedBalance(userId: string, brandId: string): Promise<number>;
//# sourceMappingURL=brandCoins.d.ts.map