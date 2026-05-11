/**
 * app/(dashboard)/web-menu-analytics.tsx
 * Web Menu Analytics — QR scan orders & dine-in web performance
 *
 * Displays:
 * - Summary cards: total web menu orders, average order value, total revenue
 * - Top 5 stores by web menu orders
 * - Recent web menu orders (last 20)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import { showAlert } from '../../utils/alert';

interface WebMenuOrder {
  _id: string;
  orderNumber: string;
  storeName: string;
  storeId: string;
  customerPhone: string;
  customerName?: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  tableNumber?: string;
}

interface WebMenuData {
  totalCount: number;
  todayCount: number;
  monthCount: number;
  totalRevenue: number;
  todayRevenue: number;
  avgOrderValue: number;
  topStores: { storeId: string; storeName: string; count: number; revenue: number }[];
  recentOrders: WebMenuOrder[];
}

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
}

function KPICard({ label, value, subtext, icon, iconColor, backgroundColor }: KPICardProps) {
  return (
    <View style={[styles.kpiCard, { backgroundColor }]}>
      <View style={styles.kpiIconContainer}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
        {subtext && <Text style={styles.kpiSubtext}>{subtext}</Text>}
      </View>
    </View>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function WebMenuAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [data, setData] = useState<WebMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  const loadData = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    try {
      setError(null);
      const response = await apiClient.get<WebMenuData>('admin/dashboard/web-menu-analytics');
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load web menu analytics');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to load web menu analytics';
      setError(msg);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading && !data) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
        <Text style={[styles.emptyText, { color: colors.text, marginTop: 12 }]}>{error}</Text>
      </View>
    );
  }

  if (!data || data.totalCount === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Web Menu Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            QR scan orders & dine-in web performance
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="qr-code-outline" size={64} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No web menu orders found</Text>
          <Text style={[styles.emptySubtext, { color: colors.icon }]}>
            Web menu orders will appear here once customers scan QR codes
          </Text>
        </View>
      </ScrollView>
    );
  }

  const recentOrders = data.recentOrders ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Web Menu Analytics</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          QR scan orders & dine-in web performance
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>SUMMARY</Text>
        <View style={styles.kpiGrid}>
          <KPICard
            label="Total Orders"
            value={data.totalCount}
            subtext={`${data.todayCount} today · ${data.monthCount} this month`}
            icon="receipt-outline"
            iconColor="#3B82F6"
            backgroundColor={`${colors.card}`}
          />
          <KPICard
            label="Total Revenue"
            value={formatCurrency(data.totalRevenue)}
            subtext={`${formatCurrency(data.todayRevenue)} today`}
            icon="cash-outline"
            iconColor="#10b981"
            backgroundColor={`${colors.card}`}
          />
        </View>
        <View style={[styles.kpiGrid, { marginTop: 12 }]}>
          <KPICard
            label="Avg Order Value"
            value={formatCurrency(data.avgOrderValue)}
            icon="trending-up-outline"
            iconColor="#f59e0b"
            backgroundColor={`${colors.card}`}
          />
          <KPICard
            label="Active Stores"
            value={data.topStores.length}
            icon="storefront-outline"
            iconColor="#8b5cf6"
            backgroundColor={`${colors.card}`}
          />
        </View>
      </View>

      {/* Top 5 Stores */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>TOP STORES BY WEB ORDERS</Text>
        {(data.topStores ?? []).map((store, index) => (
          <View key={store.storeId} style={[styles.storeRow, { backgroundColor: colors.card }]}>
            <View style={[styles.storeRank, { backgroundColor: `${colors.tint}20` }]}>
              <Text style={[styles.storeRankText, { color: colors.tint }]}>#{index + 1}</Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>
                {store.storeName}
              </Text>
              <Text style={[styles.storeStats, { color: colors.icon }]}>
                {store.count} orders · {formatCurrency(store.revenue)}
              </Text>
            </View>
            <View style={styles.storeOrderCount}>
              <Text style={[styles.storeOrderCountText, { color: colors.tint }]}>
                {store.count}
              </Text>
              <Text style={[styles.storeOrderLabel, { color: colors.icon }]}>orders</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Web Menu Orders */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          RECENT WEB MENU ORDERS (LAST {recentOrders.length})
        </Text>
        {recentOrders.map((order) => (
          <View key={order._id} style={[styles.orderRow, { backgroundColor: colors.card }]}>
            <View style={styles.orderLeft}>
              <Text style={[styles.orderNumber, { color: colors.text }]}>#{order.orderNumber}</Text>
              <Text style={[styles.orderMeta, { color: colors.icon }]} numberOfLines={1}>
                {order.customerName || order.customerPhone || 'Walk-in'} · {order.storeName}
                {order.tableNumber ? ` · T${order.tableNumber}` : ''}
              </Text>
              <Text style={[styles.orderDate, { color: colors.icon }]}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={[styles.orderAmount, { color: colors.text }]}>
                {formatCurrency(order.total ?? 0)}
              </Text>
              <View style={[styles.orderStatusBadge, { backgroundColor: `${colors.tint}15` }]}>
                <Text style={[styles.orderStatusText, { color: colors.tint }]}>{order.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Showing {data.totalCount} total web menu orders · Last 20 shown below
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#999',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  storeRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeRankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  storeStats: {
    fontSize: 12,
  },
  storeOrderCount: {
    alignItems: 'center',
  },
  storeOrderCountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  storeOrderLabel: {
    fontSize: 11,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  orderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  orderMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
