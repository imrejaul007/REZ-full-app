import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardStats, useRecentActivity } from '../../hooks/queries/useDashboard';
import { queryKeys } from '../../hooks/queries/queryKeys';
import { authService } from '../../services/api/auth';
import { socketService } from '../../services/socket';
import { Colors } from '../../constants/Colors';
import { logger } from '../../utils/logger';
import EmergencyActionBar from '../../components/dashboard/EmergencyActionBar';
import ErrorBoundary from '../../components/ErrorBoundary';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  trend?: { value: number; positive: boolean };
  onPress?: () => void;
}

function StatCard({ title, value, subtitle, icon, iconColor, trend, onPress }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.card }, !onPress && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.icon }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.icon }]}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend.positive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.positive ? colors.success : colors.error}
          />
          <Text
            style={[styles.trendText, { color: trend.positive ? colors.success : colors.error }]}
          >
            {trend.value}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const queryClient = useQueryClient();

  // React Query hooks replace manual useState + useEffect data fetching
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: recentActivity,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useRecentActivity();

  const isLoading = statsLoading || activityLoading;
  // AA-DSH-021: Clear error message when data loads successfully
  const dataError =
    !stats && statsError ? (statsError as any)?.message || 'Failed to load dashboard data' : null;

  const [refreshing, setRefreshing] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; merchantName: string; message: string }>
  >([]);

  const loadAdminInfo = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setAdminName(user.name || 'Admin');
        setAdminError(null);
      }
    } catch (error) {
      logger.error('Failed to load admin info:', error);
      setAdminError('Failed to load admin information');
    }
  }, []);

  // Setup Socket.IO connection
  // BUG-007: Store the cleanup function returned by setupSocket and call it on unmount.
  // BUG-080: Do not disconnect the socket singleton on unmount — other screens reuse it.
  useEffect(() => {
    let cleanupListeners: (() => void) | undefined;

    const setupSocket = async () => {
      try {
        await socketService.connect();
        setSocketConnected(true);

        // NOTE: gmv:update and merchant:alert events are not emitted by the
        // backend yet. GMV is loaded via the REST dashboard stats endpoint.
        // When backend emitters are added, re-enable real-time listeners here.

        // Wire connection loss detection to UI
        socketService.onConnectionLost(() => {
          setSocketConnected(false);
          logger.warn('[Admin] Socket connection lost');
        });

        // Listen for new orders (backend emits 'order:created')
        const unsubscribeOrders = socketService.onNewOrder(({ orderId, merchantName, amount }) => {
          logger.info('[Admin] New order:', { orderId, merchantName, amount });
        });

        cleanupListeners = () => {
          unsubscribeOrders();
        };
      } catch (error) {
        logger.error('Socket connection failed:', error);
        setSocketConnected(false);
        // App will continue to work with static data
      }
    };

    setupSocket();

    return () => {
      // Only remove event listeners — do NOT disconnect the shared socket singleton.
      if (cleanupListeners) cleanupListeners();
    };
  }, []);

  useEffect(() => {
    loadAdminInfo();
  }, [loadAdminInfo]);

  // AA-DSH-020: Refetch dashboard stats when screen regains focus
  useFocusEffect(
    useCallback(() => {
      // Refetch stats when the screen comes into focus
      refetchStats();
      refetchActivity();
    }, [refetchStats, refetchActivity])
  );

  // React Query handles staleTime-based refetching — no manual setInterval needed.
  // Pull-to-refresh invalidates both queries and lets React Query re-fetch.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity() }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const formatCurrency = (amount: number) => {
    // AA-DSH-016: Use device locale instead of hardcoded 'en-IN'
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // ADMIN-018: Wrap dashboard in error boundary to catch runtime errors
  return (
    <ErrorBoundary>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {/* Emergency Action Bar */}
        <EmergencyActionBar
          onFreezeMerchant={() => router.push('/(dashboard)/merchants')}
          onSystemAlert={() => router.push('/(dashboard)/notification-management' as any)}
        />

        {/* Error Messages */}
        {(dataError || adminError) && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {dataError || adminError}
            </Text>
          </View>
        )}

        {/* Header with Live Indicator */}
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.adminName}>{adminName}</Text>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.liveIndicator,
                socketConnected ? styles.liveOnline : styles.liveOffline,
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: socketConnected ? Colors.light.success : Colors.light.error },
                ]}
              />
              <Text style={styles.liveText}>{socketConnected ? '● LIVE' : '⚠ OFFLINE'}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/(dashboard)/notification-management' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.card} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unified Command Center — single dashboard for everything */}
        <TouchableOpacity
          style={[styles.liveMonitorBanner, { backgroundColor: colors.navy }]}
          onPress={() => router.push('/(dashboard)/unified-monitor' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.liveMonitorLeft}>
            <View style={styles.liveMonitorDot} />
            <View>
              <Text style={styles.liveMonitorTitle}>COMMAND CENTER</Text>
              <Text style={styles.liveMonitorSub}>
                Infra · Queues · SLA · Finance · Merchants · Orders
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Alerts</Text>
            {alerts.slice(0, 3).map((alert) => (
              <View
                key={alert.id}
                style={[styles.alertBox, { backgroundColor: `${colors.error}15` }]}
              >
                <Ionicons name="alert" size={18} color={colors.error} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {alert.merchantName}
                  </Text>
                  <Text style={[styles.alertMessage, { color: colors.icon }]}>{alert.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Today's GMV"
              value={formatCurrency(stats?.revenue?.today || 0)}
              subtitle={socketConnected ? 'Live' : 'Last sync'}
              icon="wallet"
              iconColor={socketConnected ? colors.success : colors.icon}
              onPress={() => router.push('/(dashboard)/orders')}
            />
            <StatCard
              title="Platform Fees"
              value={
                stats?.revenue?.todayPlatformFees
                  ? formatCurrency(stats.revenue.todayPlatformFees)
                  : '0'
              }
              subtitle={
                stats?.revenue?.todayPlatformFees &&
                stats?.revenue?.today &&
                stats.revenue.today > 0
                  ? `${((stats.revenue.todayPlatformFees / stats.revenue.today) * 100).toFixed(1)}% of GMV`
                  : 'Commission revenue'
              }
              icon="cash"
              iconColor={colors.info}
            />
            <StatCard
              title="Orders Today"
              value={stats?.orders?.today || 0}
              subtitle={`${stats?.orders?.thisWeek || 0} this week`}
              icon="receipt"
              iconColor={colors.warning}
              onPress={() => router.push('/(dashboard)/orders')}
            />
            <StatCard
              title="Pending Orders"
              value={stats?.orders?.pendingCount || 0}
              icon="hourglass"
              iconColor={colors.error}
              onPress={() => router.push('/(dashboard)/orders')}
            />
          </View>
        </View>

        {/* Merchants Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Merchants</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Merchants"
              value={stats?.merchants?.total || 0}
              icon="storefront"
              iconColor={colors.purple}
              onPress={() => router.push('/(dashboard)/merchants')}
            />
            <StatCard
              title="Pending Approval"
              value={stats?.merchants?.pending || 0}
              icon="time"
              iconColor={colors.warning}
              onPress={() => router.push('/(dashboard)/merchants')}
            />
            <StatCard
              title="Active"
              value={stats?.merchants?.active || 0}
              icon="checkmark-circle"
              iconColor={colors.success}
            />
            <StatCard
              title="New This Month"
              value={stats?.merchants?.newThisMonth || 0}
              icon="add-circle"
              iconColor={colors.info}
            />
          </View>
        </View>

        {/* Users Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Users</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={formatNumber(stats?.users?.total || 0)}
              icon="people"
              iconColor={colors.cyan}
            />
            <StatCard
              title="Active Users"
              value={formatNumber(stats?.users?.active || 0)}
              icon="person-circle"
              iconColor={colors.success}
            />
            <StatCard
              title="New Today"
              value={stats?.users?.newToday || 0}
              icon="person-add"
              iconColor={colors.info}
            />
            <StatCard
              title="New This Month"
              value={formatNumber(stats?.users?.newThisMonth || 0)}
              icon="trending-up"
              iconColor={colors.purple}
            />
          </View>
        </View>

        {/* Coins Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rez Coins</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Awarded"
              value={formatNumber(stats?.coins?.totalAwarded || 0)}
              icon="sparkles"
              iconColor={colors.warning}
            />
            <StatCard
              title="Pending Approval"
              value={stats?.coins?.pendingApproval || 0}
              icon="hourglass"
              iconColor={colors.error}
              onPress={() => router.push('/(dashboard)/coin-rewards')}
            />
            <StatCard
              title="Awarded Today"
              value={formatNumber(stats?.coins?.awardedToday || 0)}
              icon="today"
              iconColor={colors.success}
            />
            <StatCard
              title="This Month"
              value={formatNumber(stats?.coins?.awardedThisMonth || 0)}
              icon="calendar"
              iconColor={colors.info}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(dashboard)/coin-rewards')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="gift" size={20} color={colors.errorDark} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Review Coin Rewards</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(dashboard)/merchants')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.infoLighter }]}>
                <Ionicons name="storefront" size={20} color={colors.info} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Approve Merchants</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(dashboard)/orders')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="receipt" size={20} color={colors.success} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Manage Orders</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(dashboard)/wallet')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.purple}20` }]}>
                <Ionicons name="wallet" size={20} color={colors.purple} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Platform Wallet</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(dashboard)/web-menu-analytics' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.cyan}20` }]}>
                <Ionicons name="qr-code-outline" size={20} color={colors.cyan} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Web Menu Analytics</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ErrorBoundary>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  liveOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  liveOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.card,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  adminName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.card,
  },
  notificationButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 11,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
  },
  actionsCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray100,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  // Live Monitor Banner
  liveMonitorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.light.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  liveMonitorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveMonitorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.green,
    shadowColor: Colors.light.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  liveMonitorTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liveMonitorSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 1,
  },
});
