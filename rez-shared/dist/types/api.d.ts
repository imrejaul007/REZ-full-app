/**
 * Canonical API response types for all REZ apps.
 *
 * These types are a superset of both merchant and admin app formats.
 * Backend may return either nested or flat pagination — consumers should
 * handle both via the helper functions below.
 */
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    timestamp?: string;
    /** Flat pagination (admin-style) — some endpoints return this at the top level */
    pagination?: Pagination;
}
/**
 * Paginated response with nested data.items[] (merchant-style).
 * Some endpoints return this shape; others return flat ApiResponse with pagination.
 */
export interface PaginatedResponse<T = unknown> {
    success: boolean;
    message?: string;
    data: {
        items: T[];
        pagination: Pagination;
    };
}
export interface ApiError {
    message: string;
    code?: string;
    details?: unknown;
    statusCode?: number;
    timestamp?: string;
}
/** Extract items array from either response format */
export declare function getItems<T>(response: PaginatedResponse<T> | ApiResponse<T[]>): T[];
/** Extract pagination from either response format */
export declare function getPagination(response: PaginatedResponse<any> | ApiResponse<any>): Pagination | null;
