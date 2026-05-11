import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { apiClient } from '../../services/api/apiClient';

interface PlanData {
  name: string;
  count: number;
  mrrContribution: number;
}

interface TopMerchant {
  name: string;
  plan: string;
  mrr: number;
}

interface TrendData {
  month: string;
  starter: number;
  growth: number;
  pro: number;
}

interface MerchantPlanAnalyticsData {
  plans: PlanData[];
  topMerchants: TopMerchant[];
  trends: TrendData[];
}

function SectionCard({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function FunnelVisualization({
  data,
}: {
  data: { level: string; count: number; percentage: number; color: string }[];
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.funnelContainer}>
      {data.map((item, idx) => (
        <View key={idx} style={styles.funnelLevel}>
          <View
            style={[
              styles.funnelBox,
              {
                backgroundColor: item.color,
                width: `${item.percentage}%`,
              },
            ]}
          />
          <View style={styles.funnelLabel}>
            <Text style={[styles.funnelLevelText, { color: colors.text }]}>{item.level}</Text>
            <Text style={[styles.funnelCount, { color: colors.icon }]}>
              {item.count} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SimpleLineChart({ data, height = 180 }: { data: TrendData[]; height?: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={[styles.emptyChartText, { color: colors.icon }]}>
          Connect analytics to see trends
        </Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.starter, d.growth, d.pro]));

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartBars}>
        {data.map((item, idx) => (
          <View key={idx} style={styles.chartColumn}>
            <View style={styles.barsGroup}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${(item.starter / maxValue) * 100}%`,
                    backgroundColor: colors.info,
                  },
                ]}
              />
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${(item.growth / maxValue) * 100}%`,
                    backgroundColor: colors.warning,
                  },
                ]}
              />
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${(item.pro / maxValue) * 100}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>
            <Text style={[styles.chartLabel, { color: colors.icon }]}>{item.month}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Starter</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Growth</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Pro</Text>
        </View>
      </View>
    </View>
  );
}

export default function MerchantPlanAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlanData[]>([]);
  const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const totalMrr = planData.reduce((sum, p) => sum + p.mrrContribution, 0);
  const starterCount = planData.length > 0 ? planData[0].count : 0;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get<MerchantPlanAnalyticsData>('/admin/merchants/plan-analytics');
      if (res.success && res.data) {
        setPlanData(res.data.plans ?? []);
        setTopMerchants(res.data.topMerchants ?? []);
        setTrendData(res.data.trends ?? []);
      } else {
        throw new Error(res.message || 'Failed to load plan analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plan analytics');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    showAlert('Export', 'CSV export triggered for plan analytics data');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.icon} />
        <Text
          style={[styles.loadingText, { color: colors.text, fontWeight: '600', marginTop: 12 }]}
        >
          Failed to load plan analytics
        </Text>
        <Text style={[styles.loadingText, { color: colors.icon }]}>{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setIsLoading(true);
            fetchData();
          }}
          style={[styles.actionButton, { backgroundColor: colors.tint, marginTop: 16, width: 120 }]}
        >
          <Text style={[styles.actionButtonText, { color: colors.card }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Plan Analytics</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Subscription deep dive
          </Text>
        </View>
      </View>

      {/* Plan Breakdown Table */}
      <SectionCard title="Plan Breakdown" icon="layers" iconColor={colors.purple}>
        <View style={styles.tableContainer}>
          <View
            style={[
              styles.tableRow,
              styles.tableHeader,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[styles.tableCell, styles.planCol, { color: colors.icon, fontWeight: '600' }]}
            >
              Plan
            </Text>
            <Text
              style={[styles.tableCell, styles.numCol, { color: colors.icon, fontWeight: '600' }]}
            >
              Count
            </Text>
            <Text
              style={[styles.tableCell, styles.mrrCol, { color: colors.icon, fontWeight: '600' }]}
            >
              MRR
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.percentCol,
                { color: colors.icon, fontWeight: '600' },
              ]}
            >
              % Total
            </Text>
          </View>
          {planData.map((plan, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                idx < planData.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.tableCell, styles.planCol, { color: colors.text }]}>
                {plan.name}
              </Text>
              <Text style={[styles.tableCell, styles.numCol, { color: colors.text }]}>
                {plan.count}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.mrrCol,
                  { color: colors.success, fontWeight: '600' },
                ]}
              >
                Rs {(plan.mrrContribution / 100000).toFixed(2)}L
              </Text>
              <Text style={[styles.tableCell, styles.percentCol, { color: colors.text }]}>
                {totalMrr > 0 ? ((plan.mrrContribution / totalMrr) * 100).toFixed(1) : '0.0'}%
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Upgrade Funnel */}
      <SectionCard title="Upgrade Funnel" icon="trending-up" iconColor={colors.success}>
        <FunnelVisualization
          data={[
            {
              level: 'Starter',
              count: starterCount,
              percentage: 100,
              color: colors.info,
            },
            {
              level: 'Growth',
              count: planData[1]?.count ?? 0,
              percentage:
                starterCount > 0 && planData[1] ? (planData[1].count / starterCount) * 100 : 0,
              color: colors.warning,
            },
            {
              level: 'Pro',
              count: planData[2]?.count ?? 0,
              percentage:
                starterCount > 0 && planData[2] ? (planData[2].count / starterCount) * 100 : 0,
              color: colors.success,
            },
          ]}
        />
      </SectionCard>

      {/* Top Revenue Merchants */}
      <SectionCard title="Top Revenue Merchants" icon="medal" iconColor={colors.gold}>
        <View style={styles.merchantList}>
          {topMerchants.map((merchant, idx) => (
            <View
              key={idx}
              style={[
                styles.merchantRow,
                idx < topMerchants.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.merchantInfo}>
                <View style={[styles.rankBadge, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.rankText, { color: colors.text }]}>{idx + 1}</Text>
                </View>
                <View style={styles.merchantDetails}>
                  <Text style={[styles.merchantName, { color: colors.text }]} numberOfLines={1}>
                    {merchant.name}
                  </Text>
                  <Text style={[styles.planName, { color: colors.icon }]}>
                    {merchant.plan} Plan
                  </Text>
                </View>
              </View>
              <Text style={[styles.merchantMrr, { color: colors.success, fontWeight: '600' }]}>
                Rs {(merchant.mrr / 1000).toFixed(1)}K
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Monthly Trend */}
      <SectionCard title="Monthly Trend (Last 6 Months)" icon="analytics" iconColor={colors.info}>
        <SimpleLineChart data={trendData} />
        <View style={styles.trendCta}>
          <Ionicons name="link" size={14} color={colors.icon} />
          <Text style={[styles.trendCtaText, { color: colors.icon }]}>
            Connect advanced analytics for real-time data
          </Text>
        </View>
      </SectionCard>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={handleExportCSV}
        >
          <Ionicons name="download" size={18} color={colors.card} />
          <Text style={[styles.actionButtonText, { color: colors.card }]}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { borderWidth: 1, borderColor: colors.tint, backgroundColor: colors.card },
          ]}
          onPress={() => router.push('/(dashboard)/platform-config')}
        >
          <Ionicons name="settings" size={18} color={colors.tint} />
          <Text style={[styles.actionButtonText, { color: colors.tint }]}>Edit Plan Limits</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Data as of {new Date().toLocaleDateString('en-IN')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Table
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeader: {
    marginHorizontal: -8,
    marginTop: -8,
    marginBottom: 0,
    paddingHorizontal: 16,
  },
  tableCell: {
    fontSize: 13,
  },
  planCol: {
    flex: 1.2,
  },
  numCol: {
    flex: 0.8,
    textAlign: 'center',
  },
  mrrCol: {
    flex: 1,
    textAlign: 'right',
  },
  percentCol: {
    flex: 0.7,
    textAlign: 'right',
  },

  // Funnel
  funnelContainer: {
    gap: 12,
  },
  funnelLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  funnelBox: {
    height: 40,
    borderRadius: 8,
    minWidth: 40,
  },
  funnelLabel: {
    flex: 1,
  },
  funnelLevelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  funnelCount: {
    fontSize: 12,
    marginTop: 2,
  },

  // Chart
  chartContainer: {
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 13,
    textAlign: 'center',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 12,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barsGroup: {
    width: '100%',
    height: '100%',
    flexDirection: 'column-reverse',
    gap: 2,
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Merchants list
  merchantList: {
    gap: 0,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  planName: {
    fontSize: 11,
  },
  merchantMrr: {
    fontSize: 13,
  },

  // Trend CTA
  trendCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  trendCtaText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Actions
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 11,
  },
});
