/**
 * app/(dashboard)/revenue-report.tsx
 * Admin — Merchant Revenue Reports
 *
 * Sections:
 *  - Store slug input + date range presets (Today / This Week / This Month / Custom)
 *  - Custom: start + end date text inputs (YYYY-MM-DD)
 *  - Revenue by day: vertical bar chart (View-height proportional)
 *  - Payment methods breakdown: horizontal % bar (cash vs online)
 *  - Top 10 items table: rank, name, count, revenue
 *  - CSV Export via Share.share
 *  - Pull-to-refresh
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
  Share,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  name: string;
  count: number;
  revenue: number;
}

interface PaymentBreakdown {
  cash: number;
  online: number;
}

interface RevenueReportData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  topItems: TopItem[];
  dailyRevenue: DailyRevenue[];
  paymentBreakdown?: PaymentBreakdown;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toISODate(new Date());
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

function startOfWeekStr(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

function startOfMonthStr(): string {
  const d = new Date();
  d.setDate(1);
  return toISODate(d);
}

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

// ─── CSV builder ──────────────────────────────────────────────────────────────

function buildCSV(storeSlug: string, from: string, to: string, data: RevenueReportData): string {
  const lines: string[] = [];

  lines.push(`Revenue Report — ${storeSlug}`);
  lines.push(`Period: ${from} to ${to}`);
  lines.push('');

  lines.push('SUMMARY');
  lines.push('Metric,Value');
  lines.push(`Total Orders,${data.totalOrders}`);
  lines.push(`Total Revenue,${data.totalRevenue}`);
  lines.push(`Avg Order Value,${data.avgOrderValue}`);
  lines.push(`Completion Rate,${(data.completionRate * 100).toFixed(1)}%`);
  lines.push('');

  lines.push('DAILY REVENUE');
  lines.push('Date,Orders,Revenue');
  for (const d of data.dailyRevenue) {
    lines.push(`${d.date},${d.orders},${d.revenue}`);
  }
  lines.push('');

  if (data.paymentBreakdown) {
    lines.push('PAYMENT METHODS');
    lines.push('Method,Count');
    lines.push(`Cash,${data.paymentBreakdown.cash}`);
    lines.push(`Online,${data.paymentBreakdown.online}`);
    lines.push('');
  }

  lines.push('TOP ITEMS');
  lines.push('Rank,Item,Orders,Revenue');
  data.topItems.slice(0, 10).forEach((item, idx) => {
    const safeNameCsv = `"${item.name.replace(/"/g, '""')}"`;
    lines.push(`${idx + 1},${safeNameCsv},${item.count},${item.revenue}`);
  });

  return lines.join('\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ColorsType = (typeof Colors)['light'];

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  colors: ColorsType;
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

// ─── Preset type ─────────────────────────────────────────────────────────────

type Preset = 'today' | 'week' | 'month' | 'custom';

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function RevenueReportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [slugInput, setSlugInput] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');

  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState<string>(daysAgoStr(30));
  const [customTo, setCustomTo] = useState<string>(todayStr());

  const [data, setData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  // Resolved from/to for current preset
  function resolvedRange(): { from: string; to: string } {
    const today = todayStr();
    switch (preset) {
      case 'today':
        return { from: today, to: today };
      case 'week':
        return { from: startOfWeekStr(), to: today };
      case 'month':
        return { from: startOfMonthStr(), to: today };
      case 'custom':
        return { from: customFrom, to: customTo };
    }
  }

  const loadReport = useCallback(
    async (slug: string, from: string, to: string, isRefresh = false) => {
      if (!slug.trim()) return;
      if (!isValidDate(from) || !isValidDate(to)) {
        setError('Invalid date format — use YYYY-MM-DD');
        return;
      }
      try {
        setError(null);
        if (!isRefresh) setLoading(true);
        const encodedSlug = encodeURIComponent(slug.trim());
        const response = await apiClient.get<RevenueReportData>(
          `web-ordering/store/${encodedSlug}/analytics?period=custom&from=${from}&to=${to}`
        );
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.message ?? 'Failed to load report');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load report';
        setError(msg);
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!storeSlug) return;
    const { from, to } = resolvedRange();
    setLoading(true);
    loadReport(storeSlug, from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug, preset, customFrom, customTo]);

  const onRefresh = useCallback(() => {
    if (!storeSlug) return;
    setRefreshing(true);
    const { from, to } = resolvedRange();
    loadReport(storeSlug, from, to, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug, preset, customFrom, customTo]);

  const handleLoad = useCallback(() => {
    const trimmed = slugInput.trim();
    if (!trimmed) return;
    setStoreSlug(trimmed);
    setData(null);
    setError(null);
  }, [slugInput]);

  const handleExport = useCallback(async () => {
    if (!data || !storeSlug) return;
    setExporting(true);
    try {
      const { from, to } = resolvedRange();
      const csv = buildCSV(storeSlug, from, to, data);
      await Share.share({
        message: csv,
        title: `Revenue Report — ${storeSlug} (${from} to ${to})`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export Error', msg);
    } finally {
      setExporting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, storeSlug, preset, customFrom, customTo]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const dailyData = data?.dailyRevenue ?? [];
  const maxRevenue = dailyData.length > 0 ? Math.max(...dailyData.map((d) => d.revenue), 1) : 1;

  const pb = data?.paymentBreakdown;
  const pbTotal = pb ? pb.cash + pb.online : 0;
  const cashPct = pbTotal > 0 ? (pb!.cash / pbTotal) * 100 : 50;
  const onlinePct = 100 - cashPct;

  const topItems = (data?.topItems ?? []).slice(0, 10);

  const PRESETS: Array<{ label: string; value: Preset }> = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Custom', value: 'custom' },
  ];

  const { from: resolvedFrom, to: resolvedTo } = resolvedRange();

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Revenue Report</Text>
          {storeSlug ? (
            <Text style={[styles.headerSub, { color: colors.icon }]} numberOfLines={1}>
              {storeSlug}
            </Text>
          ) : null}
        </View>
        {data ? (
          <TouchableOpacity
            style={[
              styles.exportBtn,
              { backgroundColor: colors.tint, opacity: exporting ? 0.5 : 1 },
            ]}
            onPress={handleExport}
            disabled={exporting}
            accessibilityLabel="Export CSV"
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.exportBtnText}>CSV</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
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
        {/* Store slug input */}
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
              <Text style={styles.loadBtnText}>Load Report</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Inline slug change */}
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

            {/* Preset tabs */}
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.presetBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: preset === p.value ? colors.tint : colors.card,
                    },
                  ]}
                  onPress={() => setPreset(p.value)}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      { color: preset === p.value ? '#fff' : colors.text },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom date inputs */}
            {preset === 'custom' && (
              <View
                style={[
                  styles.customDateRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: colors.icon }]}>From</Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    value={customFrom}
                    onChangeText={setCustomFrom}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    maxLength={10}
                    returnKeyType="next"
                  />
                </View>
                <Ionicons
                  name="arrow-forward-outline"
                  size={18}
                  color={colors.icon}
                  style={styles.dateArrow}
                />
                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: colors.icon }]}>To</Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    value={customTo}
                    onChangeText={setCustomTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (isValidDate(customFrom) && isValidDate(customTo)) {
                        setData(null);
                        setLoading(true);
                        loadReport(storeSlug, customFrom, customTo);
                      }
                    }}
                  />
                </View>
              </View>
            )}

            {/* Date range label */}
            <Text style={[styles.dateRangeLabel, { color: colors.icon }]}>
              {resolvedFrom === resolvedTo ? resolvedFrom : `${resolvedFrom}  →  ${resolvedTo}`}
            </Text>

            {/* Loading */}
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            )}

            {/* Error */}
            {!loading && error ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
                <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to load</Text>
                <Text style={[styles.errorMsg, { color: colors.icon }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    setLoading(true);
                    loadReport(storeSlug, resolvedFrom, resolvedTo);
                  }}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Content */}
            {!loading && data ? (
              <>
                {/* Summary stats */}
                <View style={styles.statGrid}>
                  <StatCard
                    label="Total Orders"
                    value={data.totalOrders.toLocaleString('en-IN')}
                    icon="receipt-outline"
                    iconColor={colors.info}
                    colors={colors}
                  />
                  <StatCard
                    label="Revenue"
                    value={formatINR(data.totalRevenue)}
                    icon="cash-outline"
                    iconColor={colors.success}
                    colors={colors}
                  />
                  <StatCard
                    label="Avg Order"
                    value={formatINR(data.avgOrderValue)}
                    icon="trending-up-outline"
                    iconColor={colors.purple}
                    colors={colors}
                  />
                  <StatCard
                    label="Completion"
                    value={`${(data.completionRate * 100).toFixed(1)}%`}
                    icon="checkmark-circle-outline"
                    iconColor={colors.successDark}
                    colors={colors}
                  />
                </View>

                {/* Revenue by day bar chart */}
                {dailyData.length > 0 && (
                  <View
                    style={[
                      styles.section,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Revenue by Day
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.barChartScroll}
                    >
                      {dailyData.map((d) => {
                        const barH =
                          d.revenue > 0 ? Math.max(8, (d.revenue / maxRevenue) * 120) : 3;
                        const labelShort = d.date.slice(5); // MM-DD
                        return (
                          <View key={d.date} style={styles.barWrapper}>
                            <Text style={[styles.barRevenueLabel, { color: colors.success }]}>
                              {d.revenue > 0 ? formatINR(d.revenue) : ''}
                            </Text>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: barH,
                                  backgroundColor: d.revenue > 0 ? colors.tint : colors.border,
                                },
                              ]}
                            />
                            <Text style={[styles.barDateLabel, { color: colors.icon }]}>
                              {labelShort}
                            </Text>
                            <Text style={[styles.barOrdersLabel, { color: colors.icon }]}>
                              {d.orders > 0 ? `${d.orders}` : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                    <Text style={[styles.barChartNote, { color: colors.icon }]}>
                      Bar height proportional to revenue · numbers = orders
                    </Text>
                  </View>
                )}

                {/* Payment methods breakdown */}
                {pb && pbTotal > 0 && (
                  <View
                    style={[
                      styles.section,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Payment Methods
                    </Text>
                    <View style={styles.pmBar}>
                      <View
                        style={[
                          styles.pmSegment,
                          { flex: cashPct, backgroundColor: colors.warningDark },
                        ]}
                      />
                      <View
                        style={[
                          styles.pmSegment,
                          { flex: onlinePct, backgroundColor: colors.info },
                        ]}
                      />
                    </View>
                    <View style={styles.pmLegend}>
                      <View style={styles.pmLegendItem}>
                        <View style={[styles.pmDot, { backgroundColor: colors.warningDark }]} />
                        <Text style={[styles.pmLegendText, { color: colors.text }]}>
                          Cash — {pb.cash} ({cashPct.toFixed(1)}%)
                        </Text>
                      </View>
                      <View style={styles.pmLegendItem}>
                        <View style={[styles.pmDot, { backgroundColor: colors.info }]} />
                        <Text style={[styles.pmLegendText, { color: colors.text }]}>
                          Online — {pb.online} ({onlinePct.toFixed(1)}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Top 10 items table */}
                {topItems.length > 0 && (
                  <View
                    style={[
                      styles.section,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Items</Text>
                    {/* Table header */}
                    <View
                      style={[
                        styles.tableRow,
                        styles.tableHeader,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[styles.tableCell, styles.tableCellRank, { color: colors.icon }]}
                      >
                        #
                      </Text>
                      <Text
                        style={[styles.tableCell, styles.tableCellName, { color: colors.icon }]}
                      >
                        Item
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellNum, { color: colors.icon }]}>
                        Orders
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellNum, { color: colors.icon }]}>
                        Revenue
                      </Text>
                    </View>
                    {topItems.map((item, idx) => (
                      <View
                        key={`${item.name}-${idx}`}
                        style={[
                          styles.tableRow,
                          {
                            backgroundColor: idx % 2 === 0 ? 'transparent' : `${colors.tint}08`,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.tableCellRank}>
                          <View
                            style={[
                              styles.rankBadge,
                              { backgroundColor: idx < 3 ? colors.tint : colors.slate },
                            ]}
                          >
                            <Text
                              style={[
                                styles.rankBadgeText,
                                { color: idx < 3 ? '#fff' : colors.icon },
                              ]}
                            >
                              {idx + 1}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[styles.tableCell, styles.tableCellName, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.tableCell, styles.tableCellNum, { color: colors.text }]}
                        >
                          {item.count.toLocaleString('en-IN')}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.tableCellNum,
                            { color: colors.success, fontWeight: '700' },
                          ]}
                        >
                          {formatINR(item.revenue)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* No data empty state */}
                {dailyData.length === 0 && topItems.length === 0 && (
                  <View style={styles.centered}>
                    <Ionicons name="bar-chart-outline" size={44} color={colors.border} />
                    <Text style={[styles.emptyNote, { color: colors.icon }]}>
                      No orders found for this period
                    </Text>
                  </View>
                )}
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

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // Slug card
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

  changeStoreRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  goBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, justifyContent: 'center' },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  presetRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetBtnText: { fontSize: 11, fontWeight: '600' },

  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  dateField: { flex: 1 },
  dateFieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  dateArrow: { marginTop: 16 },

  dateRangeLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },

  centered: { paddingVertical: 48, alignItems: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  errorMsg: { fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // 2×2 stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '47.5%', padding: 14, borderRadius: 12, borderWidth: 1 },
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
  section: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },

  // Bar chart
  barChartScroll: { gap: 6, paddingBottom: 4, alignItems: 'flex-end' },
  barWrapper: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barRevenueLabel: { fontSize: 8, fontWeight: '700', textAlign: 'center', height: 12 },
  barFill: { width: 20, borderRadius: 4, minHeight: 3 },
  barDateLabel: { fontSize: 9, textAlign: 'center', marginTop: 2 },
  barOrdersLabel: { fontSize: 8, textAlign: 'center', height: 12 },
  barChartNote: { fontSize: 10, marginTop: 8, textAlign: 'center' },

  // Payment methods
  pmBar: {
    flexDirection: 'row',
    height: 28,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  pmSegment: { height: '100%' },
  pmLegend: { gap: 6 },
  pmLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pmDot: { width: 10, height: 10, borderRadius: 5 },
  pmLegendText: { fontSize: 13, fontWeight: '500' },

  // Top items table
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  tableHeader: { marginBottom: 2 },
  tableCell: { fontSize: 13 },
  tableCellRank: { width: 32, alignItems: 'center' },
  tableCellName: { flex: 1, paddingHorizontal: 4 },
  tableCellNum: { width: 72, textAlign: 'right' },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: { fontSize: 10, fontWeight: '800' },

  emptyNote: { fontSize: 14, marginTop: 12, textAlign: 'center' },

  bottomPad: { height: 24 },
});
