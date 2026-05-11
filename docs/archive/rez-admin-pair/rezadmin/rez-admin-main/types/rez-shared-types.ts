/**
 * Re-exports canonical types from the local @rez/shared package.
 *
 * Previously these were inlined locally because this app had no npm dependency
 * on @rez/shared. Now that @rez/shared is added as a dependency, this file
 * acts as a compatibility shim: existing imports from './rez-shared-types' continue
 * to work unchanged while delegating to the canonical source.
 *
 * SD-08 / TF-10 fix: local copy now delegates to @rez/shared (local rez-shared).
 */

// ── Canonical types from @rez/shared ───────────────────────────────────────────
export type {
  Pagination,
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from '../../../rez-shared/src/types/api';

export { getItems, getPagination } from '../../../rez-shared/src/types/api';

// ── Coin types (from rez-shared/src/constants/coins.ts) ───────────────────────
export { COIN_TYPES, normalizeCoinType } from '../../../rez-shared/src/constants/coins';
export type { CoinType } from '../../../rez-shared/src/constants/coins';

// ── Wallet types (from rez-shared/src/types/wallet.ts) ───────────────────────
export type { WalletBalance, CoinTransaction } from '../../../rez-shared/src/types/wallet';

// ── Status normalizers (from rez-shared/src/statusCompat.ts) ──────────────────
export { normalizeOrderStatus, normalizePaymentStatus } from '../../../rez-shared/src/statusCompat';
