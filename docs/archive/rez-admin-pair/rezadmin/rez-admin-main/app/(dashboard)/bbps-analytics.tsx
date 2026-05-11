import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { bbpsService } from '../../services/api/bbps';

interface KPIData {
  gmv: number;
  gmvChange: number;
  transactions: number;
  transactionsChange: number;
  failureRate: number;
  failureRateChange: number;
  coinsIssued: number;
  coinsIssuedChange: number;
}

interface AnalyticsData {
  period: string;
  kpi: KPIData;
  dailyGMV: Array<{ day: string; value: number }>;
  byBillType: Record<string, number>;
  coinsMetrics: { issued: number; redeemed: number };
  topProviders: Array<{ name: string; transactions: number; gmv: number; avgValue: number }>;
}

// DUMMY_ANALYTICS removed — real data loaded from bbpsService.getAnalytics()

export default function BBPSAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bbpsService.getAnalytics(period);
      setAnalytics(data);
    } catch (err: any) {
      logger.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [period, loadAnalytics]);

  const KPICard = ({ label, value, change }: { label: string; value: string; change: number }) => {
    const isPositive = change >= 0;
    return (
      <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.kpiLabel, { color: colors.icon }]}>{label}</Text>
        <Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text>
        <View style={styles.kpiChange}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={isPositive ? colors.success : colors.error}
          />
          <Text
            style={[styles.kpiChangeText, { color: isPositive ? colors.success : colors.error }]}
          >
            {isPositive ? '+' : ''}
            {change}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.periodSelector}>
        {[
          { label: 'Today', value: '1d' },
          { label: '7 Days', value: '7d' },
          { label: '30 Days', value: '30d' },
          { label: '90 Days', value: '90d' },
        ].map((p) => (
          <TouchableOpacity
            key={p.value}
            onPress={() => setPeriod(p.value)}
            style={[
              styles.periodButton,
              {
                backgroundColor: period === p.value ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: period === p.value ? '#fff' : colors.text,
                  fontWeight: period === p.value ? '600' : '500',
                },
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Failed to Load Analytics
            </Text>
            <Text style={[styles.errorMessage, { color: colors.icon }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
              onPress={loadAnalytics}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : analytics ? (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <KPICard
                label="Total GMV"
                value={`₹${(analytics.kpi.gmv / 100000).toFixed(2)}L`}
                change={analytics.kpi.gmvChange}
              />
              <KPICard
                label="Transactions"
                value={analytics.kpi.transactions.toLocaleString()}
                change={analytics.kpi.transactionsChange}
              />
            </View>

            <View style={styles.kpiRow}>
              <KPICard
                label="Failure Rate"
                value={`${analytics.kpi.failureRate}%`}
                change={analytics.kpi.failureRateChange}
              />
              <KPICard
                label="Coins Issued"
                value={(analytics.kpi.coinsIssued / 1000).toFixed(1) + 'K'}
                change={analytics.kpi.coinsIssuedChange}
              />
            </View>

            {/* GMV by Day Chart */}
            {analytics.dailyGMV.length > 0 && (
              <View
                style={[
                  styles.chartContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.chartTitle, { color: colors.text }]}>GMV by Day</Text>
                <View style={styles.barChart}>
                  {(() => {
                    const maxDailyValue = Math.max(1, ...analytics.dailyGMV.map((d) => d.value));
                    return analytics.dailyGMV.map((item, idx) => (
                      <View key={idx} style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              backgroundColor: colors.tint,
                              height: Math.max(2, (item.value / maxDailyValue) * 120),
                            },
                          ]}
                        />
                        <Text style={[styles.barLabel, { color: colors.icon }]}>{item.day}</Text>
                      </View>
                    ));
                  })()}
                </View>
              </View>
            )}

            {/* Revenue by Bill Type */}
            <View
              style={[
                styles.chartContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chartTitle, { color: colors.text }]}>Revenue by Bill Type</Text>
              {(() => {
                const entries = Object.entries(analytics.byBillType);
                const maxVal = Math.max(1, ...entries.map(([, v]) => v));
                if (entries.length === 0) {
                  return (
                    <Text
                      style={[
                        styles.typeValue,
                        { color: colors.icon, textAlign: 'center', paddingVertical: 12 },
                      ]}
                    >
                      No bill type data
                    </Text>
                  );
                }
                return entries.map(([type, volume]) => {
                  const pct = Math.round((volume / maxVal) * 100);
                  return (
                    <View key={type} style={styles.typeRow}>
                      <Text style={[styles.typeLabel, { color: colors.text }]}>{type}</Text>
                      <View style={[styles.typeBar, { backgroundColor: colors.background }]}>
                        <View
                          style={[
                            styles.typeBarFill,
                            {
                              backgroundColor: colors.tint,
                              width: `${pct}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.typeValue, { color: colors.icon }]}>
                        ₹{(volume / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>

            {/* Coins Issued vs Redeemed */}
            <View
              style={[
                styles.chartContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Coins Issued vs Redeemed
              </Text>
              <View style={styles.coinsMetrics}>
                <View style={styles.coinMetricItem}>
                  <View
                    style={[
                      styles.coinMetricBar,
                      { backgroundColor: colors.success, width: '100%' },
                    ]}
                  />
                  <Text style={[styles.coinMetricLabel, { color: colors.text }]}>
                    Issued: {analytics.coinsMetrics.issued.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.coinMetricItem}>
                  <View
                    style={[
                      styles.coinMetricBar,
                      {
                        backgroundColor: colors.info,
                        width: `${analytics.coinsMetrics.issued > 0 ? (analytics.coinsMetrics.redeemed / analytics.coinsMetrics.issued) * 100 : 0}%`,
                      },
                    ]}
                  />
                  <Text style={[styles.coinMetricLabel, { color: colors.text }]}>
                    Redeemed: {analytics.coinsMetrics.redeemed.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Top Providers Table */}
            <View
              style={[
                styles.tableContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chartTitle, { color: colors.text }]}>Top 10 Providers</Text>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableHeaderCell, { color: colors.icon }]}>Provider</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.icon }]}>Txns</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.icon }]}>GMV</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.icon }]}>Avg</Text>
              </View>
              {analytics.topProviders.length === 0 && (
                <Text
                  style={[
                    { color: colors.icon, textAlign: 'center', paddingVertical: 12, fontSize: 13 },
                  ]}
                >
                  No provider data available
                </Text>
              )}
              {analytics.topProviders.map((provider, idx) => (
                <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tableCell, { color: colors.text, flex: 1 }]}>
                    {provider.name}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.text }]}>
                    {provider.transactions}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.text }]}>
                    ₹{(provider.gmv / 1000).toFixed(0)}K
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.tint }]}>
                    ₹{provider.avgValue}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  typeLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '500',
  },
  typeBar: {
    flex: 1,
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
  },
  typeBarFill: {
    height: '100%',
  },
  typeValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  coinsMetrics: {
    gap: 12,
  },
  coinMetricItem: {
    gap: 6,
  },
  coinMetricBar: {
    height: 30,
    borderRadius: 6,
  },
  coinMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tableContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
