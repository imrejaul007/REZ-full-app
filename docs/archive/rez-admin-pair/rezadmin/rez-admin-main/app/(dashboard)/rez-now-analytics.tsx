/**
 * app/(dashboard)/rez-now-analytics.tsx
 * REZ Now — per-store analytics dashboard
 *
 * Sections:
 *  - Store slug input (if no slug supplied via params)
 *  - 2×2 summary stat cards
 *  - Top items horizontal scroll
 *  - Orders-by-hour bar chart (View-width bars, no external lib)
 *  - New vs Returning ratio bar
 *  - Order status pills
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { rezNowAnalyticsService, type RezNowAnalytics } from '../../services/api/rezNowAnalytics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  colors: (typeof Colors)['light'];
}

function StatCard({ label, value, icon, iconColor, colors }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: `${iconColor}1A` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RezNowAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const params = useLocalSearchParams<{ storeSlug?: string }>();

  const [storeSlug, setStoreSlug] = useState<string>(params.storeSlug ?? '');
  const [slugInput, setSlugInput] = useState<string>(params.storeSlug ?? '');
  const [period, setPeriod] = useState<string>('30d');
  const [analytics, setAnalytics] = useState<RezNowAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (slug: string, selectedPeriod: string) => {
    if (!slug.trim()) return;
    try {
      setError(null);
      const data = await rezNowAnalyticsService.getAnalytics(slug.trim(), selectedPeriod);
      setAnalytics(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(msg);
      setAnalytics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (storeSlug) {
      setLoading(true);
      loadAnalytics(storeSlug, period);
    }
  }, [storeSlug, period, loadAnalytics]);

  const onRefresh = useCallback(() => {
    if (!storeSlug) return;
    setRefreshing(true);
    loadAnalytics(storeSlug, period);
  }, [storeSlug, period, loadAnalytics]);

  const handleLoad = useCallback(() => {
    const trimmed = slugInput.trim();
    if (!trimmed) return;
    setStoreSlug(trimmed);
    setAnalytics(null);
    setError(null);
  }, [slugInput]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const cancellationRate = analytics
    ? analytics.totalOrders > 0
      ? ((analytics.ordersByStatus['cancelled'] ?? 0) / analytics.totalOrders) * 100
      : 0
    : 0;

  // Orders by hour — find peak
  const hourCounts = analytics?.ordersByHour ?? [];
  const maxHourCount = hourCounts.length > 0 ? Math.max(...hourCounts.map((h) => h.count), 1) : 1;
  const peakHour = hourCounts.reduce(
    (best, h) => (h.count > (best?.count ?? 0) ? h : best),
    hourCounts[0] ?? null
  );

  // New vs returning
  const nvr = analytics?.newVsReturning;
  const nvrTotal = (nvr?.new ?? 0) + (nvr?.returning ?? 0);
  const newPct = nvrTotal > 0 ? ((nvr?.new ?? 0) / nvrTotal) * 100 : 50;

  // Status pills config
  const STATUS_CONFIG: Array<{ key: string; label: string; color: string; bg: string }> = [
    { key: 'completed', label: 'Completed', color: colors.success, bg: colors.successLight },
    { key: 'cancelled', label: 'Cancelled', color: colors.error, bg: colors.errorLight },
    { key: 'preparing', label: 'Preparing', color: colors.warningDark, bg: colors.warningLight },
  ];

  const PERIODS = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>REZ Now Analytics</Text>
          {storeSlug ? (
            <Text style={[styles.headerSub, { color: colors.icon }]} numberOfLines={1}>
              {storeSlug}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            enabled={!!storeSlug}
          />
        }
      >
        {/* ── Store slug input ── */}
        {!storeSlug ? (
          <View
            style={[styles.slugCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons
              name="storefront-outline"
              size={32}
              color={colors.tint}
              style={styles.slugIcon}
            />
            <Text style={[styles.slugHeading, { color: colors.text }]}>Enter Store Slug</Text>
            <Text style={[styles.slugHint, { color: colors.icon }]}>
              The store&apos;s URL slug from web-ordering configuration
            </Text>
            <TextInput
              style={[
                styles.slugInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="e.g. butter-chicken-palace"
              placeholderTextColor={colors.icon}
              value={slugInput}
              onChangeText={setSlugInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLoad}
            />
            <TouchableOpacity
              style={[
                styles.loadBtn,
                { backgroundColor: colors.tint, opacity: slugInput.trim() ? 1 : 0.4 },
              ]}
              onPress={handleLoad}
              disabled={!slugInput.trim()}
            >
              <Text style={styles.loadBtnText}>Load Analytics</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Change store */}
            <View style={styles.changeStoreRow}>
              <TextInput
                style={[
                  styles.inlineInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                ]}
                value={slugInput}
                onChangeText={setSlugInput}
                placeholder="store slug"
                placeholderTextColor={colors.icon}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleLoad}
              />
              <TouchableOpacity
                style={[styles.goBtn, { backgroundColor: colors.tint }]}
                onPress={handleLoad}
              >
                <Text style={styles.goBtnText}>Go</Text>
              </TouchableOpacity>
            </View>

            {/* Period selector */}
            <View style={styles.periodRow}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.periodBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: period === p.value ? colors.tint : colors.card,
                    },
                  ]}
                  onPress={() => setPeriod(p.value)}
                >
                  <Text
                    style={[
                      styles.periodBtnText,
                      { color: period === p.value ? '#fff' : colors.text },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Loading ── */}
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            )}

            {/* ── Error ── */}
            {!loading && error ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
                <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to load</Text>
                <Text style={[styles.errorMsg, { color: colors.icon }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    setLoading(true);
                    loadAnalytics(storeSlug, period);
                  }}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── Content ── */}
            {!loading && analytics ? (
              <>
                {/* 2×2 Summary grid */}
                <View style={styles.statGrid}>
                  <StatCard
                    label="Total Orders"
                    value={analytics.totalOrders.toLocaleString('en-IN')}
                    icon="receipt-outline"
                    iconColor={colors.info}
                    colors={colors}
                  />
                  <StatCard
                    label="Revenue"
                    value={formatINR(analytics.totalRevenue)}
                    icon="cash-outline"
                    iconColor={colors.success}
                    colors={colors}
                  />
                  <StatCard
                    label="Avg Order"
                    value={formatINR(analytics.avgOrderValue)}
                    icon="trending-up-outline"
                    iconColor={colors.purple}
                    colors={colors}
                  />
                  <StatCard
                    label="Cancellation"
                    value={`${cancellationRate.toFixed(1)}%`}
                    icon="close-circle-outline"
                    iconColor={colors.error}
                    colors={colors}
                  />
                </View>

                {/* Order status pills */}
                <View
                  style={[
                    styles.section,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Status</Text>
                  <View style={styles.pillsRow}>
                    {STATUS_CONFIG.map(({ key, label, color, bg }) => {
                      const count = analytics.ordersByStatus[key] ?? 0;
                      return (
                        <View key={key} style={[styles.pill, { backgroundColor: bg }]}>
                          <View style={[styles.pillDot, { backgroundColor: color }]} />
                          <Text style={[styles.pillLabel, { color }]}>{label}</Text>
                          <Text style={[styles.pillCount, { color }]}>{count}</Text>
                        </View>
                      );
                    })}
                    {/* Other statuses */}
                    {Object.entries(analytics.ordersByStatus)
                      .filter(([k]) => !['completed', 'cancelled', 'preparing'].includes(k))
                      .map(([k, v]) => (
                        <View key={k} style={[styles.pill, { backgroundColor: colors.slate }]}>
                          <View style={[styles.pillDot, { backgroundColor: colors.muted }]} />
                          <Text style={[styles.pillLabel, { color: colors.mutedDark }]}>{k}</Text>
                          <Text style={[styles.pillCount, { color: colors.mutedDark }]}>{v}</Text>
                        </View>
                      ))}
                  </View>
                </View>

                {/* Top items horizontal scroll */}
                {analytics.topItems.length > 0 && (
                  <View
                    style={[
                      styles.section,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Items</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.topItemsScroll}
                    >
                      {analytics.topItems.map((item, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.itemCard,
                            { backgroundColor: colors.background, borderColor: colors.border },
                          ]}
                        >
                          <View style={[styles.itemRankBadge, { backgroundColor: colors.tint }]}>
                            <Text style={styles.itemRankText}>#{idx + 1}</Text>
                          </View>
                          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text style={[styles.itemCount, { color: colors.icon }]}>
                            {item.count} orders
                          </Text>
                          <Text style={[styles.itemRevenue, { color: colors.success }]}>
                            {formatINR(item.revenue)}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Orders by hour bar chart */}
                {hourCounts.length > 0 && (
                  <View
                    style={[
                      styles.section,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.sectionTitleRow}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Orders by Hour
                      </Text>
                      {peakHour ? (
                        <Text
                          style={[
                            styles.peakBadge,
                            { backgroundColor: colors.warningLight, color: colors.warningDark },
                          ]}
                        >
                          Peak {pad2(peakHour.hour)}:00
                        </Text>
                      ) : null}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.hourChartScroll}
                    >
                      {Array.from({ length: 24 }, (_, h) => {
                        const entry = hourCounts.find((x) => x.hour === h);
                        const count = entry?.count ?? 0;
                        const barH = count > 0 ? Math.max(6, (count / maxHourCount) * 100) : 2;
                        const isPeak = peakHour?.hour === h && count > 0;
                        return (
                          <View key={h} style={styles.hourBarWrapper}>
                            <Text
                              style={[
                                styles.hourBarCount,
                                { color: isPeak ? colors.warningDark : colors.icon },
                              ]}
                            >
                              {count > 0 ? count : ''}
                            </Text>
                            <View
                              style={[
                                styles.hourBar,
                                {
                                  height: barH,
                                  backgroundColor: isPeak
                                    ? colors.warningDark
                                    : count > 0
                                      ? colors.tint
                                      : colors.border,
                                },
                              ]}
                            />
                            <Text style={[styles.hourLabel, { color: colors.icon }]}>
                              {pad2(h)}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* New vs Returning ratio bar */}
                <View
                  style={[
                    styles.section,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    New vs Returning
                  </Text>
                  {nvrTotal > 0 ? (
                    <>
                      <View style={styles.nvrBar}>
                        <View
                          style={[
                            styles.nvrSegment,
                            { flex: nvr?.new ?? 0, backgroundColor: colors.info },
                          ]}
                        />
                        <View
                          style={[
                            styles.nvrSegment,
                            { flex: nvr?.returning ?? 0, backgroundColor: colors.purple },
                          ]}
                        />
                      </View>
                      <View style={styles.nvrLegend}>
                        <View style={styles.nvrLegendItem}>
                          <View style={[styles.nvrDot, { backgroundColor: colors.info }]} />
                          <Text style={[styles.nvrLegendText, { color: colors.text }]}>
                            New — {nvr?.new ?? 0} ({newPct.toFixed(0)}%)
                          </Text>
                        </View>
                        <View style={styles.nvrLegendItem}>
                          <View style={[styles.nvrDot, { backgroundColor: colors.purple }]} />
                          <Text style={[styles.nvrLegendText, { color: colors.text }]}>
                            Returning — {nvr?.returning ?? 0} ({(100 - newPct).toFixed(0)}%)
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.emptyNote, { color: colors.icon }]}>
                      No data available
                    </Text>
                  )}
                </View>
              </>
            ) : null}
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // Slug input card
  slugCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  slugIcon: { marginBottom: 12 },
  slugHeading: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  slugHint: { fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  slugInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  loadBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Inline store change bar
  changeStoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  goBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Period selector
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodBtnText: { fontSize: 12, fontWeight: '600' },

  // Loading / error
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  errorMsg: { fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // 2×2 stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '47.5%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  // Generic section card
  section: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  peakBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // Status pills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  pillCount: { fontSize: 12, fontWeight: '700' },

  // Top items
  topItemsScroll: { paddingRight: 4, gap: 10 },
  itemCard: {
    width: 120,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  itemRankBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
  },
  itemRankText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  itemName: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  itemCount: { fontSize: 11, marginTop: 2 },
  itemRevenue: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  // Hour chart
  hourChartScroll: { gap: 4, paddingBottom: 2 },
  hourBarWrapper: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 128,
    gap: 2,
  },
  hourBarCount: { fontSize: 8, fontWeight: '700', height: 12, textAlign: 'center' },
  hourBar: { width: 14, borderRadius: 3, minHeight: 2 },
  hourLabel: { fontSize: 8, textAlign: 'center' },

  // New vs returning
  nvrBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  nvrSegment: { height: '100%' },
  nvrLegend: { gap: 6 },
  nvrLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nvrDot: { width: 10, height: 10, borderRadius: 5 },
  nvrLegendText: { fontSize: 13, fontWeight: '500' },

  emptyNote: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },

  bottomPad: { height: 24 },
});
