import Redis from 'ioredis';
export declare function getRedisClient(): Redis;
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
export declare function cacheGet<T>(key: string): Promise<T | null>;
export declare function cacheSet(key: string, value: unknown, ttl?: number): Promise<void>;
export declare function cacheDelete(key: string): Promise<void>;
export declare function cacheDeletePattern(pattern: string): Promise<void>;
export declare function invalidateRelatedCache(prefix: string, identifiers: string[]): Promise<void>;
export declare const CacheTTL: {
    readonly SHORT: 60;
    readonly DEFAULT: 300;
    readonly LONG: 3600;
    readonly USER_PROFILE: 300;
    readonly MERCHANT_INFO: 600;
    readonly LEAD_SCORE: 180;
    readonly ANALYTICS: 60;
    readonly CONVERSATION: 1800;
};
export declare const CacheKeys: {
    readonly userProfile: (userId: string) => string;
    readonly merchantProfile: (merchantId: string) => string;
    readonly leadScore: (userId: string) => string;
    readonly conversation: (sessionId: string) => string;
    readonly analytics: (merchantId: string, type: string) => string;
    readonly searchResults: (query: string, filters: string) => string;
};
export declare function parsePaginationParams(query: Record<string, unknown>): PaginationParams;
export declare function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T>;
export declare function batchFind<T>(ids: string[], findFn: (ids: string[]) => Promise<T[]>, options?: {
    batchSize?: number;
}): Promise<Map<string, T>>;
export declare function memoizeWithTTL<T>(fn: () => T, key: string, ttl?: number): T;
export declare function createProjection<T extends Record<string, unknown>>(fields: (keyof T)[]): Record<string, 1>;
export declare function buildAggregationPipeline(matchStage: Record<string, unknown>, sortStage: Record<string, 1 | -1>, page: number, limit: number): Record<string, unknown>[];
//# sourceMappingURL=performance.d.ts.map