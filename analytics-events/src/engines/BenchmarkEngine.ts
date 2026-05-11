/**
 * BenchmarkEngine — Peer benchmarking computation for merchant analytics.
 *
 * Groups merchants by city + cuisineType + sizeCategory and computes
 * percentile rankings for key operational metrics. Results are cached
 * in-memory for 1 hour to avoid expensive re-aggregation.
 *
 * Privacy rule: minimum peer group size is 10 before any comparison is served.
 * Individual merchant data is NEVER exposed through peer-group endpoints.
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SizeCategory = 'small' | 'medium' | 'large';

export interface PeerGroup {
  city: string;
  cuisineType: string;
  sizeCategory: SizeCategory;
  merchantCount: number;
}

export interface BenchmarkMetricPoint {
  value: number;
  peerAvg: number;
  percentile: number;
}

export interface BenchmarkMetrics {
  merchantId: string;
  peerGroup: PeerGroup;
  foodCostPct: BenchmarkMetricPoint;
  avgOrderValue: BenchmarkMetricPoint;
  staffCostPct: BenchmarkMetricPoint;
  monthlyRevenue: BenchmarkMetricPoint;
  repeatCustomerRate: BenchmarkMetricPoint;
  computedAt: string;
}

export interface PeerGroupStats {
  city: string;
  cuisineType: string;
  merchantCount: number;
  avgFoodCostPct: number;
  avgOrderValue: number;
  avgStaffCostPct: number;
  avgMonthlyRevenue: number;
  avgRepeatCustomerRate: number;
  insufficient: boolean;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const benchmarkCache = new Map<string, CacheEntry<BenchmarkMetrics | null>>();
const peerGroupCache = new Map<string, CacheEntry<PeerGroupStats>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const MIN_PEER_GROUP_SIZE = 10;

// ── Size categorisation ───────────────────────────────────────────────────────

function categorizeMerchant(monthlyOrders: number): SizeCategory {
  if (monthlyOrders < 300) return 'small';
  if (monthlyOrders < 1500) return 'medium';
  return 'large';
}

// ── Percentile helper ─────────────────────────────────────────────────────────

/**
 * Computes what percentile `value` falls in relative to `peers`.
 * Returns 0-100 (higher = better position when metric is "higher is better").
 * For cost metrics the caller should invert: 100 - percentile.
 */
function computePercentile(value: number, peers: number[]): number {
  if (peers.length === 0) return 50;
  const below = peers.filter((p) => p < value).length;
  return Math.round((below / peers.length) * 100);
}

// ── Merchant profile resolution ───────────────────────────────────────────────

interface MerchantProfile {
  merchantId: string;
  city: string;
  cuisineType: string;
  monthlyOrders: number;
  monthlyRevenue: number;
  foodCostPct: number;
  avgOrderValue: number;
  staffCostPct: number;
  repeatCustomerRate: number;
}

/** Reads the latest aggregated snapshot for a merchant from merchantanalytics. */
async function resolveMerchantProfile(merchantId: string): Promise<MerchantProfile | null> {
  try {
    const col = mongoose.connection.collection('merchantanalytics');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Aggregate last 30 days of data for this merchant
    const pipeline = [
      { $match: { merchantId, date: { $gte: dateStr } } },
      {
        $group: {
          _id: '$merchantId',
          city: { $last: '$city' },
          cuisineType: { $last: '$cuisineType' },
          totalRevenue: { $sum: '$revenue' },
          totalOrders: { $sum: '$orderCount' },
          totalNew: { $sum: '$newCustomers' },
          totalReturning: { $sum: '$returningCustomers' },
          totalFoodCost: { $sum: '$foodCostAmount' },
          totalStaffCost: { $sum: '$staffCostAmount' },
        },
      },
    ];

    const [result] = await col.aggregate(pipeline).toArray() as any[];
    if (!result) return null;

    const totalOrders = result.totalOrders || 0;
    const totalRevenue = result.totalRevenue || 0;
    const totalCustomers = (result.totalNew || 0) + (result.totalReturning || 0);

    return {
      merchantId,
      city: (result.city || 'unknown').toLowerCase(),
      cuisineType: (result.cuisineType || 'other').toLowerCase(),
      monthlyOrders: totalOrders,
      monthlyRevenue: totalRevenue,
      foodCostPct: totalRevenue > 0 ? (result.totalFoodCost / totalRevenue) * 100 : 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      staffCostPct: totalRevenue > 0 ? (result.totalStaffCost / totalRevenue) * 100 : 0,
      repeatCustomerRate: totalCustomers > 0 ? (result.totalReturning / totalCustomers) * 100 : 0,
    };
  } catch (err: any) {
    logger.error('[BenchmarkEngine] resolveMerchantProfile failed', { merchantId, error: err.message });
    return null;
  }
}

