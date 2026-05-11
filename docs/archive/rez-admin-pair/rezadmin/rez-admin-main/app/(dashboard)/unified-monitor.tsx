/**
 * app/(dashboard)/unified-monitor.tsx
 *
 * REZ Unified Command Center — Single dashboard combining all monitoring.
 *
 * Sections:
 *   1. Overall Health Banner     — green/amber/red with last-updated timestamp
 *   2. KPI Row                   — orders today, GMV, active users, payment success %
 *   3. Infrastructure            — server (CPU/RAM/uptime), MongoDB, Redis
 *   4. Queue Health (BullMQ)     — waiting/active/completed/failed per queue
 *   5. SLA Contracts             — snapshot freshness, queue depth, daily stats
 *   6. Cron Jobs                 — name, schedule, last run, status
 *   7. Financial Health          — cashback, coin issuance, fraud alerts, settlements
 *   8. Business Metrics          — bookings, payments, BBPS, coin earn/redeem ratio
 *   9. Merchant Live Status      — online/idle/offline counts + pending orders
 *  10. Aggregator Orders         — platform stats, stuck orders
 *  11. BBPS Provider Health      — biller status summary
 *  12. Live Order Feed           — last 10 orders (socket or poll)
 *  13. Reconciliation            — discrepancy summary
 *
 * Auto-refreshes every 15s. All data fetched in parallel.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import {
  systemService,
  SystemHealthData,
  ReconciliationResult,
  QueueInfo,
} from '../../services/api/system';
import { dashboardService, DashboardStats } from '../../services/api/dashboard';
import { economicsService, EconomicsOverview } from '../../services/api/economics';

// ─── Constants ──────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30; // seconds
const NAVY = '#1a3a52';

// ─── Types ──────────────────────────────────────────────────────────────────────

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
type SlaStatus = 'ok' | 'warning' | 'breach' | 'unknown' | 'degraded';

interface SlaMetric {
  status: SlaStatus;
  reason?: string;
  ageMinutes?: number;
  waiting?: number;
  failed?: number;
  threshold?: number;
  merchantCount?: number;
}

interface SlaData {
  overallStatus: SlaStatus;
  metrics: {
    customerSnapshot: SlaMetric;
    merchantEventQueue: SlaMetric;
    dailyStats: SlaMetric;
    broadcastQueue: SlaMetric;
  };
  generatedAt: string;
}

interface BusinessMetrics {
  summary: {
    totalBookings: number;
    totalOrders: number;
    paymentSuccess: number;
    paymentFailure: number;
    coinsEarned: number;
    coinsRedeemed: number;
    newUsers: number;
    bbpsCompleted: number;
  };
  health: {
    paymentSuccessRate: string;
    coinsEarnedVsRedeemedRatio: string;
  };
}

interface MerchantStatusSummary {
  totalOnline: number;
  totalIdle: number;
  totalOffline: number;
  totalActiveSessions: number;
  totalPendingOrders: number;
}

interface AggregatorStats {
  platforms: Array<{
    name: string;
    todayOrders: number;
    acceptanceRate: number;
    avgPrepTime: number;
  }>;
  stuckOrders: Array<{
    id: string;
    platform: string;
    merchantName: string;
    minutesStuck: number;
  }>;
}

interface BbpsHealth {
  billers: Array<{ name: string; status: 'healthy' | 'degraded' | 'down'; successRate: number }>;
}

interface JobData {
  name: string;
  schedule: string;
  category: string;
  lastRun: string | null;
  consecutiveFailures: number;
  status: 'healthy' | 'warning' | 'failing' | 'unknown';
}

interface AllData {
  health: SystemHealthData | null;
  stats: DashboardStats | null;
  economics: EconomicsOverview | null;
  sla: SlaData | null;
  businessMetrics: BusinessMetrics | null;
  merchantStatus: MerchantStatusSummary | null;
  aggregator: AggregatorStats | null;
  bbps: BbpsHealth | null;
  jobs: JobData[];
  reconciliation: ReconciliationResult | null;
  fetchedAt: Date;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatRupees(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgoShort(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  } catch {
    return iso;
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'green' | 'amber' | 'red' | 'gray' }) {
  const colorMap = { green: '#10B981', amber: '#F59E0B', red: '#EF4444', gray: '#9CA3AF' };
  return <View style={[s.dot, { backgroundColor: colorMap[status] }]} />;
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function healthToDot(status: string): 'green' | 'amber' | 'red' | 'gray' {
  if (['healthy', 'connected', 'ok', 'active'].includes(status)) return 'green';
  if (['degraded', 'warning', 'idle', 'unknown'].includes(status)) return 'amber';
  if (['unhealthy', 'disconnected', 'breach', 'down', 'failing'].includes(status)) return 'red';
  return 'gray';
}

function SectionHeader({
  icon,
  title,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <View style={s.sectionHeader}>
      <Ionicons name={icon} size={18} color={NAVY} />
      <Text style={s.sectionTitle}>{title}</Text>
      {badge}
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function KPICard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={s.kpiCard}>
      <View style={[s.kpiIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
      {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
  dot,
}: {
  label: string;
  value: string | number;
  dot?: 'green' | 'amber' | 'red' | 'gray';
}) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoRowLeft}>
        {dot && <StatusDot status={dot} />}
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function UnifiedMonitorScreen() {
  const colorScheme = useColorScheme();
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Fetch data in staggered batches to avoid 429 rate limiting ──────────────

  const fetchingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    // Guard against overlapping fetches (interval + pull-to-refresh + app foreground)
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Batch 1: core health & stats (3 calls)
      const [health, stats, economics] = await Promise.allSettled([
        systemService.getHealth(),
        dashboardService.getStats(),
        economicsService.getOverview(),
      ]);

      // Small delay between batches to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));

      // Batch 2: SLA, metrics, merchant status (3 calls)
      const [slaRes, metricsRes, merchantRes] = await Promise.allSettled([
        apiClient.get<SlaData>('admin/system/sla-status'),
        apiClient.get<{ summary: BusinessMetrics['summary']; health: BusinessMetrics['health'] }>(
          'admin/system/metrics/events?days=7'
        ),
        apiClient.get<{ summary: MerchantStatusSummary }>('admin/system/merchant-live-status'),
      ]);

      await new Promise((r) => setTimeout(r, 300));

      // Batch 3: aggregator, bbps, jobs, reconciliation (4 calls)
      const [aggRes, bbpsRes, jobsRes, reconRes] = await Promise.allSettled([
        apiClient.get<{
          platforms: AggregatorStats['platforms'];
          stuckOrders: AggregatorStats['stuckOrders'];
        }>('/admin/aggregator-orders'),
        apiClient.get<BbpsHealth>('/admin/bbps/health'),
        apiClient.get<{ jobs: JobData[] }>('/admin/system/jobs'),
        systemService.getReconciliation(),
      ]);

      // Extract metrics payload — handle both fixed backend (data.summary)
      // and legacy double-nested response (data.data.summary)
      const metricsPayload =
        metricsRes.status === 'fulfilled' ? (metricsRes.value as any)?.data : null;
      const metricsSummary = metricsPayload?.summary ?? metricsPayload?.data?.summary;
      const metricsHealth = metricsPayload?.health ?? metricsPayload?.data?.health;

      // Extract aggregator data — backend sends platformStats/orders, not platforms/stuckOrders
      const aggPayload = aggRes.status === 'fulfilled' ? (aggRes.value as any)?.data : null;

      // Only update fetchedAt if at least one fetch succeeded
      const anySucceeded = [
        health,
        stats,
        economics,
        slaRes,
        metricsRes,
        merchantRes,
        aggRes,
        bbpsRes,
        jobsRes,
        reconRes,
      ].some((r) => r.status === 'fulfilled');

      setData({
        health: health.status === 'fulfilled' ? health.value : null,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        economics: economics.status === 'fulfilled' ? economics.value : null,
        sla:
          slaRes.status === 'fulfilled' && (slaRes.value as any)?.data
            ? (slaRes.value as any).data
            : null,
        businessMetrics:
          metricsSummary || metricsHealth
            ? { summary: metricsSummary, health: metricsHealth }
            : null,
        merchantStatus:
          merchantRes.status === 'fulfilled' && (merchantRes.value as any)?.data?.summary
            ? (merchantRes.value as any).data.summary
            : null,
        aggregator: aggPayload
          ? {
              platforms: aggPayload.platforms || aggPayload.platformStats || [],
              stuckOrders: aggPayload.stuckOrders || [],
            }
          : null,
        bbps:
          bbpsRes.status === 'fulfilled' && (bbpsRes.value as any)?.data
            ? (bbpsRes.value as any).data
            : null,
        jobs:
          jobsRes.status === 'fulfilled'
            ? (jobsRes.value as any)?.data?.jobs || (jobsRes.value as any)?.data?.data || []
            : [],
        reconciliation: reconRes.status === 'fulfilled' ? reconRes.value : null,
        fetchedAt: anySucceeded ? new Date() : (data?.fetchedAt ?? new Date()),
      });
    } catch (err) {
      logger.error('[UnifiedMonitor] fetch error', err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  // ── Auto-refresh with countdown, pauses when app backgrounded ──────────────

  useEffect(() => {
    fetchAll();

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAll();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && appState.current !== 'active') fetchAll();
      appState.current = next;
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [fetchAll]);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color={NAVY} />
        <Text style={s.loadingText}>Loading Command Center...</Text>
      </SafeAreaView>
    );
  }

  const d = data;
  const overallHealth: HealthStatus = d?.health?.overallStatus || 'unknown';
  const slaOverall: SlaStatus = d?.sla?.overallStatus || 'unknown';

  // Compute overall platform status from all signals
  const platformStatus: 'green' | 'amber' | 'red' = (() => {
    if (overallHealth === 'unhealthy' || slaOverall === 'breach') return 'red';
    if (overallHealth === 'degraded' || slaOverall === 'warning' || slaOverall === 'degraded')
      return 'amber';
    if (overallHealth === 'healthy') return 'green';
    return 'amber';
  })();

  const bannerColors = {
    green: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', label: 'All Systems Operational' },
    amber: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: 'Degraded Performance' },
    red: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', label: 'System Issues Detected' },
  }[platformStatus];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAll();
            }}
            tintColor={NAVY}
          />
        }
      >
        {/* ── 1. Overall Health Banner ─────────────────────────────────── */}
        <View
          style={[
            s.banner,
            { backgroundColor: bannerColors.bg, borderLeftColor: bannerColors.border },
          ]}
        >
          <View style={s.bannerRow}>
            <View style={s.bannerLeft}>
              <StatusDot status={platformStatus} />
              <Text style={[s.bannerTitle, { color: bannerColors.text }]}>
                {bannerColors.label}
              </Text>
            </View>
            <Text style={s.bannerTime}>
              {countdown}s · {d?.fetchedAt ? d.fetchedAt.toLocaleTimeString() : '—'}
            </Text>
          </View>
        </View>

        {/* ── 2. KPI Row ──────────────────────────────────────────────── */}
        <View style={s.kpiRow}>
          <KPICard
            label="Orders Today"
            value={d?.stats?.orders.today ?? '—'}
            sub={`${d?.stats?.orders.pendingCount ?? 0} pending`}
            icon="cart"
            color="#3B82F6"
          />
          <KPICard
            label="GMV Today"
            value={d?.stats?.revenue.today != null ? formatRupees(d.stats.revenue.today) : '—'}
            sub={
              d?.stats?.revenue.thisMonth != null
                ? `${formatRupees(d.stats.revenue.thisMonth)} MTD`
                : undefined
            }
            icon="cash"
            color="#10B981"
          />
          <KPICard
            label="Active Users"
            value={d?.stats?.users.active ?? '—'}
            sub={`+${d?.stats?.users.newToday ?? 0} today`}
            icon="people"
            color="#8B5CF6"
          />
          <KPICard
            label="Payment %"
            value={d?.businessMetrics?.health?.paymentSuccessRate ?? '—'}
            icon="card"
            color="#F59E0B"
          />
        </View>

        {/* ── 3. Infrastructure ───────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('infra')}>
            <SectionHeader
              icon="server"
              title="Infrastructure"
              badge={
                <Badge
                  label={overallHealth.toUpperCase()}
                  color={
                    platformStatus === 'green'
                      ? '#065F46'
                      : platformStatus === 'amber'
                        ? '#92400E'
                        : '#991B1B'
                  }
                  bg={bannerColors.bg}
                />
              }
            />
          </TouchableOpacity>
          {!collapsed.infra && d?.health && (
            <View style={s.sectionBody}>
              {/* Server */}
              <Text style={s.subHeading}>Server</Text>
              <InfoRow
                label="CPU"
                value={`${d.health.server.cpuUsagePercent?.toFixed(1) ?? '—'}%`}
                dot={healthToDot(
                  (d.health.server.cpuUsagePercent ?? 0) > 90
                    ? 'unhealthy'
                    : (d.health.server.cpuUsagePercent ?? 0) > 70
                      ? 'degraded'
                      : 'healthy'
                )}
              />
              <InfoRow
                label="Memory (Heap)"
                value={`${d.health.server.memory.heapUsedMB}/${d.health.server.memory.heapTotalMB} MB`}
                dot={healthToDot(
                  d.health.server.memory.heapUsedMB / d.health.server.memory.heapTotalMB > 0.9
                    ? 'unhealthy'
                    : 'healthy'
                )}
              />
              <InfoRow label="RSS" value={`${d.health.server.memory.rssMB} MB`} />
              <InfoRow label="Uptime" value={formatUptime(d.health.server.uptime)} />
              <InfoRow label="Node" value={d.health.server.nodeVersion} />

              {/* Database */}
              <Text style={s.subHeading}>MongoDB</Text>
              <InfoRow
                label="Status"
                value={d.health.database.status}
                dot={healthToDot(d.health.database.status)}
              />
              <InfoRow label="Connections" value={d.health.database.connectionCount} />
              <InfoRow label="Host" value={d.health.database.host} />

              {/* Redis */}
              <Text style={s.subHeading}>Redis</Text>
              <InfoRow
                label="Status"
                value={d.health.redis.status}
                dot={healthToDot(d.health.redis.status)}
              />
              <InfoRow label="Memory" value={d.health.redis.memory ?? '—'} />
              <InfoRow label="Keys" value={d.health.redis.dbSize} />
            </View>
          )}
        </Card>

        {/* ── 4. Queue Health ─────────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('queues')}>
            <SectionHeader
              icon="layers"
              title="Queue Health (BullMQ)"
              badge={
                d?.health?.queues ? (
                  <Badge
                    label={d.health.queues.overall.toUpperCase()}
                    color={d.health.queues.overall === 'healthy' ? '#065F46' : '#92400E'}
                    bg={d.health.queues.overall === 'healthy' ? '#D1FAE5' : '#FEF3C7'}
                  />
                ) : undefined
              }
            />
          </TouchableOpacity>
          {!collapsed.queues && d?.health?.queues?.queues && (
            <View style={s.sectionBody}>
              <View style={s.tableHeader}>
                <Text style={[s.th, { flex: 2 }]}>Queue</Text>
                <Text style={s.th}>Wait</Text>
                <Text style={s.th}>Active</Text>
                <Text style={s.th}>Failed</Text>
                <Text style={[s.th, { flex: 0.5 }]}></Text>
              </View>
              {d.health.queues.queues.map((q: QueueInfo) => (
                <View key={q.name} style={s.tableRow}>
                  <Text style={[s.td, { flex: 2 }]} numberOfLines={1}>
                    {q.name}
                  </Text>
                  <Text style={s.td}>{q.waiting ?? 0}</Text>
                  <Text style={s.td}>{q.active ?? 0}</Text>
                  <Text
                    style={[s.td, (q.failed ?? 0) > 0 && { color: '#EF4444', fontWeight: '600' }]}
                  >
                    {q.failed ?? 0}
                  </Text>
                  <View style={{ flex: 0.5, alignItems: 'center' }}>
                    <StatusDot status={healthToDot(q.status)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── 5. SLA Contracts ────────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('sla')}>
            <SectionHeader
              icon="shield-checkmark"
              title="SLA Contracts"
              badge={
                d?.sla ? (
                  <Badge
                    label={d.sla.overallStatus.toUpperCase()}
                    color={
                      d.sla.overallStatus === 'ok'
                        ? '#065F46'
                        : d.sla.overallStatus === 'warning'
                          ? '#92400E'
                          : '#991B1B'
                    }
                    bg={
                      d.sla.overallStatus === 'ok'
                        ? '#D1FAE5'
                        : d.sla.overallStatus === 'warning'
                          ? '#FEF3C7'
                          : '#FEE2E2'
                    }
                  />
                ) : undefined
              }
            />
          </TouchableOpacity>
          {!collapsed.sla && d?.sla?.metrics && (
            <View style={s.sectionBody}>
              {Object.entries(d.sla.metrics).map(([key, m]) => (
                <View key={key} style={s.slaRow}>
                  <StatusDot status={healthToDot(m.status)} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.slaName}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                    {m.reason && <Text style={s.slaReason}>{m.reason}</Text>}
                  </View>
                  <Badge
                    label={m.status.toUpperCase()}
                    color={
                      m.status === 'ok' ? '#065F46' : m.status === 'warning' ? '#92400E' : '#991B1B'
                    }
                    bg={
                      m.status === 'ok' ? '#D1FAE5' : m.status === 'warning' ? '#FEF3C7' : '#FEE2E2'
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── 6. Cron Jobs ────────────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('jobs')}>
            <SectionHeader
              icon="timer"
              title={`Cron Jobs (${d?.jobs.length ?? 0})`}
              badge={(() => {
                if (!d?.jobs || d.jobs.length === 0)
                  return <Badge label="NO DATA" color="#6B7280" bg="#F3F4F6" />;
                const failing = d.jobs.filter((j) => j.status === 'failing').length;
                if (failing > 0)
                  return <Badge label={`${failing} FAILING`} color="#991B1B" bg="#FEE2E2" />;
                const warn = d.jobs.filter((j) => j.status === 'warning').length;
                if (warn > 0)
                  return <Badge label={`${warn} OVERDUE`} color="#92400E" bg="#FEF3C7" />;
                return <Badge label="ALL OK" color="#065F46" bg="#D1FAE5" />;
              })()}
            />
          </TouchableOpacity>
          {!collapsed.jobs && d?.jobs && d.jobs.length > 0 && (
            <View style={s.sectionBody}>
              {d.jobs.map((j) => (
                <View key={j.name} style={s.jobRow}>
                  <StatusDot status={healthToDot(j.status)} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.jobName} numberOfLines={1}>
                      {j.name}
                    </Text>
                    <Text style={s.jobMeta}>
                      {j.schedule} · Last: {timeAgoShort(j.lastRun)}
                    </Text>
                  </View>
                  {j.consecutiveFailures > 0 && (
                    <Badge label={`${j.consecutiveFailures}x fail`} color="#991B1B" bg="#FEE2E2" />
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── 7. Financial Health ─────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('finance')}>
            <SectionHeader icon="wallet" title="Financial Health" />
          </TouchableOpacity>
          {!collapsed.finance && d?.economics && (
            <View style={s.sectionBody}>
              {d.economics.cashbackToday && (
                <>
                  <Text style={s.subHeading}>Cashback Today</Text>
                  <InfoRow
                    label="Amount"
                    value={formatRupees(d.economics.cashbackToday.totalAmount ?? 0)}
                  />
                  <InfoRow
                    label="Transactions"
                    value={d.economics.cashbackToday.transactionCount ?? 0}
                  />
                  <InfoRow
                    label="Yesterday"
                    value={formatRupees(d.economics.cashbackToday.yesterdayAmount ?? 0)}
                  />
                </>
              )}

              {d.economics.coinIssuance && (
                <>
                  <Text style={s.subHeading}>Coin Issuance</Text>
                  <InfoRow
                    label="Today"
                    value={(d.economics.coinIssuance.todayTotal ?? 0).toLocaleString()}
                  />
                  <InfoRow
                    label="Change"
                    value={`${(d.economics.coinIssuance.changePercent ?? 0) > 0 ? '+' : ''}${(d.economics.coinIssuance.changePercent ?? 0).toFixed(1)}%`}
                    dot={(d.economics.coinIssuance.changePercent ?? 0) > 50 ? 'amber' : 'green'}
                  />
                </>
              )}

              {d.economics.fraudAlerts && (
                <>
                  <Text style={s.subHeading}>Fraud Alerts</Text>
                  <InfoRow
                    label="Active Alerts"
                    value={d.economics.fraudAlerts.alertCount ?? 0}
                    dot={(d.economics.fraudAlerts.alertCount ?? 0) > 0 ? 'red' : 'green'}
                  />
                  <InfoRow
                    label="Threshold"
                    value={`${d.economics.fraudAlerts.threshold ?? '—'} / ${d.economics.fraudAlerts.window ?? '—'}`}
                  />
                </>
              )}

              {d.economics.settlementDue && (
                <>
                  <Text style={s.subHeading}>Settlements Due</Text>
                  <InfoRow
                    label="Merchants"
                    value={d.economics.settlementDue.totalDueMerchants ?? 0}
                  />
                  <InfoRow
                    label="Pending Amount"
                    value={formatRupees(d.economics.settlementDue.totalPendingAmount ?? 0)}
                  />
                </>
              )}

              {d.economics.rewardReversals && (
                <>
                  <Text style={s.subHeading}>Reversals</Text>
                  <InfoRow
                    label="Pending"
                    value={d.economics.rewardReversals.pendingReversals ?? 0}
                    dot={
                      (d.economics.rewardReversals.pendingReversals ?? 0) > 10 ? 'amber' : 'green'
                    }
                  />
                  <InfoRow
                    label="Completed Today"
                    value={`${d.economics.rewardReversals.completedReversalsToday ?? 0} (${formatRupees(d.economics.rewardReversals.completedReversalAmount ?? 0)})`}
                  />
                </>
              )}
            </View>
          )}
        </Card>

        {/* ── 8. Business Metrics (7-day) ─────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('biz')}>
            <SectionHeader icon="bar-chart" title="Business Metrics (7d)" />
          </TouchableOpacity>
          {!collapsed.biz && d?.businessMetrics && (
            <View style={s.sectionBody}>
              {d.businessMetrics.summary && (
                <>
                  <InfoRow label="Bookings" value={d.businessMetrics.summary.totalBookings ?? 0} />
                  <InfoRow label="Orders" value={d.businessMetrics.summary.totalOrders ?? 0} />
                  <InfoRow label="New Users" value={d.businessMetrics.summary.newUsers ?? 0} />
                  <InfoRow
                    label="Coins Earned"
                    value={(d.businessMetrics.summary.coinsEarned ?? 0).toLocaleString()}
                  />
                  <InfoRow
                    label="Coins Redeemed"
                    value={(d.businessMetrics.summary.coinsRedeemed ?? 0).toLocaleString()}
                  />
                  <InfoRow
                    label="BBPS Completed"
                    value={d.businessMetrics.summary.bbpsCompleted ?? 0}
                  />
                </>
              )}
              {d.businessMetrics.health && (
                <>
                  <InfoRow
                    label="Payment Success"
                    value={d.businessMetrics.health.paymentSuccessRate ?? '—'}
                    dot={(() => {
                      const rate = parseFloat(d.businessMetrics.health.paymentSuccessRate);
                      if (isNaN(rate)) return 'amber';
                      return rate >= 95 ? 'green' : rate >= 85 ? 'amber' : 'red';
                    })()}
                  />
                  <InfoRow
                    label="Earn/Redeem Ratio"
                    value={d.businessMetrics.health.coinsEarnedVsRedeemedRatio ?? '—'}
                  />
                </>
              )}
            </View>
          )}
        </Card>

        {/* ── 9. Merchant Status ──────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('merchants')}>
            <SectionHeader icon="storefront" title="Merchant Live Status" />
          </TouchableOpacity>
          {!collapsed.merchants && d?.merchantStatus && (
            <View style={s.sectionBody}>
              <View style={s.merchantStatusRow}>
                <View style={s.merchantStatusCard}>
                  <StatusDot status="green" />
                  <Text style={s.merchantStatusNum}>{d.merchantStatus.totalOnline}</Text>
                  <Text style={s.merchantStatusLabel}>Online</Text>
                </View>
                <View style={s.merchantStatusCard}>
                  <StatusDot status="amber" />
                  <Text style={s.merchantStatusNum}>{d.merchantStatus.totalIdle}</Text>
                  <Text style={s.merchantStatusLabel}>Idle</Text>
                </View>
                <View style={s.merchantStatusCard}>
                  <StatusDot status="red" />
                  <Text style={s.merchantStatusNum}>{d.merchantStatus.totalOffline}</Text>
                  <Text style={s.merchantStatusLabel}>Offline</Text>
                </View>
              </View>
              <InfoRow label="Active Sessions" value={d.merchantStatus.totalActiveSessions} />
              <InfoRow
                label="Pending Orders"
                value={d.merchantStatus.totalPendingOrders}
                dot={d.merchantStatus.totalPendingOrders > 20 ? 'amber' : 'green'}
              />
            </View>
          )}
        </Card>

        {/* ── 10. Aggregator Orders ───────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('agg')}>
            <SectionHeader
              icon="globe"
              title="Aggregator Orders"
              badge={
                d?.aggregator?.stuckOrders && d.aggregator.stuckOrders.length > 0 ? (
                  <Badge
                    label={`${d.aggregator.stuckOrders.length} STUCK`}
                    color="#991B1B"
                    bg="#FEE2E2"
                  />
                ) : !d?.aggregator ? (
                  <Badge label="NO DATA" color="#6B7280" bg="#F3F4F6" />
                ) : undefined
              }
            />
          </TouchableOpacity>
          {!collapsed.agg && d?.aggregator && (
            <View style={s.sectionBody}>
              {d.aggregator.platforms.map((p: any) => (
                <View key={p._id || p.name} style={s.aggRow}>
                  <Text style={s.aggPlatform}>{p._id || p.name}</Text>
                  <Text style={s.aggStat}>{p.count ?? p.todayOrders ?? 0} orders</Text>
                  <Text style={s.aggStat}>{formatRupees(p.revenue ?? 0)}</Text>
                </View>
              ))}
              {d.aggregator.stuckOrders.length > 0 && (
                <>
                  <Text style={[s.subHeading, { color: '#EF4444' }]}>Stuck Orders</Text>
                  {d.aggregator.stuckOrders.map((o: any) => (
                    <InfoRow
                      key={o.id || o._id}
                      label={`${o.platform} · ${o.merchantName}`}
                      value={`${o.minutesStuck}m stuck`}
                      dot="red"
                    />
                  ))}
                </>
              )}
            </View>
          )}
        </Card>

        {/* ── 11. BBPS Provider Health ────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('bbps')}>
            <SectionHeader
              icon="receipt"
              title="BBPS Providers"
              badge={(() => {
                if (!d?.bbps?.billers || d.bbps.billers.length === 0)
                  return <Badge label="NO DATA" color="#6B7280" bg="#F3F4F6" />;
                const down = d.bbps.billers.filter((b) => b.status === 'down').length;
                if (down > 0) return <Badge label={`${down} DOWN`} color="#991B1B" bg="#FEE2E2" />;
                const deg = d.bbps.billers.filter((b) => b.status === 'degraded').length;
                if (deg > 0)
                  return <Badge label={`${deg} DEGRADED`} color="#92400E" bg="#FEF3C7" />;
                return <Badge label="ALL OK" color="#065F46" bg="#D1FAE5" />;
              })()}
            />
          </TouchableOpacity>
          {!collapsed.bbps && d?.bbps?.billers && d.bbps.billers.length > 0 && (
            <View style={s.sectionBody}>
              {d.bbps.billers.map((b) => (
                <InfoRow
                  key={b.name}
                  label={b.name}
                  value={`${b.successRate}%`}
                  dot={healthToDot(b.status)}
                />
              ))}
            </View>
          )}
        </Card>

        {/* ── 12. Reconciliation ──────────────────────────────────────── */}
        <Card>
          <TouchableOpacity onPress={() => toggle('recon')}>
            <SectionHeader
              icon="calculator"
              title="Reconciliation"
              badge={
                d?.reconciliation?.summary ? (
                  d.reconciliation.summary.criticalCount > 0 ? (
                    <Badge
                      label={`${d.reconciliation.summary.criticalCount} CRITICAL`}
                      color="#991B1B"
                      bg="#FEE2E2"
                    />
                  ) : d.reconciliation.summary.totalDiscrepancies > 0 ? (
                    <Badge
                      label={`${d.reconciliation.summary.totalDiscrepancies} issues`}
                      color="#92400E"
                      bg="#FEF3C7"
                    />
                  ) : (
                    <Badge label="CLEAN" color="#065F46" bg="#D1FAE5" />
                  )
                ) : undefined
              }
            />
          </TouchableOpacity>
          {!collapsed.recon && d?.reconciliation && (
            <View style={s.sectionBody}>
              {d.reconciliation.hasResults && d.reconciliation.summary ? (
                <>
                  <InfoRow label="Users Checked" value={d.reconciliation.usersChecked ?? '—'} />
                  <InfoRow
                    label="Discrepancies"
                    value={d.reconciliation.summary.totalDiscrepancies}
                    dot={d.reconciliation.summary.totalDiscrepancies > 0 ? 'amber' : 'green'}
                  />
                  <InfoRow
                    label="Critical"
                    value={d.reconciliation.summary.criticalCount}
                    dot={d.reconciliation.summary.criticalCount > 0 ? 'red' : 'green'}
                  />
                  <InfoRow
                    label="High"
                    value={d.reconciliation.summary.highCount}
                    dot={d.reconciliation.summary.highCount > 0 ? 'amber' : 'green'}
                  />
                  <InfoRow
                    label="Total Difference"
                    value={formatRupees(d.reconciliation.summary.totalDifferenceAmount)}
                  />
                  {d.reconciliation.timestamp && (
                    <InfoRow label="Last Run" value={timeAgoShort(d.reconciliation.timestamp)} />
                  )}
                </>
              ) : (
                <Text style={s.emptyText}>
                  {d.reconciliation.message || 'No reconciliation data available'}
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* ── Platform Summary Row ────────────────────────────────────── */}
        <Card style={{ marginBottom: 40 }}>
          <SectionHeader icon="analytics" title="Platform Summary" />
          <View style={s.sectionBody}>
            <InfoRow label="Total Merchants" value={d?.stats?.merchants.total ?? '—'} />
            <InfoRow label="Active Merchants" value={d?.stats?.merchants.active ?? '—'} />
            <InfoRow label="Total Users" value={d?.stats?.users.total ?? '—'} />
            <InfoRow label="Orders This Month" value={d?.stats?.orders.thisMonth ?? '—'} />
            <InfoRow
              label="Revenue MTD"
              value={
                d?.stats?.revenue.thisMonth != null ? formatRupees(d.stats.revenue.thisMonth) : '—'
              }
            />
            <InfoRow
              label="Platform Fees"
              value={
                d?.stats?.revenue.totalPlatformFees != null
                  ? formatRupees(d.stats.revenue.totalPlatformFees)
                  : '—'
              }
            />
            <InfoRow label="Coins Awarded Today" value={d?.stats?.coins.awardedToday ?? '—'} />
            <InfoRow
              label="Coins Pending Approval"
              value={d?.stats?.coins.pendingApproval ?? '—'}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: { marginTop: 12, color: NAVY, fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Banner
  banner: { borderLeftWidth: 4, borderRadius: 8, padding: 12, marginBottom: 4 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerTime: { fontSize: 11, color: '#64748B' },

  // KPI
  kpiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: NAVY },
  kpiLabel: { fontSize: 11, color: '#64748B', textAlign: 'center' },
  kpiSub: { fontSize: 10, color: '#94A3B8' },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: NAVY },
  sectionBody: { marginTop: 10, gap: 6 },
  subHeading: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 8, marginBottom: 2 },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Dot
  dot: { width: 8, height: 8, borderRadius: 4 },

  // InfoRow
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, color: '#64748B' },
  infoValue: { fontSize: 13, fontWeight: '600', color: NAVY },

  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase' as any,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  td: { flex: 1, fontSize: 12, color: NAVY },

  // SLA
  slaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  slaName: { fontSize: 13, fontWeight: '600', color: NAVY, textTransform: 'capitalize' as any },
  slaReason: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  // Jobs
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  jobName: { fontSize: 13, fontWeight: '600', color: NAVY },
  jobMeta: { fontSize: 11, color: '#94A3B8' },

  // Merchant status
  merchantStatusRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  merchantStatusCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  merchantStatusNum: { fontSize: 22, fontWeight: '800', color: NAVY },
  merchantStatusLabel: { fontSize: 11, color: '#64748B' },

  // Aggregator
  aggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  aggPlatform: { flex: 1, fontSize: 13, fontWeight: '600', color: NAVY },
  aggStat: { fontSize: 11, color: '#64748B' },

  // Empty
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
});
