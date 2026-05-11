/**
 * User Response Normalization Utility
 *
 * AC2-H1 fix: The backend exposes THREE different user-response shapes across three endpoints:
 *   1. GET /api/user/profile  → flat: { id, name, email, phone, profilePicture, isVerified }
 *   2. GET /api/user/auth/me  → nested: { id, phoneNumber, email, profile, preferences, wallet, role, ... }
 *   3. GET /api/user/boot     → grouped: { profile: {...firstName...}, wallet, cart: {itemCount}, notifications: {unreadCount} }
 *
 * This utility normalizes all three shapes to a single CanonicalUserProfile so that
 * consumer code can work with a consistent interface regardless of which endpoint was called.
 *
 * Usage:
 *   import { normalizeUserResponse } from '@rez/shared';
 *   const user = normalizeUserResponse(rawApiResponse);
 */
export interface UserProfileShape1 {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
    isVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface UserProfileShape2 {
    id: string;
    _id?: string;
    phoneNumber?: string;
    email?: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: string;
        location?: Record<string, unknown>;
    };
    preferences?: Record<string, unknown>;
    wallet?: Record<string, unknown>;
    role?: string;
    isVerified?: boolean;
    isOnboarded?: boolean;
    createdAt?: string;
    updatedAt?: string;
    statedIdentity?: string;
    featureLevel?: string;
    segment?: string;
    verificationSegment?: string;
    instituteStatus?: string;
    activeZones?: string[];
    verifications?: Record<string, unknown>;
}
export interface UserProfileShape3 {
    profile?: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        isOnboarded?: boolean;
        subscription?: {
            tier?: string;
        };
        auth?: {
            isVerified?: boolean;
        };
    };
    wallet?: {
        coins?: Array<{
            type: string;
            amount: number;
        }>;
        balance?: {
            total?: number;
            available?: number;
        };
        brandedCoinsTotal?: number;
    };
    cart?: {
        itemCount?: number;
    };
    notifications?: {
        unreadCount?: number;
    };
}
/**
 * Extract a stable string id from any entity that may have `id`, `_id`, or
 * other id-like fields. MongoDB documents use `_id` while API responses use
 * `id` — this utility normalises both to a single canonical string id.
 *
 * Usage:
 *   import { normalizeUserId } from '@rez/shared';
 *   const userId = normalizeUserId(user); // always returns string
 */
export declare function normalizeUserId(entity: {
    id?: string;
    _id?: string;
} | null | undefined): string;
export interface CanonicalUserProfile {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    isVerified: boolean;
    isOnboarded: boolean;
    role?: string;
    loyaltyTier?: string;
    walletBalance?: number;
    coinBalance?: number;
    cartItemCount?: number;
    unreadNotificationCount?: number;
    createdAt?: string;
    updatedAt?: string;
}
/**
 * Detect which shape a response matches and normalize it to CanonicalUserProfile.
 * Returns null if the input cannot be matched to any known shape.
 */
export declare function normalizeUserResponse(raw: Partial<UserProfileShape1 | UserProfileShape2 | UserProfileShape3 | unknown> | null): CanonicalUserProfile | null;
