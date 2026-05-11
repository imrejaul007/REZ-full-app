import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/apiClient';

const STATUS_CONFIG = {
  healthy: { color: '#22C55E', icon: 'checkmark-circle' as const, label: 'Healthy' },
  degraded: { color: '#F59E0B', icon: 'warning' as const, label: 'Degraded' },
  down: { color: '#EF4444', icon: 'close-circle' as const, label: 'Down' },
};

export default function BBPSHealthScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/admin/bbps/health');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      logger.error('Failed to load BBPS health data:', err);
      setData(null);
      setError(err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Show loading or empty state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  }

  if (!data?.billers || data.billers.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
      >
        <View style={styles.emptyContainer}>
          {error ? (
            <>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={[styles.emptyTitle, { color: '#EF4444' }]}>
                Failed to load health data
              </Text>
              <Text style={styles.emptyMessage}>{error}</Text>
              <Text style={[styles.emptyMessage, { marginTop: 8 }]}>Pull down to retry</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No BBPS health data available</Text>
              <Text style={styles.emptyMessage}>
                Health status will appear once billers are configured and monitored.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  const billers = data.billers;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }}
        />
      }
    >
      {/* Summary */}
      <View style={styles.summaryRow}>
        {[
          {
            label: 'Healthy',
            count: billers.filter((b: any) => b.status === 'healthy').length,
            color: '#22C55E',
          },
          {
            label: 'Degraded',
            count: billers.filter((b: any) => b.status === 'degraded').length,
            color: '#F59E0B',
          },
          {
            label: 'Down',
            count: billers.filter((b: any) => b.status === 'down').length,
            color: '#EF4444',
          },
        ].map((s) => (
          <View key={s.label} style={[styles.summaryCard, { borderTopColor: s.color }]}>
            <Text style={[styles.summaryNum, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Biller list */}
      <View style={styles.section}>
        {billers.map((b: any) => {
          const sc =
            STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.degraded;
          return (
            <View key={b.billerId || b.name} style={styles.billerCard}>
              <View style={styles.billerHeader}>
                <Ionicons name={sc.icon} size={18} color={sc.color} />
                <Text style={styles.billerName}>{b.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.color + '20' }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>
              <View style={styles.billerMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{b.successRate ?? 0}%</Text>
                  <Text style={styles.metaLabel}>Success Rate</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text
                    style={[
                      styles.metaValue,
                      (b.avgLatencyMs ?? b.avgLatency ?? 0) > 500 && { color: '#F59E0B' },
                    ]}
                  >
                    {b.avgLatencyMs ?? b.avgLatency ?? 0}ms
                  </Text>
                  <Text style={styles.metaLabel}>Avg Latency</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaValue, (b.pendingTx ?? 0) > 5 && { color: '#EF4444' }]}>
                    {b.pendingTx ?? 0}
                  </Text>
                  <Text style={styles.metaLabel}>Pending Tx</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a52',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  summaryRow: { flexDirection: 'row', gap: 10, padding: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    elevation: 1,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { paddingHorizontal: 16 },
  billerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  billerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  billerName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a3a52' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  billerMeta: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: 16, fontWeight: '800', color: '#1a3a52' },
  metaLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
});
