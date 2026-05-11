/**
 * app/(dashboard)/analytics-dashboard.tsx
 *
 * Platform Analytics Dashboard
 * - Platform overview: total users, active merchants, orders today, GMV today
 * - User growth numbers (7-day)
 * - Top merchants by revenue
 * - Recent suspicious activity log (flagged transactions)
 *
 * API: GET admin/dashboard/stats, GET admin/analytics/dashboard,
 *      GET /api/analytics/platform/summary (analytics-events service)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import {
  dashboardService,
  DashboardStats,
  AnalyticsDashboardResponse,
  PlatformSummaryResponse,
} from '../../services/api/dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_ROLES } from '../../constants/roles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Re-use types from the service layer
type UserGrowthDay = AnalyticsDashboardResponse['userGrowth'][number];
type TopMerchant = AnalyticsDashboardResponse['topMerchants'][number];
type SuspiciousActivity = AnalyticsDashboardResponse['suspiciousActivity'][number];
type AnalyticsDashboardData = AnalyticsDashboardResponse;
type PlatformSummary = PlatformSummaryResponse;
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const severityColor = (s: string) => {
  switch (s) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

const severityBg = (s: string) => {
  switch (s) {
    case 'high':
      return '#fee2e2';
    case 'medium':
      return '#fef3c7';
    default:
      return '#f3f4f6';
  }
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface OverviewCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress?: () => void;
}

function OverviewCard({ title, value, subtitle, icon, iconColor, onPress }: OverviewCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.overviewCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.cardTitle, { color: colors.icon }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.cardSubtitle, { color: colors.icon }]}>{subtitle}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// Simple bar chart using View widths — no external library
function MiniBarChart({ data, max }: { data: UserGrowthDay[]; max: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.barChart}>
      {data.map((day) => {
        const pct = max > 0 ? Math.max((day.newUsers / max) * 100, 4) : 4;
        return (
          <View key={day.date} style={styles.barColumn}>
            <Text style={[styles.barTopLabel, { color: colors.icon }]}>
              {formatNumber(day.newUsers)}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { height: `${pct}%` as any, backgroundColor: colors.tint }]}
              />
            </View>
            <Text style={[styles.barBottomLabel, { color: colors.icon }]}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AnalyticsDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { hasRole } = useAuth();

  // Role guard BEFORE any hooks that may vary — Rules of Hooks requires hooks count to
  // be identical on every render. useFocusEffect below must always run, so we gate
  // inside the effect rather than returning early before it.
  const isAuthorized = hasRole(ADMIN_ROLES.ADMIN);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboardData | null>(null);
  const [platformSummary, setPlatformSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [statsData, analyticsData, platformSummary] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getAnalyticsDashboard(),
        dashboardService.getPlatformSummary('30d'),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      if (analyticsData.status === 'fulfilled') {
        setAnalyticsData(analyticsData.value);
      } else {
        // Surface the real error so the user knows what went wrong
        setError(analyticsData.reason?.message || 'Failed to load analytics data');
        setAnalyticsData({ userGrowth: [], topMerchants: [], suspiciousActivity: [] });
      }

      if (platformSummary.status === 'fulfilled' && platformSummary.value) {
        setPlatformSummary(platformSummary.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Require admin role (checked after all hooks to satisfy Rules of Hooks)
  if (!isAuthorized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.icon} />
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: '700',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Access Denied
        </Text>
        <Text
          style={{ color: colors.icon, textAlign: 'center', paddingHorizontal: 32, marginTop: 8 }}
        >
          You need Admin privileges to view Analytics.
        </Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading analytics...</Text>
      </View>
    );
  }

  const userGrowth = analyticsData?.userGrowth ?? [];
  const topMerchants = analyticsData?.topMerchants ?? [];
  const suspicious = analyticsData?.suspiciousActivity ?? [];
  const maxNewUsers = userGrowth.reduce((m, d) => Math.max(m, d.newUsers), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <Text style={styles.headerSub}>Platform-wide metrics & insights</Text>
        </View>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: `${colors.error}15` }]}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Platform Overview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Overview</Text>
        <View style={styles.overviewGrid}>
          <OverviewCard
            title="Total Users"
            value={formatNumber(stats?.users?.total ?? 0)}
            subtitle={`+${stats?.users?.newToday ?? 0} today`}
            icon="people"
            iconColor="#6366f1"
            onPress={() => router.push('/(dashboard)/users')}
          />
          <OverviewCard
            title="Active Merchants"
            value={formatNumber(stats?.merchants?.active ?? 0)}
            subtitle={`${stats?.merchants?.total ?? 0} total`}
            icon="storefront"
            iconColor="#10b981"
            onPress={() => router.push('/(dashboard)/merchants')}
          />
          <OverviewCard
            title="Orders Today"
            value={formatNumber(stats?.orders?.today ?? 0)}
            subtitle={`${stats?.orders?.pendingCount ?? 0} pending`}
            icon="receipt"
            iconColor="#f59e0b"
            onPress={() => router.push('/(dashboard)/orders')}
          />
          <OverviewCard
            title="GMV Today"
            value={formatCurrency(stats?.revenue?.today ?? 0)}
            subtitle="Gross merchandise value"
            icon="wallet"
            iconColor="#3b82f6"
          />
        </View>
      </View>

      {/* Platform Revenue Trend (from analytics service) */}
      {platformSummary && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Platform Revenue (30 Days)
          </Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <View style={styles.platformRevenueRow}>
              <View style={styles.platformRevenueStat}>
                <Text style={[styles.platformRevenueValue, { color: colors.text }]}>
                  {formatCurrency(platformSummary.revenue)}
                </Text>
                <Text style={[styles.platformRevenueLabel, { color: colors.icon }]}>
                  Total Revenue
                </Text>
              </View>
              <View style={styles.platformRevenueStat}>
                <Text style={[styles.platformRevenueValue, { color: colors.text }]}>
                  {formatNumber(platformSummary.visitors)}
                </Text>
                <Text style={[styles.platformRevenueLabel, { color: colors.icon }]}>
                  Unique Visitors
                </Text>
              </View>
              <View style={styles.platformRevenueStat}>
                <Text style={[styles.platformRevenueValue, { color: colors.success }]}>
                  {(platformSummary.newVsReturning.ratio * 100).toFixed(0)}%
                </Text>
                <Text style={[styles.platformRevenueLabel, { color: colors.icon }]}>
                  New Visitors
                </Text>
              </View>
            </View>
            {platformSummary.days.length > 0 &&
              (() => {
                const last14 = platformSummary.days.slice(-14);
                const maxRev = Math.max(...last14.map((x) => x.revenue), 1);
                return (
                  <View style={styles.platformTrendBars}>
                    {last14.map((d) => {
                      const pct = Math.max((d.revenue / maxRev) * 100, 4);
                      return (
                        <View key={d.date} style={styles.trendBarCol}>
                          <View style={styles.trendBarTrack}>
                            <View
                              style={[
                                styles.trendBarFill,
                                { height: `${pct}%` as any, backgroundColor: colors.tint },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
          </View>
        </View>
      )}

      {/* User Growth — 7 Day Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Growth (7 Days)</Text>
          <TouchableOpacity onPress={() => router.push('/(dashboard)/users')}>
            <Text style={[styles.viewAllLink, { color: colors.tint }]}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          {userGrowth.length > 0 ? (
            <>
              <MiniBarChart data={userGrowth} max={maxNewUsers} />
              <View style={styles.growthSummary}>
                <View style={styles.growthSummaryItem}>
                  <Text style={[styles.growthLabel, { color: colors.icon }]}>Total New (7d)</Text>
                  <Text style={[styles.growthValue, { color: colors.text }]}>
                    {formatNumber(userGrowth.reduce((s, d) => s + d.newUsers, 0))}
                  </Text>
                </View>
                <View style={styles.growthSummaryItem}>
                  <Text style={[styles.growthLabel, { color: colors.icon }]}>Daily Avg</Text>
                  <Text style={[styles.growthValue, { color: colors.text }]}>
                    {formatNumber(
                      Math.round(
                        userGrowth.reduce((s, d) => s + d.newUsers, 0) / (userGrowth.length || 1)
                      )
                    )}
                  </Text>
                </View>
                <View style={styles.growthSummaryItem}>
                  <Text style={[styles.growthLabel, { color: colors.icon }]}>Peak Day</Text>
                  <Text style={[styles.growthValue, { color: colors.text }]}>
                    {formatNumber(maxNewUsers)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={40} color={colors.icon} />
              <Text style={[styles.emptyChartText, { color: colors.icon }]}>
                No user growth data available
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Top Merchants by Revenue */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top Merchants by Revenue
          </Text>
          <TouchableOpacity onPress={() => router.push('/(dashboard)/merchants')}>
            <Text style={[styles.viewAllLink, { color: colors.tint }]}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.listCard, { backgroundColor: colors.card }]}>
          {topMerchants.length === 0 ? (
            <View style={styles.emptyListRow}>
              <Ionicons name="storefront-outline" size={32} color={colors.icon} />
              <Text style={[styles.emptyListText, { color: colors.icon }]}>
                No merchant revenue data
              </Text>
            </View>
          ) : (
            topMerchants.map((m, idx) => (
              <View
                key={m.id}
                style={[
                  styles.merchantRow,
                  idx < topMerchants.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.rankBadge, { backgroundColor: `${colors.tint}15` }]}>
                  <Text style={[styles.rankText, { color: colors.tint }]}>#{idx + 1}</Text>
                </View>
                <View style={styles.merchantInfo}>
                  <Text style={[styles.merchantName, { color: colors.text }]} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={[styles.merchantCategory, { color: colors.icon }]}>
                    {m.category} &middot; {m.orders} orders
                  </Text>
                </View>
                <Text style={[styles.merchantRevenue, { color: colors.success }]}>
                  {formatCurrency(m.revenue)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Suspicious Activity Log */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suspicious Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(dashboard)/fraud-alerts')}>
            <Text style={[styles.viewAllLink, { color: colors.tint }]}>View all</Text>
          </TouchableOpacity>
        </View>
        {suspicious.length === 0 ? (
          <View style={[styles.cleanCard, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark" size={36} color={colors.success} />
            <Text style={[styles.cleanText, { color: colors.text }]}>No suspicious activity</Text>
            <Text style={[styles.cleanSub, { color: colors.icon }]}>
              All transactions look normal
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.card }]}>
            {suspicious.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.suspiciousRow,
                  idx < suspicious.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.severityDot, { backgroundColor: severityColor(item.severity) }]}
                />
                <View style={styles.suspiciousInfo}>
                  <View style={styles.suspiciousTypeRow}>
                    <View
                      style={[styles.typeBadge, { backgroundColor: severityBg(item.severity) }]}
                    >
                      <Text style={[styles.typeText, { color: severityColor(item.severity) }]}>
                        {item.type.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.suspiciousDesc, { color: colors.text }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={[styles.suspiciousTime, { color: colors.icon }]}>
                    {item.flaggedAt}
                    {item.amount ? ` \u00B7 ${formatCurrency(item.amount)}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Nav Shortcuts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Deep Dive Analytics</Text>
        <View style={styles.shortcutsGrid}>
          {[
            {
              label: 'Business Metrics',
              icon: 'trending-up' as const,
              color: '#6366f1',
              route: '/(dashboard)/business-metrics',
            },
            {
              label: 'Revenue Vertical',
              icon: 'pie-chart' as const,
              color: '#10b981',
              route: '/(dashboard)/revenue-by-vertical',
            },
            {
              label: 'Cohort Analysis',
              icon: 'people-circle' as const,
              color: '#f59e0b',
              route: '/(dashboard)/cohort-analysis',
            },
            {
              label: 'Funnel Analytics',
              icon: 'filter' as const,
              color: '#3b82f6',
              route: '/(dashboard)/funnel-analytics',
            },
            {
              label: 'Marketing',
              icon: 'megaphone' as const,
              color: '#ec4899',
              route: '/(dashboard)/marketing-analytics',
            },
            {
              label: 'Fraud Reports',
              icon: 'shield' as const,
              color: '#ef4444',
              route: '/(dashboard)/fraud-reports',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.shortcutCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.shortcutLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  headerRefreshBtn: { marginLeft: 'auto', padding: 4 },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  errorBannerText: { fontSize: 13, flex: 1 },

  // Section
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllLink: { fontSize: 13, fontWeight: '600' },

  // Overview Grid
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  overviewCard: {
    width: '47.5%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  cardTitle: { fontSize: 12, textAlign: 'center', marginBottom: 2 },
  cardSubtitle: { fontSize: 11, textAlign: 'center' },

  // Bar Chart
  chartCard: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 12,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTopLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  barTrack: {
    width: '60%',
    height: 70,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 4 },
  barBottomLabel: { fontSize: 9, marginTop: 4 },
  growthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 4,
  },
  growthSummaryItem: { alignItems: 'center' },
  growthLabel: { fontSize: 11, marginBottom: 2 },
  growthValue: { fontSize: 16, fontWeight: '700' },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyChartText: { fontSize: 13 },
  emptyChartSubText: { fontSize: 11, marginTop: 2, textAlign: 'center' as const },

  // List Card
  listCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyListRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyListText: { fontSize: 13 },

  // Merchants
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: { fontSize: 12, fontWeight: '700' },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  merchantCategory: { fontSize: 12 },
  merchantRevenue: { fontSize: 14, fontWeight: '700' },

  // Suspicious Activity
  cleanCard: {
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cleanText: { fontSize: 15, fontWeight: '600' },
  cleanSub: { fontSize: 13 },
  suspiciousRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  suspiciousInfo: { flex: 1 },
  suspiciousTypeRow: { marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  suspiciousDesc: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  suspiciousTime: { fontSize: 11 },

  // Platform Revenue Trend
  platformRevenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 14,
  },
  platformRevenueStat: { alignItems: 'center' },
  platformRevenueValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  platformRevenueLabel: { fontSize: 11 },
  platformTrendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 2,
  },
  trendBarCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  trendBarTrack: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: { width: '100%', borderRadius: 3 },

  // Shortcuts
  shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shortcutCard: {
    width: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