/** Loads all peer profiles for a given city + cuisineType + sizeCategory. */
async function loadPeerProfiles(
  city: string,
  cuisineType: string,
  sizeCategory: SizeCategory,
  excludeMerchantId: string,
): Promise<MerchantProfile[]> {
  try {
    const col = mongoose.connection.collection('merchantanalytics');
    const dateStr = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

    const pipeline = [
      {
        $match: {
          city: { $regex: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          cuisineType: { $regex: new RegExp(`^${cuisineType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          date: { $gte: dateStr },
          merchantId: { $ne: excludeMerchantId },
        },
      },
      {
        $group: {
          _id: '$merchantId',
          city: { $last: '$city' },
          cuisineType: { $last: '$cuisineType' },
          totalRevenue: { $sum: '$revenue' },
          totalOrders: { $sum: '$orderCount' },
          totalNew: { $sum: '$newCustomers' },
          totalReturning: { $sum: '$returningCustomers' },
          totalFoodCost: { $sum: '$foodCostAmount' },
          totalStaffCost: { $sum: '$staffCostAmount' },
        },
      },
    ];

    const docs = await col.aggregate(pipeline).toArray() as any[];

    return docs.map((d) => {
      const revenue = d.totalRevenue || 0;
      const orders = d.totalOrders || 0;
      const customers = (d.totalNew || 0) + (d.totalReturning || 0);
      const profile: MerchantProfile = {
        merchantId: d._id,
        city: d.city || city,
        cuisineType: d.cuisineType || cuisineType,
        monthlyOrders: orders,
        monthlyRevenue: revenue,
        foodCostPct: revenue > 0 ? (d.totalFoodCost / revenue) * 100 : 0,
        avgOrderValue: orders > 0 ? revenue / orders : 0,
        staffCostPct: revenue > 0 ? (d.totalStaffCost / revenue) * 100 : 0,
        repeatCustomerRate: customers > 0 ? (d.totalReturning / customers) * 100 : 0,
      };
      return profile;
    }).filter((p) => categorizeMerchant(p.monthlyOrders) === sizeCategory);
  } catch (err: any) {
    logger.error('[BenchmarkEngine] loadPeerProfiles failed', { city, cuisineType, error: err.message });
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes benchmark metrics for a single merchant against anonymized peers.
 * Returns null if the peer group is below the minimum size threshold.
 */
export async function computeBenchmarks(merchantId: string): Promise<BenchmarkMetrics | null> {
  const cached = benchmarkCache.get(merchantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const profile = await resolveMerchantProfile(merchantId);
  if (!profile) {
    logger.warn('[BenchmarkEngine] No profile found for merchant', { merchantId });
    benchmarkCache.set(merchantId, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }

  const sizeCategory = categorizeMerchant(profile.monthlyOrders);
  const peers = await loadPeerProfiles(profile.city, profile.cuisineType, sizeCategory, merchantId);

  if (peers.length < MIN_PEER_GROUP_SIZE) {
    logger.info('[BenchmarkEngine] Insufficient peer group', {
      merchantId,
      city: profile.city,
      cuisineType: profile.cuisineType,
      peerCount: peers.length,
    });
    benchmarkCache.set(merchantId, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const peerFoodCosts = peers.map((p) => p.foodCostPct);
  const peerAOVs = peers.map((p) => p.avgOrderValue);
  const peerStaffCosts = peers.map((p) => p.staffCostPct);
  const peerRevenues = peers.map((p) => p.monthlyRevenue);
  const peerRepeatRates = peers.map((p) => p.repeatCustomerRate);

  const result: BenchmarkMetrics = {
    merchantId,
    peerGroup: {
      city: profile.city,
      cuisineType: profile.cuisineType,
      sizeCategory,
      merchantCount: peers.length + 1,
    },
    // For cost metrics: lower is better, so percentile inverted (100 - pct) = how many you beat
    foodCostPct: {
      value: Math.round(profile.foodCostPct * 10) / 10,
      peerAvg: Math.round(avg(peerFoodCosts) * 10) / 10,
      percentile: 100 - computePercentile(profile.foodCostPct, peerFoodCosts),
    },
    avgOrderValue: {
      value: Math.round(profile.avgOrderValue),
      peerAvg: Math.round(avg(peerAOVs)),
      percentile: computePercentile(profile.avgOrderValue, peerAOVs),
    },
    staffCostPct: {
      value: Math.round(profile.staffCostPct * 10) / 10,
      peerAvg: Math.round(avg(peerStaffCosts) * 10) / 10,
      percentile: 100 - computePercentile(profile.staffCostPct, peerStaffCosts),
    },
    monthlyRevenue: {
      value: Math.round(profile.monthlyRevenue),
      peerAvg: Math.round(avg(peerRevenues)),
      percentile: computePercentile(profile.monthlyRevenue, peerRevenues),
    },
    repeatCustomerRate: {
      value: Math.round(profile.repeatCustomerRate * 10) / 10,
      peerAvg: Math.round(avg(peerRepeatRates) * 10) / 10,
      percentile: computePercentile(profile.repeatCustomerRate, peerRepeatRates),
    },
    computedAt: new Date().toISOString(),
  };

  benchmarkCache.set(merchantId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

/**
 * Returns anonymized aggregate stats for a peer group.
 * Never exposes individual merchant IDs or values.
 */
export async function getPeerGroupStats(
  city: string,
  cuisineType: string,
): Promise<PeerGroupStats> {
  const cacheKey = `${city}:${cuisineType}`.toLowerCase();
  const cached = peerGroupCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const col = mongoose.connection.collection('merchantanalytics');
    const dateStr = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

    const pipeline = [
      {
        $match: {
          city: { $regex: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          cuisineType: { $regex: new RegExp(`^${cuisineType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          date: { $gte: dateStr },
        },
      },
      {
        $group: {
          _id: '$merchantId',
          totalRevenue: { $sum: '$revenue' },
          totalOrders: { $sum: '$orderCount' },
          totalNew: { $sum: '$newCustomers' },
          totalReturning: { $sum: '$returningCustomers' },
          totalFoodCost: { $sum: '$foodCostAmount' },
          totalStaffCost: { $sum: '$staffCostAmount' },
        },
      },
    ];

    const docs = await col.aggregate(pipeline).toArray() as any[];
    const insufficient = docs.length < MIN_PEER_GROUP_SIZE;

    if (insufficient) {
      const result: PeerGroupStats = {
        city,
        cuisineType,
        merchantCount: docs.length,
        avgFoodCostPct: 0,
        avgOrderValue: 0,
        avgStaffCostPct: 0,
        avgMonthlyRevenue: 0,
        avgRepeatCustomerRate: 0,
        insufficient: true,
      };
      peerGroupCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const profiles = docs.map((d) => {
      const revenue = d.totalRevenue || 0;
      const orders = d.totalOrders || 0;
      const customers = (d.totalNew || 0) + (d.totalReturning || 0);
      return {
        foodCostPct: revenue > 0 ? (d.totalFoodCost / revenue) * 100 : 0,
        avgOrderValue: orders > 0 ? revenue / orders : 0,
        staffCostPct: revenue > 0 ? (d.totalStaffCost / revenue) * 100 : 0,
        monthlyRevenue: revenue,
        repeatCustomerRate: customers > 0 ? (d.totalReturning / customers) * 100 : 0,
      };
    });

    const result: PeerGroupStats = {
      city,
      cuisineType,
      merchantCount: docs.length,
      avgFoodCostPct: Math.round(avg(profiles.map((p) => p.foodCostPct)) * 10) / 10,
      avgOrderValue: Math.round(avg(profiles.map((p) => p.avgOrderValue))),
      avgStaffCostPct: Math.round(avg(profiles.map((p) => p.staffCostPct)) * 10) / 10,
      avgMonthlyRevenue: Math.round(avg(profiles.map((p) => p.monthlyRevenue))),
      avgRepeatCustomerRate: Math.round(avg(profiles.map((p) => p.repeatCustomerRate)) * 10) / 10,
      insufficient: false,
    };

    peerGroupCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err: any) {
    logger.error('[BenchmarkEngine] getPeerGroupStats failed', { city, cuisineType, error: err.message });
    return {
      city,
      cuisineType,
      merchantCount: 0,
      avgFoodCostPct: 0,
      avgOrderValue: 0,
      avgStaffCostPct: 0,
      avgMonthlyRevenue: 0,
      avgRepeatCustomerRate: 0,
      insufficient: true,
    };
  }
}
