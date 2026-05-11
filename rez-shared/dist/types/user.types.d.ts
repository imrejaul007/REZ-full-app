/**
 * Canonical User types for the REZ platform.
 *
 * Source of truth: rezbackend/src/models/User.ts
 * Do NOT redefine these types in frontend apps — import from @rez/shared instead.
 */
export interface UserProfile {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    location?: {
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        coordinates?: [number, number];
    };
    verificationStatus?: 'pending' | 'approved' | 'rejected';
}
export interface UserPreferences {
    language?: string;
    theme?: 'light' | 'dark';
    notifications?: {
        push?: boolean;
        email?: boolean;
        sms?: boolean;
    };
}
export interface UserAuth {
    isVerified: boolean;
    isOnboarded?: boolean;
    lastLogin?: string;
}
export type UserRole = 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer';
export declare const USER_ROLES: readonly UserRole[];
export type RezPlusTier = 'free' | 'premium' | 'vip';
/** @deprecated use RezPlusTier */
export type NuqtaPlusTier = RezPlusTier;
export type PriveTier = 'none' | 'entry' | 'signature' | 'elite';
export interface User {
    _id: string;
    phoneNumber: string;
    email?: string;
    profile: UserProfile;
    preferences?: UserPreferences;
    auth: UserAuth;
    role: UserRole;
    isActive: boolean;
    isSuspended?: boolean;
    referralCode?: string;
    fullName?: string;
    username?: string;
    isPremium?: boolean;
    rezPlusTier?: RezPlusTier;
    status?: 'active' | 'suspended' | 'inactive';
    suspendedAt?: string;
    suspendReason?: string;
    referralTier?: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    premiumExpiresAt?: string;
    /** @deprecated use rezPlusTier */
    nuqtaPlusTier?: NuqtaPlusTier;
    priveTier?: PriveTier;
    activeZones?: string[];
    createdAt: string;
    updatedAt: string;
}
export declare function isUserRole(value: string): value is UserRole;
