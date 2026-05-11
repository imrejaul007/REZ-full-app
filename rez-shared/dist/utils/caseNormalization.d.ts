/**
 * Case Normalization Utilities
 *
 * FL-08 fix: Backend frequently sends SCREAMING_CASE enum values (e.g. 'NEW_USER',
 * 'CONFIRMED', 'LUCKY_DRAW') while consumer code expects snake_case/camelCase (e.g.
 * 'new_user', 'confirmed', 'lucky_draw').
 *
 * These utilities ensure consistent case handling at the API boundary so that
 * conditional checks never silently fail due to case mismatches.
 *
 * Usage:
 *   import { normalizeCase, camelToSnake, snakeToCamel, screamingToSnake } from '@rez/shared';
 *
 *   // Convert SCREAMING_CASE to snake_case
 *   normalizeCase('NEW_USER')        // → 'new_user'
 *   normalizeCase('LUCKY_DRAW')      // → 'lucky_draw'
 *
 *   // Convert camelCase to snake_case
 *   camelToSnake('newUser')          // → 'new_user'
 *   camelToSnake('campaignType')      // → 'campaign_type'
 *
 *   // Convert snake_case to camelCase
 *   snakeToCamel('new_user')          // → 'newUser'
 *   snakeToCamel('campaign_type')    // → 'campaignType'
 *
 *   // Normalize a field key in an object
 *   normalizeKeys(obj, screamingToSnake)  // → all keys converted
 */
/**
 * Convert a SCREAMING_CASE string to snake_case.
 * 'NEW_USER' → 'new_user'
 * 'LUCKY_DRAW' → 'lucky_draw'
 * 'CONFIRMED' → 'confirmed'
 * Already lowercase/snake strings pass through unchanged.
 */
export declare function screamingToSnake(value: string): string;
/**
 * Convert a camelCase string to snake_case.
 * 'newUser' → 'new_user'
 * 'campaignType' → 'campaign_type'
 */
export declare function camelToSnake(value: string): string;
/**
 * Convert a snake_case string to camelCase.
 * 'new_user' → 'newUser'
 * 'campaign_type' → 'campaignType'
 */
export declare function snakeToCamel(value: string): string;
/**
 * Universal normalizer: converts any common case variant to lowercase snake_case.
 * Handles SCREAMING_CASE, camelCase, and already-normalized snake_case.
 * 'NEW_USER' | 'newUser' | 'new_user' | 'NewUser' → 'new_user'
 */
export declare function normalizeCase(value: string): string;
/**
 * Apply a transformation function to every key in a plain object.
 * Useful for normalizing API response field names.
 *
 * @param obj - The object whose keys to transform
 * @param fn  - The transformation function (e.g. screamingToSnake, camelToSnake)
 * @returns A new object with transformed keys (does not mutate the original)
 */
export declare function normalizeKeys<T extends Record<string, unknown>>(obj: T, fn: (key: string) => string): Record<string, unknown>;
/**
 * Normalize an enum value from backend (any case) to canonical lowercase value.
 * Returns the original value if it's already a known valid value, otherwise
 * tries to normalize it.
 *
 * @param raw    - The raw value from backend
 * @param valid  - Array of valid canonical (lowercase snake_case) values
 */
export declare function normalizeEnumValue(raw: string | undefined, valid: string[]): string;
/**
 * FL-16 fix: Extract the canonical `value` from an offer object, handling
 * inconsistent field names used across the codebase:
 *   - `value`             → canonical (preferred)
 *   - `cashbackPercentage` → backend field name (alias for `value`)
 *   - `discountValue`     → consumer Deal.ts field
 *   - `cashbackAmount`    → consumer cash-store.types.ts field
 *   - `offerValue`        → various components
 *
 * All consumer code should use this function instead of accessing any of the
 * above fields directly.
 *
 * @param offer - A raw offer object from any source (backend API, mock data, etc.)
 * @returns The numeric offer value, or 0 if not found
 */
export declare function getOfferValue(offer: Record<string, unknown> | null | undefined): number;
