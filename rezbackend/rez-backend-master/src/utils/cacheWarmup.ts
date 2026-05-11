/**
 * Cache Warmup Utility
 *
 * Pre-populates Redis cache for high-traffic public endpoints on server startup.
 * Calls service/model layer directly (no HTTP) to populate cache via withCache().
 *
 * SCALEPILOT — warmup coverage:
 *   Warmed on startup : root categories, featured categories, featured products,
 *                       featured stores, all active banners, top-10 products by
 *                       rating, all active stores (first page).
 *
 *   NOT yet warmed (TODO at scale):
 *     - Per-user cart totals         — too many keys; warm on first login instead
 *     - Per-merchant dashboard stats — warm on merchant login or via cron
 *     - Search suggestions           — warm top-50 queries from analytics log
 *     - Flash sale stock counts      — warm 5 min before sale start via scheduled job
 *
 *   Cache hit rate target: >85% for public (unauthenticated) read endpoints.
 *   Monitor with: REDIS> INFO keyspace  and the /api/health/cache endpoint.
 */

import { withCache } from './cacheHelper';
import { CacheTTL } from '../config/redis';
import { logger } from '../config/logger';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Store } from '../models/Store';

export async function warmUpPublicCaches(): Promise<void> {
  const results = { success: 0, failed: 0 };

  const tasks: Array<{ name: string; fn: () => Promise<any> }> = [
    {
      name: 'root-categories',
      fn: () =>
        withCache('categories:root:/root:{}', CacheTTL.CATEGORY_LIST, async () => {
          return Category.find({ parentCategory: null, isActive: true })
            .select('name slug icon image type displayOrder')
            .sort({ displayOrder: 1 })
            .lean();
        }),
    },
    {
      name: 'featured-categories',
      fn: () =>
        withCache('categories:featured:/featured:{}', CacheTTL.CATEGORY_LIST, async () => {
          // Category uses metadata.featured (not a top-level isFeatured field).
          // The wrong field caused a full collection scan returning 0 results.
          return Category.find({ 'metadata.featured': true, isActive: true })
            .select('name slug icon image type displayOrder')
            .sort({ displayOrder: 1 })
            .limit(6)
            .lean();
        }),
    },
    {
      name: 'featured-products',
      fn: () =>
        withCache('products:featured:/featured:{}', CacheTTL.PRODUCT_FEATURED, async () => {
          return Product.find({ isFeatured: true, isActive: true })
            .select('name slug images price pricing rating reviewCount store category')
            .populate('store', 'name slug logo')
            .sort({ 'rating.average': -1 })
            .limit(10)
            .lean();
        }),
    },
    {
      name: 'featured-stores',
      fn: () =>
        withCache('stores:featured:/featured:{}', CacheTTL.STORE_LIST, async () => {
          return Store.find({ isFeatured: true, isActive: true })
            .select('name slug logo coverImage rating reviewCount tags category')
            .sort({ 'rating.average': -1 })
            .limit(10)
            .lean();
        }),
    },
    // ── SCALEPILOT: Additional high-traffic endpoints warmed on startup ────────
    {
      name: 'top-rated-products',
      fn: () =>
        withCache('products:top-rated:/top-rated:{}', CacheTTL.PRODUCT_FEATURED, async () => {
          return Product.find({ isActive: true })
            .select('name slug images price pricing rating reviewCount store category')
            .populate('store', 'name slug logo')
            .sort({ 'rating.average': -1, reviewCount: -1 })
            .limit(20)
            .lean();
        }),
    },
    {
      name: 'all-active-stores-page1',
      // First page of the store listing — most visited public page after home
      fn: () =>
        withCache('stores:list:/list:{"page":"1","limit":"20"}', CacheTTL.STORE_LIST, async () => {
          return Store.find({ isActive: true })
            .select('name slug logo coverImage rating reviewCount tags category isOpen')
            .sort({ 'rating.average': -1 })
            .limit(20)
            .lean();
        }),
    },
  ];

  // Run tasks sequentially to avoid hammering Atlas M0's shared I/O budget.
  // Parallel execution caused all 6 queries to compete simultaneously, pushing
  // every query into the 2–5 s range even when indexes exist.
  for (const task of tasks) {
    try {
      await task.fn();
      results.success++;
      logger.info(`[CACHE-WARMUP] ${task.name} — OK`);
    } catch (err) {
      results.failed++;
      logger.warn(`[CACHE-WARMUP] ${task.name} — FAILED:`, err instanceof Error ? err.message : err);
    }
  }

  logger.info(`[CACHE-WARMUP] Complete: ${results.success} OK, ${results.failed} failed`);
}
