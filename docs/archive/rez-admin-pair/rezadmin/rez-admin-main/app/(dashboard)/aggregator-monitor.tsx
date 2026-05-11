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
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { apiClient } from '../../services/api/apiClient';

interface PlatformStats {
  name: string;
  todayOrders: number;
  acceptanceRate: number;
  avgPrepTime: number;
  isAcceptanceEstimated?: boolean;
  isPrepTimeEstimated?: boolean;
}

interface AggregatorOrder {
  id: string;
  platform: string;
  merchantName: string;
  orderTotal: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'rejected';
  timeAgo: string;
}

interface StuckOrder {
  id: string;
  platform: string;
  merchantName: string;
  status: string;
  minutesStuck: number;
}

interface MerchantIntegration {
  merchantId: string;
  merchantName: string;
  platform: string;
  status: 'active' | 'paused' | 'error';
  lastSync: string;
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIconBox, { backgroundColor: `${iconColor}15` }]}>
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
  headerRight,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
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
        {headerRight}
      </View>
      {children}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: colors.warningLight, text: colors.warningDark },
    accepted: { bg: colors.successLight2, text: colors.greenDark },
    preparing: { bg: colors.infoLight, text: colors.infoDark },
    ready: { bg: colors.successLight2, text: colors.greenDark },
    rejected: { bg: colors.errorLight, text: colors.errorDark },
    active: { bg: colors.successLight2, text: colors.greenDark },
    paused: { bg: colors.warningLight, text: colors.warningDark },
    error: { bg: colors.errorLight, text: colors.errorDark },
  };

  const colorSet = statusColors[status] || statusColors.pending;

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
      <Text style={[styles.badgeText, { color: colorSet.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const platformColors: Record<string, string> = {
    swiggy: '#EF4444',
    zomato: '#F97316',
    dunzo: '#8B5CF6',
    ondc: '#3B82F6',
  };

  return (
    <View
      style={[
        styles.platformBadge,
        { backgroundColor: platformColors[platform.toLowerCase()] || colors.icon },
      ]}
    >
      <Text style={[styles.platformBadgeText]}>{platform.substring(0, 2).toUpperCase()}</Text>
    </View>
  );
}

export default function AggregatorMonitorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [recentOrders, setRecentOrders] = useState<AggregatorOrder[]>([]);
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [merchantIntegrations, setMerchantIntegrations] = useState<MerchantIntegration[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Load data on mount
    loadData(false);

    // Auto-refresh every 30 seconds if enabled
    if (autoRefreshEnabled) {
      intervalRef.current = setInterval(() => {
        loadData(true);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefreshEnabled]);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/aggregator-orders', {
        platform: '',
        status: '',
        page: 1,
      } as any);

      if (response.success && response.data) {
        // FIX-BUG-MEDIUM-001: Add null guards to avoid crash if API returns undefined fields
        const { orders = [], platformStats: stats = [] } = response.data as any;

        // Transform platform stats from API format
        const transformedStats: PlatformStats[] = (stats || []).map((stat: any) => ({
          name: stat._id.charAt(0).toUpperCase() + stat._id.slice(1),
          todayOrders: stat.count,
          acceptanceRate: stat.acceptanceRate ?? 95, // Fallback estimated value
          avgPrepTime: stat.avgPrepTime ?? 20, // Fallback estimated value
          isAcceptanceEstimated: stat.acceptanceRate == null,
          isPrepTimeEstimated: stat.avgPrepTime == null,
        }));

        setPlatformStats(transformedStats);
        setRecentOrders(orders || []);
        setStuckOrders(orders?.filter((o: any) => o.status === 'pending').slice(0, 2) || []);
        // NOTE: Integration status is derived from recent orders, not a real integrations API
        setMerchantIntegrations(
          orders?.slice(0, 5).map((o: any) => ({
            merchantId: o.id,
            merchantName: o.merchantName,
            platform: o.platform,
            status: o.status === 'accepted' || o.status === 'preparing' ? 'active' : 'paused',
            lastSync: o.timeAgo,
          })) || []
        );
      }
    } catch (error: any) {
      if (!silent) {
        showAlert('Error', 'Failed to load aggregator data');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, []);

  const handleRefreshButton = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    showAlert(
      'Auto Refresh',
      autoRefreshEnabled
        ? 'Auto-refresh disabled. Tap to refresh manually.'
        : 'Auto-refresh enabled every 30s.'
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading aggregator data...</Text>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Aggregator Monitor</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Real-time order tracking
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            {
              backgroundColor: autoRefreshEnabled ? colors.tint : colors.border,
            },
          ]}
          onPress={handleRefreshButton}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={autoRefreshEnabled ? colors.card : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Platform Stats */}
      <View style={styles.platformStatsContainer}>
        {platformStats.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.name}
            value={stat.todayOrders}
            subtext={`${stat.acceptanceRate}% acceptance${stat.isAcceptanceEstimated ? ' (estimated)' : ''} | ~${stat.avgPrepTime}min prep${stat.isPrepTimeEstimated ? ' (estimated)' : ''}`}
            icon="bag"
            iconColor={colors.info}
          />
        ))}
      </View>

      {/* Live Order Feed */}
      <SectionCard
        title="Live Order Feed"
        icon="list"
        iconColor={colors.info}
        headerRight={
          <View style={[styles.liveIndicator, { backgroundColor: colors.errorDark }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        }
      >
        <View style={styles.orderFeed}>
          {recentOrders.map((order, idx) => (
            <View
              key={idx}
              style={[
                styles.orderItem,
                idx < recentOrders.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.orderLeft}>
                <PlatformBadge platform={order.platform} />
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderId, { color: colors.text }]} numberOfLines={1}>
                    {order.id} • {order.merchantName}
                  </Text>
                  <Text style={[styles.orderTime, { color: colors.icon }]}>{order.timeAgo}</Text>
                </View>
              </View>
              <View style={styles.orderRight}>
                <Text style={[styles.orderAmount, { color: colors.text, fontWeight: '600' }]}>
                  Rs {order.orderTotal}
                </Text>
                <StatusBadge status={order.status} />
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Alert Items - Stuck Orders */}
      {stuckOrders.length > 0 && (
        <SectionCard
          title={`Alert: ${stuckOrders.length} Stuck Orders`}
          icon="alert-circle"
          iconColor={colors.errorDark}
        >
          <View style={styles.alertList}>
            {stuckOrders.map((order, idx) => (
              <View
                key={idx}
                style={[
                  styles.alertItem,
                  idx < stuckOrders.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={styles.alertLeft}>
                  <View style={[styles.alertIcon, { backgroundColor: colors.errorLight }]}>
                    <Ionicons name="warning" size={16} color={colors.errorDark} />
                  </View>
                  <View style={styles.alertInfo}>
                    <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>
                      {order.id} • {order.merchantName}
                    </Text>
                    <Text style={[styles.alertSubtext, { color: colors.icon }]}>
                      {order.platform} • {order.minutesStuck}min stuck
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.alertAction, { backgroundColor: colors.tint }]}>
                  <Ionicons name="checkmark" size={16} color={colors.card} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* Merchant Integration Status */}
      <SectionCard
        title="Merchant Integration Status (estimated)"
        icon="extension-puzzle"
        iconColor={colors.purple}
      >
        <View style={styles.integrationList}>
          {merchantIntegrations.map((integration, idx) => (
            <View
              key={idx}
              style={[
                styles.integrationItem,
                idx < merchantIntegrations.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.integrationLeft}>
                <PlatformBadge platform={integration.platform} />
                <View style={styles.integrationInfo}>
                  <Text style={[styles.integrationName, { color: colors.text }]} numberOfLines={1}>
                    {integration.merchantName}
                  </Text>
                  <Text style={[styles.integrationTime, { color: colors.icon }]}>
                    {integration.lastSync}
                  </Text>
                </View>
              </View>
              <StatusBadge status={integration.status} />
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Integration data disclaimer */}
      <View style={styles.infoNoteContainer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.icon} />
        <Text style={[styles.infoNoteText, { color: colors.icon }]}>
          Integration data is estimated from recent orders.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Last updated:{' '}
          {new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          {autoRefreshEnabled && '(auto-refresh enabled)'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Platform stats container
  platformStatsContainer: {
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
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
    justifyContent: 'space-between',
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

  // Live indicator
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // Order feed
  orderFeed: {
    gap: 0,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 11,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  orderAmount: {
    fontSize: 13,
  },

  // Platform badge
  platformBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Status badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Alert list
  alertList: {
    gap: 0,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtext: {
    fontSize: 11,
  },
  alertAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Integration list
  integrationList: {
    gap: 0,
  },
  integrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  integrationTime: {
    fontSize: 11,
  },

  // Info note
  infoNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoNoteText: {
    fontSize: 11,
    fontStyle: 'italic',
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
