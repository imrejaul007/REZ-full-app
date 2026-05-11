import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { optionalAuth } from '../middleware/auth';
import { searchLimiter, autocompleteLimiter } from '../middleware/rateLimiter';
import * as searchService from '../services/searchService';
import { track } from '../services/intentCaptureService';
import { sendSearchToRezMind } from '../services/rezMindService';
import { logSearchQuery, logSearchClick, logSearchNoResults } from '../services/eventLoggingService';

// AuthenticatedRequest extends Express.Request to include userId set by optionalAuth.
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// StoreCategory mirrors the embedded category shape in store documents.
interface StoreCategory {
  _id?: mongoose.Types.ObjectId;
  name?: string;
  slug?: string;
}

// SuggestionStoreDoc: minimal store projection used in the suggestions endpoint.
interface SuggestionStoreDoc {
  _id: unknown;
  name?: string;
  logo?: string;
}

// SuggestionCategoryDoc: minimal category projection used in the suggestions endpoint.
interface SuggestionCategoryDoc {
  _id: unknown;
  name?: string;
}

const router = Router();

// ── Store search ──────────────────────────────────────────────
// Native:  /search/stores
// Compat:  /api/stores/search  (monolith path — used by consumer app)
async function storeSearchHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { q, search, lat, lng, radius, category, page, limit } = req.query;
    // SS-01: Never accept userId from query — use the authenticated user's ID only.
    // Callers cannot impersonate other users to influence personalised results.
    const userId = req.userId;
    const queryStr = (q || search) as string;
    const startTime = Date.now();

    const parsedPage  = page  ? Math.max(1, parseInt(page  as string)) : 1;
    const parsedLimit = limit ? Math.min(Math.max(1, parseInt(limit as string)), 100) : 20;
    const result = await searchService.searchStores({
      query: queryStr,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : undefined,
      category: category as string,
      page: parsedPage,
      limit: parsedLimit,
      userId,
    });

    const latencyMs = Date.now() - startTime;

    res.json({ success: true, data: result });
    track({ userId: req.userId, event: 'search:store', intentKey: `search_store_${queryStr}`, properties: { query: queryStr, category, resultCount: result.total } }).catch(() => {});

    // Log search events to REZ Event Platform
    if (queryStr) {
      // Log search.query
      logSearchQuery({
        userId,
        query: queryStr,
        results: result.total,
        filters: { category, lat, lng, radius },
        latencyMs,
      }).catch(() => {});

      // Log search.no_results if no results
      if (result.total === 0) {
        logSearchNoResults({
          userId,
          query: queryStr,
          filters: { category, lat, lng, radius },
        }).catch(() => {});
      }
    }

    // REZ Mind Integration
    if (req.userId && queryStr) {
      sendSearchToRezMind({
        user_id: req.userId,
        query: queryStr,
        results_count: result.total,
      }).catch(() => {});
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/search/stores', optionalAuth, searchLimiter, storeSearchHandler);
router.get('/api/stores/search', optionalAuth, searchLimiter, storeSearchHandler);
router.get('/api/stores/search/advanced', optionalAuth, searchLimiter, storeSearchHandler);

// ── Nearby stores ─────────────────────────────────────────────
// Compat: /api/stores/nearby (monolith path)
router.get('/api/stores/nearby', optionalAuth, searchLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lat, lng, radius, limit } = req.query;
    // SS-01: userId from auth only — reject caller-supplied spoofed userId
    const userId = req.userId;
    const result = await searchService.searchStores({
      query: '',
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 5000,
      page: 1,
      limit: limit ? Math.min(Math.max(1, parseInt(limit as string)), 100) : 20,
      userId,
    });
    res.json({ success: true, data: result });
    const nearbyKey = lat && lng ? `search_nearby_${lat}_${lng}` : 'search_nearby_unknown';
    track({ userId: req.userId, event: 'search:nearby', intentKey: nearbyKey, properties: { lat, lng, radius, resultCount: result.total } }).catch(() => {});
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Product search ────────────────────────────────────────────
// Native:  /search/products
// Compat:  /api/products/search (monolith path)
// Filters: q, storeId, category (slug), categoryId (ObjectId), minPrice, maxPrice, page, limit
async function productSearchHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { q, storeId, category, categoryId, minPrice, maxPrice, page, limit } = req.query;
    const queryStr = q as string;
    const startTime = Date.now();

    const parsedPage  = page  ? Math.max(1, parseInt(page  as string)) : 1;
    const parsedLimit = limit ? Math.min(Math.max(1, parseInt(limit as string)), 100) : 20;
    const result = await searchService.searchProducts({
      query:      queryStr,
      storeId:    storeId as string,
      category:   category as string,
      categoryId: categoryId as string | undefined,
      minPrice:   minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice:   maxPrice ? parseFloat(maxPrice as string) : undefined,
      page:       parsedPage,
      limit:      parsedLimit,
    });

    const latencyMs = Date.now() - startTime;

    res.json({ success: true, data: result });
    track({ userId: req.userId, event: 'search:product', intentKey: `search_product_${queryStr}`, properties: { query: queryStr, category, resultCount: result.total } }).catch(() => {});

    // Log search events to REZ Event Platform
    if (queryStr) {
      // Log search.query
      logSearchQuery({
        userId: req.userId,
        query: queryStr,
        results: result.total,
        filters: { category, storeId, minPrice, maxPrice },
        latencyMs,
      }).catch(() => {});

      // Log search.no_results if no results
      if (result.total === 0) {
        logSearchNoResults({
          userId: req.userId,
          query: queryStr,
          filters: { category, storeId },
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    const status = err.message?.startsWith('Invalid categoryId') ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
}
router.get('/search/products', optionalAuth, searchLimiter, productSearchHandler);
router.get('/api/products/search', optionalAuth, searchLimiter, productSearchHandler);

// ── Search filters ────────────────────────────────────────────
// Returns available categories and price range for the product filter UI.
// Native:  /search/filters
// Compat:  /api/products/filters
async function filtersHandler(req: Request, res: Response) {
  try {
    const result = await searchService.getProductFilters();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/search/filters', searchLimiter, filtersHandler);
router.get('/api/products/filters', searchLimiter, filtersHandler);

// ── Trending Stores ───────────────────────────────────────────
// Native:  /search/trending
// Compat:  /api/stores/trending  (monolith path — used by consumer app)
async function trendingStoresHandler(req: Request, res: Response) {
  try {
    const rawLimit = parseInt(req.query.limit as string);
    const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 20);
    const result = await searchService.getTrendingStores(limit);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/search/trending', searchLimiter, trendingStoresHandler);
router.get('/api/stores/trending', searchLimiter, trendingStoresHandler);

// ── Trending by Category ──────────────────────────────────────
// GET /search/trending-by-category
// Returns top 5 categories, each with their top 3 trending stores from the
// last 7 days. In-memory cache with 10-minute TTL.
router.get('/search/trending-by-category', searchLimiter, async (_req: Request, res: Response) => {
  try {
    const result = await searchService.getTrendingByCategory();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Search Suggestions ────────────────────────────────────────
// GET /search/suggestions?q=<query>
// Fast prefix-match on store names and category names; up to 8 results.
// In-memory cache with 60s TTL keyed by lowercase q.

interface SuggestionEntry {
  type: 'store' | 'category';
  id: string;
  name: string;
  logo?: string;
}

interface SuggestionCacheItem {
  data: SuggestionEntry[];
  expiresAt: number;
}

const MAX_CACHE_SIZE = 500;
// ROUTE-SEC-013 FIX: Bounded cache — evict oldest entries when cache is full.
// SEA-007 FIX: O(n) eviction removed from the hot path. Eviction now runs:
//   1. Timer: every 60 s, stale entries are evicted (amortised O(n/60s) per request).
//   2. Write-path: if over MAX_CACHE_SIZE, a single oldest entry is removed (O(1)).
const suggestionsCache = new Map<string, SuggestionCacheItem>();

// Timer-based stale eviction — runs every 60 seconds, not on every request.
const _evictionTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of suggestionsCache) {
    if (entry.expiresAt <= now) {
      suggestionsCache.delete(key);
    }
  }
}, 60_000);
_evictionTimer.unref();

// On write: if over limit, evict exactly one oldest entry (Map insertion-order = LRU).
function evictOverflow(): void {
  if (suggestionsCache.size >= MAX_CACHE_SIZE) {
    const first = suggestionsCache.keys().next().value;
    if (first) suggestionsCache.delete(first);
  }
}

router.get('/search/suggestions', autocompleteLimiter, async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined) ?? '';

    if (!q || q.length < 2) {
      res.status(400).json({ success: false, error: 'q must be at least 2 characters' });
      return;
    }

    const cacheKey = q.toLowerCase();
    const now = Date.now();
    // SEA-007 FIX: O(1) overflow check instead of O(n) eviction on every miss.
    evictOverflow();
    const cached = suggestionsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.json({ success: true, data: cached.data });
      return;
    }

    // Escape regex special characters
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixRegex = new RegExp(`^${escaped}`, 'i');

    const Stores     = mongoose.connection.collection('stores');
    const Categories = mongoose.connection.collection('categories');

    const [storeDocs, categoryDocs] = await Promise.all([
      Stores.find({ name: prefixRegex, isActive: true })
        .project({ _id: 1, name: 1, logo: 1 })
        .limit(8)
        .toArray(),
      Categories.find({ name: prefixRegex })
        .project({ _id: 1, name: 1 })
        .limit(8)
        .toArray(),
    ]);

    const suggestions: SuggestionEntry[] = [];

    for (const s of storeDocs as SuggestionStoreDoc[]) {
      if (suggestions.length >= 8) break;
      const entry: SuggestionEntry = {
        type: 'store',
        id:   String(s._id),
        name: s.name ?? '',
      };
      if (s.logo) entry.logo = s.logo;
      suggestions.push(entry);
    }

    for (const c of categoryDocs as SuggestionCategoryDoc[]) {
      if (suggestions.length >= 8) break;
      suggestions.push({
        type: 'category',
        id:   String(c._id),
        name: c.name ?? '',
      });
    }

    // Cache for 60s
    suggestionsCache.set(cacheKey, { data: suggestions, expiresAt: now + 60_000 });

    // FIX: Normalize response format to match other endpoints ({ success: true, data: ... })
    res.json({ success: true, data: suggestions });
    track({ userId: req.userId, event: 'search:suggest', intentKey: `search_suggest_${q}`, properties: { query: q, resultCount: suggestions.length } }).catch(() => {});
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Autocomplete ──────────────────────────────────────────────
// Native:  /search/suggest
// Compat:  /api/search/autocomplete (monolith path)
//
// Sprint 3: upgraded to fuzzy + category-aware autocomplete with 5-min Redis cache.
// Response format: { stores: [], categories: [], products: [] }
async function autocompleteHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { q, limit } = req.query;
    const parsedLimit = limit ? Math.min(Math.max(1, parseInt(limit as string)), 20) : 5;
    const result = await searchService.getAutocomplete(q as string, parsedLimit);
    res.json({ success: true, data: result });
    track({ userId: req.userId, event: 'search:autocomplete', intentKey: `search_autocomplete_${q as string}`, properties: { query: q, resultCount: (result.stores?.length ?? 0) + (result.categories?.length ?? 0) + (result.products?.length ?? 0) } }).catch(() => {});
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/search/suggest', autocompleteLimiter, autocompleteHandler);
router.get('/api/search/autocomplete', autocompleteLimiter, autocompleteHandler);
router.get('/search/autocomplete', autocompleteLimiter, autocompleteHandler);

// ── Search Click Tracking ──────────────────────────────────────
// POST /search/click - Track when user clicks on a search result
interface ClickRequest {
  query: string;
  itemId: string;
  position: number;
  type?: 'store' | 'product' | 'category';
}

router.post('/search/click', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, itemId, position, type = 'store' } = req.body as ClickRequest;

    if (!query || !itemId || position === undefined) {
      res.status(400).json({ success: false, error: 'query, itemId, and position are required' });
      return;
    }

    // Log click event to REZ Event Platform
    logSearchClick({
      userId: req.userId,
      query,
      results: 0,
      clickPosition: position,
      clickedItemId: itemId,
    }).catch(() => {});

    // Also track in intent capture
    track({
      userId: req.userId,
      event: 'search:click',
      intentKey: `search_click_${query}`,
      properties: { query, itemId, position, type },
    }).catch(() => {});

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
