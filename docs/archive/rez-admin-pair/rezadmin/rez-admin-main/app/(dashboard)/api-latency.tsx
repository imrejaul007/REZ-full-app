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

interface EndpointMetric {
  route: string;
  method: string;
  p50: number;
  p95: number;
  p99: number;
  rps: number;
  errorPct: number;
  count: number;
}

interface LatencyData {
  overall: { p50: number; p95: number; p99: number; rps: number; errorRate: number };
  slowest: EndpointMetric[];
  updatedAt: string;
}

const getLatencyColor = (ms: number) => {
  if (ms < 200) return '#22C55E';
  if (ms < 500) return '#F59E0B';
  if (ms < 1000) return '#F97316';
  return '#EF4444';
};

const LatencyBar = ({ value, max }: { value: number; max: number }) => (
  <View style={styles.barTrack}>
    <View
      style={[
        styles.barFill,
        {
          width: `${Math.min((value / max) * 100, 100)}%`,
          backgroundColor: getLatencyColor(value),
        },
      ]}
    />
  </View>
);

export default function ApiLatencyScreen() {
  const [data, setData] = useState<LatencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get<LatencyData>('/admin/system/metrics');
      setData((res as any).data || null);
    } catch (e) {
      logger.error('[ApiLatency] fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  if (!data)
    return (
      <View style={styles.center}>
        <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No Prometheus metrics available</Text>
        <Text style={styles.emptySubText}>Ensure PROMETHEUS_ENABLED=true in backend .env</Text>
      </View>
    );

  const maxP95 = Math.max(...(data.slowest || []).map((e) => e.p95), 1000);

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
      {/* Overall metrics */}
      <View style={styles.overallCard}>
        <Text style={styles.cardTitle}>Overall Platform Performance</Text>
        <View style={styles.metricsGrid}>
          {[
            {
              label: 'p50',
              value: `${data.overall.p50}ms`,
              color: getLatencyColor(data.overall.p50),
            },
            {
              label: 'p95',
              value: `${data.overall.p95}ms`,
              color: getLatencyColor(data.overall.p95),
            },
            {
              label: 'p99',
              value: `${data.overall.p99}ms`,
              color: getLatencyColor(data.overall.p99),
            },
            { label: 'Req/s', value: `${data.overall.rps}`, color: '#1a3a52' },
            {
              label: 'Error Rate',
              value: `${data.overall.errorRate}%`,
              color: data.overall.errorRate > 1 ? '#EF4444' : '#22C55E',
            },
          ].map((m) => (
            <View key={m.label} style={styles.metricCell}>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Slowest endpoints */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Slowest Endpoints (p95 &gt; 200ms)</Text>
        {(data.slowest || []).length === 0 && (
          <Text style={styles.emptyText}>All endpoints performing well ✓</Text>
        )}
        {(data.slowest || []).map((ep, i) => (
          <View key={i} style={styles.endpointCard}>
            <View style={styles.endpointHeader}>
              <View
                style={[
                  styles.methodBadge,
                  { backgroundColor: ep.method === 'GET' ? '#DBEAFE' : '#FCE7F3' },
                ]}
              >
                <Text
                  style={[
                    styles.methodText,
                    { color: ep.method === 'GET' ? '#1D4ED8' : '#9D174D' },
                  ]}
                >
                  {ep.method}
                </Text>
              </View>
              <Text style={styles.routeText} numberOfLines={1}>
                {ep.route}
              </Text>
              <Text style={[styles.p95Badge, { color: getLatencyColor(ep.p95) }]}>{ep.p95}ms</Text>
            </View>
            <LatencyBar value={ep.p95} max={maxP95} />
            <View style={styles.endpointMeta}>
              <Text style={styles.metaText}>p50: {ep.p50}ms</Text>
              <Text style={styles.metaText}>p99: {ep.p99}ms</Text>
              <Text style={styles.metaText}>{ep.rps} req/s</Text>
              {ep.errorPct > 0 && (
                <Text style={[styles.metaText, { color: '#EF4444' }]}>
                  {ep.errorPct.toFixed(1)}% errors
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  overallCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a3a52', marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCell: { alignItems: 'center', minWidth: 60 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  section: { marginHorizontal: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a3a52', marginBottom: 10 },
  endpointCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  endpointHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  methodBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  methodText: { fontSize: 11, fontWeight: '700' },
  routeText: { flex: 1, fontSize: 12, color: '#374151', fontFamily: 'monospace' },
  p95Badge: { fontSize: 14, fontWeight: '800' },
  barTrack: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  endpointMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaText: { fontSize: 11, color: '#6B7280' },
});
