import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
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
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_ROLES } from '../../constants/roles';

interface PlatformStats {
  totalMerchants: number;
  activeMerchants: number;
  newThisMonth: number;
  churnedMerchants: number;
  planDistribution: {
    starter: number;
    growth: number;
    pro: number;
  };
  mrr: number;
  arr: number;
  upgradesThisMonth: number;
  aggregatorOrders: {
    today: number;
    pending: number;
    acceptanceRate: number;
  };
}

function StatCard({
  label,
  value,
  icon,
  iconColor,
  subtext,
  backgroundColor,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  subtext?: string;
  backgroundColor?: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIconBox, { backgroundColor: backgroundColor || `${iconColor}15` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </Text>
        {subtext && <Text style={[styles.statSubtext, { color: colors.icon }]}>{subtext}</Text>}
      </View>
    </View>
  );
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

function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.barChartContainer}>
      <View style={styles.barRow}>
        {data.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.barSegment,
              {
                backgroundColor: item.color,
                width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.barLegend}>
        {data.map((item, idx) => (
          <View key={idx} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]}>
              {item.label} ({item.value})
            </Text>
            <Text style={[styles.legendPercent, { color: colors.icon }]}>
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function QuickActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          backgroundColor: isPrimary ? colors.tint : colors.border,
          borderColor: colors.tint,
          borderWidth: isPrimary ? 0 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={isPrimary ? colors.card : colors.text} />
      <Text
        style={[
          styles.actionButtonLabel,
          { color: isPrimary ? colors.card : colors.text },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PlatformControlCenterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { hasRole } = useAuth();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();

    // Auto-refresh every 5 minutes
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, 300000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await apiClient.get<PlatformStats>('admin/platform-stats');
      if (response.data) {
        setStats(response.data);
        setDataError(null);
        setIsOfflineMode(false);
      } else {
        setDataError('No data received from server');
        setIsOfflineMode(true);
        setStats(null);
      }
    } catch (error: any) {
      logger.error('Failed to load platform stats:', error.message);
      setDataError(error.message || 'Failed to load platform stats');
      setIsOfflineMode(true);
      setStats(null);
      if (!silent) {
        showAlert('Error', 'Unable to load platform stats. Please check your connection.');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Require super_admin role
  if (!hasRole(ADMIN_ROLES.SUPER_ADMIN)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.icon} />
        <Text style={[styles.loadingText, { color: colors.text, fontWeight: '700', fontSize: 18, marginTop: 16 }]}>
          Access Denied
        </Text>
        <Text style={[styles.loadingText, { color: colors.icon, textAlign: 'center', paddingHorizontal: 32 }]}>
          You need Super Admin privileges to access the Platform Control Center.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>
          Loading platform stats...
        </Text>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Platform Control Center
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Real-time platform metrics
          </Text>
        </View>
      </View>

      {isOfflineMode && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="warning" size={18} color={colors.error} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.errorBannerTitle, { color: colors.error }]}>Offline Mode</Text>
            <Text style={[styles.errorBannerText, { color: colors.errorDark }]}>
              Unable to fetch live data. Refresh to retry.
            </Text>
          </View>
        </View>
      )}

      {dataError && !stats && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="alert-circle" size={24} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.error }]}>Failed to Load Stats</Text>
          <Text style={[styles.errorMessage, { color: colors.errorDark }]}>{dataError}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.error }]}
            onPress={() => loadData(false)}
          >
            <Ionicons name="refresh" size={16} color={colors.card} />
            <Text style={[styles.retryButtonText, { color: colors.card }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {stats && (
        <>
          {/* Merchant Health Cards */}
          <SectionCard
            title="Merchant Health"
            icon="people"
            iconColor={colors.success}
          >
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Merchants"
                value={stats.totalMerchants}
                icon="storefront"
                iconColor={colors.info}
              />
              <StatCard
                label="Active (Last 7d)"
                value={stats.activeMerchants}
                icon="checkmark-circle"
                iconColor={colors.success}
                subtext={`${((stats.activeMerchants / stats.totalMerchants) * 100).toFixed(1)}% active`}
              />
              <StatCard
                label="New This Month"
                value={stats.newThisMonth}
                icon="add-circle"
                iconColor={colors.warning}
              />
              <StatCard
                label="Churned (30d+)"
                value={stats.churnedMerchants}
                icon="alert-circle"
                iconColor={colors.errorDark}
              />
            </View>
          </SectionCard>

          {/* Plan Distribution */}
          <SectionCard
            title="Plan Distribution"
            icon="pie-chart"
            iconColor={colors.purple}
          >
            <HorizontalBarChart
              data={[
                {
                  label: 'Starter',
                  value: stats.planDistribution.starter,
                  color: colors.info,
                },
                {
                  label: 'Growth',
                  value: stats.planDistribution.growth,
                  color: colors.warning,
                },
                {
                  label: 'Pro',
                  value: stats.planDistribution.pro,
                  color: colors.success,
                },
              ]}
            />
          </SectionCard>

          {/* Revenue Summary */}
          <SectionCard
            title="Revenue Summary"
            icon="cash"
            iconColor={colors.success}
          >
            <View style={styles.statsGrid}>
              <StatCard
                label="MRR"
                value={`Rs ${(stats.mrr / 100000).toFixed(1)}L`}
                icon="trending-up"
                iconColor={colors.success}
                subtext="Monthly recurring"
              />
              <StatCard
                label="ARR"
                value={`Rs ${(stats.arr / 10000000).toFixed(1)}Cr`}
                icon="analytics"
                iconColor={colors.info}
                subtext="Annual estimate"
              />
              <StatCard
                label="Upgrades This Month"
                value={stats.upgradesThisMonth}
                icon="arrow-up"
                iconColor={colors.warning}
                subtext="Plan migrations"
              />
            </View>
          </SectionCard>

          {/* Aggregator Activity */}
          <SectionCard
            title="Aggregator Activity"
            icon="rocket"
            iconColor={colors.orange}
          >
            <View style={styles.statsGrid}>
              <StatCard
                label="Orders Today"
                value={stats.aggregatorOrders.today}
                icon="bag"
                iconColor={colors.info}
              />
              <StatCard
                label="Pending Orders"
                value={stats.aggregatorOrders.pending}
                icon="hourglass"
                iconColor={colors.warning}
              />
              <StatCard
                label="Acceptance Rate"
                value={`${stats.aggregatorOrders.acceptanceRate}%`}
                icon="checkmark"
                iconColor={colors.success}
              />
            </View>
          </SectionCard>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <QuickActionButton
                label="View All Merchants"
                icon="list"
                onPress={() => router.push('/(dashboard)/merchants')}
              />
              <QuickActionButton
                label="Merchant Plans"
                icon="layers"
                onPress={() => router.push('/(dashboard)/platform-config')}
                variant="secondary"
              />
              <QuickActionButton
                label="Plan Analytics"
                icon="analytics"
                onPress={() => router.push('/(dashboard)/merchant-plan-analytics' as any)}
              />
              <QuickActionButton
                label="Aggregator Monitor"
                icon="eye"
                onPress={() => router.push('/(dashboard)/aggregator-monitor' as any)}
                variant="secondary"
              />
              <QuickActionButton
                label="System Health"
                icon="pulse"
                onPress={() => router.push('/(dashboard)/system-health' as any)}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Last updated: {new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </>
      )}
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

  // Stats grid
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statSubtext: {
    fontSize: 11,
    marginTop: 2,
  },

  // Bar chart
  barChartContainer: {
    gap: 8,
  },
  barRow: {
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
  },
  barSegment: {
    height: '100%',
    minWidth: 2,
  },
  barLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  legendPercent: {
    fontSize: 11,
    textAlign: 'right',
    minWidth: 40,
  },

  // Actions section
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Error states
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errorBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  errorBannerText: {
    fontSize: 12,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: 13,
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
