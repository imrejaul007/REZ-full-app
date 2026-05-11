/**
 * app/(dashboard)/live-monitor.tsx
 *
 * REZ LIVE MONITOR — Nerve Center of the entire platform.
 *
 * Sections:
 *   1. Live Status Bar           — server online, socket connected, countdown, last update
 *   2. KPI Cards                 — orders today, GMV, active users, payment success rate, alerts
 *   3. Server Health             — CPU, memory, uptime, Node version
 *   4. Database & Redis          — MongoDB status/conns/latency, Redis status/keys
 *   5. Live Order Feed           — last 10 orders, socket-pushed or polled every 10s
 *   6. Queue Health (BullMQ)     — waiting/active/completed/failed per queue
 *   7. Cron Jobs                 — name, schedule, last run, status
 *   8. Financial Health          — coins earned/redeemed ratio, reconciliation, cashback holds
 *   9. Error Rate                — from system health data
 *  10. Active Connections        — socket.io clients, fraud alert count
 *
 * Auto-refreshes every 10 seconds with visible countdown.
 * All data fetched in parallel for speed.
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
  Animated,
  Easing,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { systemService, SystemHealthData } from '../../services/api/system';
import { dashboardService, DashboardStats } from '../../services/api/dashboard';
import { economicsService, EconomicsOverview } from '../../services/api/economics';
import { ordersService, Order, OrderStats } from '../../services/api/orders';
import { socketService } from '../../services/socket';
import { apiClient } from '../../services/api/apiClient';
import { useAuth } from '../../contexts/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 10; // seconds
const NAVY = Colors.light.navy;
const BG = Colors.light.background;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LiveOrderItem {
  id: string;
  orderNumber: string;
  amount: number;
  status: string;
  storeName: string;
  createdAt: string;
}

interface AllData {
  health: SystemHealthData | null;
  stats: DashboardStats | null;
  economics: EconomicsOverview | null;
  orderStats: OrderStats | null;
  recentOrders: LiveOrderItem[];
  socketConnected: boolean;
  fetchedAt: Date;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return iso;
  }
}

function formatRupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function statusColor(status: string): string {
  if (['healthy', 'connected', 'active'].includes(status)) return Colors.light.success;
  if (['degraded', 'unknown'].includes(status)) return Colors.light.warning;
  return Colors.light.error;
}

function cpuColor(pct: number): string {
  if (pct < 60) return Colors.light.success;
  if (pct < 80) return Colors.light.warning;
  return Colors.light.error;
}

function memColor(used: number, total: number): string {
  const ratio = total > 0 ? used / total : 0;
  if (ratio < 0.65) return Colors.light.success;
  if (ratio < 0.85) return Colors.light.warning;
  return Colors.light.error;
}

function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    delivered: Colors.light.success,
    confirmed: Colors.light.info,
    preparing: Colors.light.warning,
    ready: Colors.light.cyan,
    dispatched: Colors.light.info,
    placed: Colors.light.purple,
    cancelled: Colors.light.error,
    refunded: Colors.light.orange,
    returned: Colors.light.orange,
  };
  return map[status] ?? Colors.light.muted;
}

function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    dispatched: 'Dispatched',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    returned: 'Returned',
  };
  return map[status] ?? status;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Animated pulsing live dot */
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);
  return (
    <Animated.View
      style={[
        { width: 10, height: 10, borderRadius: 5, backgroundColor: color },
        { transform: [{ scale }] },
      ]}
    />
  );
}

/** Color-coded progress bar */
function ProgressBar({
  value,
  max,
  color,
  height = 6,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: `${color}20`,
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

/** Small status pill badge */
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

/** Section card wrapper */
function SectionCard({
  title,
  icon,
  iconColor,
  headerRight,
  children,
  collapsible = false,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={collapsible ? () => setCollapsed((v) => !v) : undefined}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIconBox, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          {headerRight}
          {collapsible && (
            <Ionicons
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={16}
              color={Colors.light.muted}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </TouchableOpacity>
      {!collapsed && children}
    </View>
  );
}

/** Metric row inside a card */
function MetricRow({
  label,
  value,
  valueColor,
  sublabel,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
  sublabel?: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.metricValue, { color: valueColor ?? Colors.light.text }]}>
          {value}
        </Text>
        {sublabel ? <Text style={styles.metricSublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function LiveMonitorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [data, setData] = useState<AllData>({
    health: null,
    stats: null,
    economics: null,
    orderStats: null,
    recentOrders: [],
    socketConnected: false,
    fetchedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [liveOrderFeed, setLiveOrderFeed] = useState<LiveOrderItem[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef(false);
  // BUG-082: Guard flag so the 10s setInterval can't pile up parallel fetches.
  const isFetchingRef = useRef(false);
  // BUG-026: Track whether the socket connection was permanently lost.
  const [socketConnectionLost, setSocketConnectionLost] = useState(false);

  // Track consecutive failures for backoff
  const failCountRef = useRef(0);
  // Track cycle count for deterministic skip (instead of Math.random)
  const skipCycleCountRef = useRef(0);

  // ── Fetch all data in parallel ──────────────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    // BUG-082: Prevent concurrent fetches when the 10s interval fires while a
    // previous fetch is still in-flight (e.g. slow network or large payload).
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setIsLoading(true);

    try {
      const serviceNames = ['Health', 'Stats', 'Economics', 'OrderStats', 'Orders'];
      const [health, stats, economics, orderStats, ordersResp] = await Promise.allSettled([
        systemService.getHealth(),
        dashboardService.getStats(),
        economicsService.getOverview(),
        ordersService.getStats(),
        ordersService.getOrders(1, 10),
      ]);

      const results = [health, stats, economics, orderStats, ordersResp];
      const failedServices = results
        .map((r, i) => (r.status === 'rejected' ? serviceNames[i] : null))
        .filter(Boolean);

      if (failedServices.length > 0) {
        failCountRef.current += 1;
        logger.warn(`[LiveMonitor] Failed services: ${failedServices.join(', ')}`);
      } else {
        failCountRef.current = 0;
      }

      const healthData = health.status === 'fulfilled' ? health.value : null;
      const statsData = stats.status === 'fulfilled' ? stats.value : null;
      const econData = economics.status === 'fulfilled' ? economics.value : null;
      const orderStatsData = orderStats.status === 'fulfilled' ? orderStats.value : null;
      const ordersData = ordersResp.status === 'fulfilled' ? ordersResp.value : null;

      const recentOrders: LiveOrderItem[] = (ordersData?.orders ?? []).map((o: Order) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        amount: o.totals?.total ?? 0,
        status: o.status,
        storeName: o.store?.name ?? 'Unknown',
        createdAt: o.createdAt,
      }));

      setData({
        health: healthData,
        stats: statsData,
        economics: econData,
        orderStats: orderStatsData,
        recentOrders,
        socketConnected: socketService.isSocketConnected(),
        fetchedAt: new Date(),
      });

      // Seed live feed only on first load
      setLiveOrderFeed((prev) => (prev.length === 0 ? recentOrders : prev));
    } catch (err: any) {
      failCountRef.current += 1;
      if (!silent) showAlert('Error', 'Failed to load live monitor data.');
    } finally {
      if (!silent) setIsLoading(false);
      // BUG-082: Always release the in-progress guard so future fetches are not blocked.
      isFetchingRef.current = false;
    }
  }, []);

  // ── Socket setup for live pushes ────────────────────────────────────────────
  // BUG-080: Only remove event listeners on unmount. Do NOT disconnect the shared
  // socket singleton — doing so would kill it for every other tab/screen.
  useEffect(() => {
    let cleanupListeners: (() => void) | undefined;
    let unsubConnectionLost: (() => void) | undefined;

    const setupSocket = async () => {
      try {
        // BUG-026: Register connection-lost callback before connecting so we
        // capture the reconnect_failed event and can show a persistent banner.
        const unsub = socketService.onConnectionLost(() => {
          setSocketConnectionLost(true);
        });
        if (typeof unsub === 'function') unsubConnectionLost = unsub;

        await socketService.connect();
        socketRef.current = true;

        // Push new orders to live feed (backend emits 'order:created')
        const unsubOrder = socketService.onNewOrder(({ orderId, merchantName, amount }) => {
          setLiveOrderFeed((prev) => [
            {
              id: orderId,
              orderNumber: `#${orderId.slice(-6).toUpperCase()}`,
              amount,
              status: 'placed',
              storeName: merchantName,
              createdAt: new Date().toISOString(),
            },
            ...prev.slice(0, 9),
          ]);
        });

        cleanupListeners = () => {
          unsubOrder();
        };
      } catch {
        // Non-critical — polling will cover it
        socketRef.current = false;
      }
    };

    setupSocket();

    return () => {
      // Remove all event listeners — do NOT disconnect the shared socket singleton.
      if (cleanupListeners) cleanupListeners();
      if (unsubConnectionLost) unsubConnectionLost();
    };
  }, []);

  // ── Auto-refresh every 10 seconds ───────────────────────────────────────────
  // BUG-038 FIX: pause the polling intervals when the app is backgrounded.
  // setInterval continues running in the background on both iOS and Android,
  // wasting battery and network. Subscribe to AppState and clear/restart the
  // intervals when the app moves in/out of the active state.
  // Auth guard: only fetch data when the user is authenticated. Prevents
  // unauthenticated requests from firing before the auth layer confirms session.
  useEffect(() => {
    if (!user) return;
    fetchAll();

    const startIntervals = () => {
      intervalRef.current = setInterval(() => {
        // Backoff: if consecutive failures, skip some cycles to avoid hammering degraded backend
        // Use deterministic cycle counter instead of Math.random() for consistent skipping
        const skipCycles = Math.min(failCountRef.current, 5);
        skipCycleCountRef.current += 1;
        // Skip with probability skipCycles/6 using counter: skip if (cycleCount % 6) < skipCycles
        if (skipCycles > 0 && skipCycleCountRef.current % 6 < skipCycles) return;
        fetchAll(true);
        setCountdown(REFRESH_INTERVAL);
      }, REFRESH_INTERVAL * 1000);

      countdownRef.current = setInterval(() => {
        setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
      }, 1000);
    };

    const stopIntervals = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };

    startIntervals();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Stop any running intervals first to prevent double-fire on rapid transitions
        stopIntervals();
        // Re-fetch immediately when app comes back to foreground, then restart polling
        fetchAll(true);
        setCountdown(REFRESH_INTERVAL);
        startIntervals();
      } else {
        stopIntervals();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopIntervals();
      appStateSub.remove();
    };
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(true);
    setCountdown(REFRESH_INTERVAL);
    setRefreshing(false);
  }, [fetchAll]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const { health, stats, economics, orderStats, recentOrders, socketConnected, fetchedAt } = data;

  const serverOnline = health !== null;
  const overallStatus = health?.overallStatus ?? 'unknown';

  const cpuPct = health?.server?.cpuUsagePercent ?? 0;
  const heapUsed = health?.server?.memory?.heapUsedMB ?? 0;
  const heapTotal = health?.server?.memory?.heapTotalMB ?? 0;
  const rssMB = health?.server?.memory?.rssMB ?? 0;

  const ordersToday = stats?.orders?.today ?? orderStats?.today ?? 0;
  const gmvToday = stats?.revenue?.today ?? 0;
  const fraudAlertCount = economics?.fraudAlerts?.alertCount ?? 0;
  const coinEarned = economics?.coinIssuance?.todayTotal ?? 0;
  const coinRedeemed = economics?.rewardReversals?.completedReversalAmount ?? 0;
  const coinRatio = coinRedeemed > 0 ? (coinEarned / coinRedeemed).toFixed(2) : 'N/A';

  // BUG-019: Use actual success/failure counts; never derive from count/(count+1).
  // Prefer explicit successCount/failureCount fields from health data if available.
  const paymentSuccessCount =
    (health as any)?.payments?.successCount ?? (economics as any)?.payments?.successCount;
  const paymentFailureCount =
    (health as any)?.payments?.failureCount ?? (economics as any)?.payments?.failureCount;
  const paymentSuccessRate: number | null =
    paymentSuccessCount != null && paymentFailureCount != null
      ? paymentSuccessCount + paymentFailureCount > 0
        ? Math.round((paymentSuccessCount / (paymentSuccessCount + paymentFailureCount)) * 100)
        : null
      : orderStats && orderStats.total > 0
        ? Math.round((((orderStats as any).byStatus?.delivered ?? 0) / orderStats.total) * 100)
        : null;
  const paymentSuccessDisplay = paymentSuccessRate !== null ? `${paymentSuccessRate}%` : 'N/A';

  const queues = health?.queues?.queues ?? [];
  const jobs = health?.jobs ?? [];

  const totalFailed = queues.reduce((sum, q) => sum + (q.failed ?? 0), 0);

  const activeAlerts = fraudAlertCount + (totalFailed > 0 ? 1 : 0);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: NAVY }]} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.loadingOuter}>
          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color={NAVY} />
            <Text style={styles.loadingText}>Loading Live Monitor...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: NAVY }]} edges={['top']}>
      <StatusBar style="light" />

      {/* BUG-026: Connection-lost banner shown when socket exhausts all reconnects */}
      {socketConnectionLost && (
        <View
          style={{
            backgroundColor: Colors.light.error,
            paddingVertical: 6,
            paddingHorizontal: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
            Connection lost — real-time updates unavailable. Pull to refresh.
          </Text>
        </View>
      )}

      {/* ── Top Status Bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.card} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>LIVE MONITOR</Text>
          <Text style={styles.topBarSub}>
            {fetchedAt.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.topBarRight}>
          {/* Server status */}
          <View style={styles.statusPill}>
            <PulseDot color={serverOnline ? Colors.light.success : Colors.light.error} />
            <Text
              style={[
                styles.statusPillText,
                { color: serverOnline ? Colors.light.success : Colors.light.error },
              ]}
            >
              {serverOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          {/* Socket status */}
          <View style={[styles.statusPill, { marginLeft: 6 }]}>
            <PulseDot color={socketConnected ? '#06B6D4' : Colors.light.warning} />
            <Text
              style={[
                styles.statusPillText,
                { color: socketConnected ? '#06B6D4' : Colors.light.warning },
              ]}
            >
              {socketConnected ? 'Socket' : 'No WS'}
            </Text>
          </View>

          {/* Countdown */}
          <View
            style={[
              styles.statusPill,
              { marginLeft: 6, backgroundColor: 'rgba(255,255,255,0.12)' },
            ]}
          >
            <Ionicons name="refresh" size={11} color={Colors.light.card} />
            <Text style={[styles.statusPillText, { color: '#fff' }]}>{countdown}s</Text>
          </View>
        </View>
      </View>

      {/* ── Overall Health Banner ───────────────────────────────────────────── */}
      <View
        style={[
          styles.healthBanner,
          {
            backgroundColor:
              overallStatus === 'healthy'
                ? Colors.light.successLight2
                : overallStatus === 'degraded'
                  ? Colors.light.warningLight
                  : Colors.light.errorLight,
          },
        ]}
      >
        <Ionicons
          name={
            overallStatus === 'healthy'
              ? 'shield-checkmark'
              : overallStatus === 'degraded'
                ? 'warning'
                : 'alert-circle'
          }
          size={14}
          color={
            overallStatus === 'healthy'
              ? Colors.light.greenDark
              : overallStatus === 'degraded'
                ? Colors.light.warningDark
                : Colors.light.errorDark
          }
        />
        <Text
          style={[
            styles.healthBannerText,
            {
              color:
                overallStatus === 'healthy'
                  ? Colors.light.greenDark
                  : overallStatus === 'degraded'
                    ? Colors.light.warningDark
                    : Colors.light.errorDark,
            },
          ]}
        >
          Platform is{' '}
          <Text style={{ fontWeight: '700', textTransform: 'uppercase' }}>
            {overallStatus === 'healthy'
              ? 'FULLY OPERATIONAL'
              : overallStatus === 'degraded'
                ? 'DEGRADED'
                : 'UNHEALTHY'}
          </Text>
          {totalFailed > 0 && `  •  ${totalFailed} queue failure${totalFailed > 1 ? 's' : ''}`}
          {fraudAlertCount > 0 &&
            `  •  ${fraudAlertCount} fraud alert${fraudAlertCount > 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: BG }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── SECTION 2: KPI Cards ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>KEY PERFORMANCE INDICATORS</Text>
        <View style={styles.kpiGrid}>
          <KPICard
            label="Orders Today"
            value={ordersToday.toLocaleString()}
            icon="receipt-outline"
            iconColor={Colors.light.warning}
            bg={Colors.light.card}
          />
          <KPICard
            label="GMV Today"
            value={formatRupees(gmvToday)}
            icon="wallet-outline"
            iconColor={Colors.light.success}
            bg={Colors.light.card}
            sub={socketConnected ? 'Live' : 'Polled'}
            subColor={socketConnected ? Colors.light.success : Colors.light.muted}
          />
          <KPICard
            label="Active Users"
            value={stats?.users?.active?.toLocaleString() ?? '—'}
            icon="people-outline"
            iconColor={Colors.light.cyan}
            bg={Colors.light.card}
          />
          <KPICard
            label="Pay Success"
            value={paymentSuccessDisplay}
            icon="card-outline"
            iconColor={
              paymentSuccessRate === null
                ? Colors.light.muted
                : paymentSuccessRate >= 95
                  ? Colors.light.success
                  : paymentSuccessRate >= 85
                    ? Colors.light.warning
                    : Colors.light.error
            }
            bg={Colors.light.card}
            sub={
              paymentSuccessRate === null
                ? 'No data'
                : paymentSuccessRate >= 95
                  ? 'Excellent'
                  : paymentSuccessRate >= 85
                    ? 'Needs attention'
                    : 'CRITICAL'
            }
            subColor={
              paymentSuccessRate === null
                ? Colors.light.muted
                : paymentSuccessRate >= 95
                  ? Colors.light.success
                  : paymentSuccessRate >= 85
                    ? Colors.light.warning
                    : Colors.light.error
            }
          />
          <KPICard
            label="Active Alerts"
            value={activeAlerts}
            icon={activeAlerts > 0 ? 'alert-circle' : 'checkmark-circle-outline'}
            iconColor={
              activeAlerts > 5
                ? Colors.light.error
                : activeAlerts > 0
                  ? Colors.light.warning
                  : Colors.light.success
            }
            bg={Colors.light.card}
            sub={activeAlerts === 0 ? 'All clear' : undefined}
            subColor={Colors.light.success}
          />
          <KPICard
            label="Fraud Flags"
            value={fraudAlertCount}
            icon="shield-outline"
            iconColor={fraudAlertCount > 0 ? Colors.light.error : Colors.light.success}
            bg={Colors.light.card}
          />
        </View>

        {/* ── SECTION 3: Server Health ──────────────────────────────────────── */}
        <SectionCard
          title="Server Health"
          icon="server-outline"
          iconColor={Colors.light.info}
          collapsible
          headerRight={
            health ? (
              <Pill
                label={overallStatus.toUpperCase()}
                color={statusColor(overallStatus)}
                bg={`${statusColor(overallStatus)}20`}
              />
            ) : null
          }
        >
          {health ? (
            <>
              {/* CPU */}
              <View style={styles.metricBlock}>
                <View style={styles.metricRowInline}>
                  <Text style={styles.metricLabel}>CPU Usage</Text>
                  <Text style={[styles.metricValueInline, { color: cpuColor(cpuPct) }]}>
                    {cpuPct}%
                  </Text>
                </View>
                <ProgressBar value={cpuPct} max={100} color={cpuColor(cpuPct)} height={8} />
                <Text style={styles.metricCaption}>
                  {health?.server?.cpuCores ?? '—'} cores · {health?.server?.platform ?? '—'}
                </Text>
              </View>

              {/* Memory */}
              <View style={styles.metricBlock}>
                <View style={styles.metricRowInline}>
                  <Text style={styles.metricLabel}>Heap Memory</Text>
                  <Text
                    style={[styles.metricValueInline, { color: memColor(heapUsed, heapTotal) }]}
                  >
                    {formatBytes(heapUsed)} / {formatBytes(heapTotal)}
                  </Text>
                </View>
                <ProgressBar
                  value={heapUsed}
                  max={heapTotal}
                  color={memColor(heapUsed, heapTotal)}
                  height={8}
                />
                <Text style={styles.metricCaption}>
                  RSS: {formatBytes(rssMB)} · System: {health.server.freeMemoryGB}GB free /{' '}
                  {health.server.totalMemoryGB}GB
                </Text>
              </View>

              <MetricRow label="Uptime" value={formatUptime(health.server.uptime)} />
              <MetricRow label="Node.js" value={health.server.nodeVersion} />
              <MetricRow label="PID" value={health.server.pid} />
            </>
          ) : (
            <Text style={styles.naText}>Server data unavailable</Text>
          )}
        </SectionCard>

        {/* ── SECTION 3b: Database & Redis ─────────────────────────────────── */}
        <SectionCard
          title="Database & Redis"
          icon="layers-outline"
          iconColor={Colors.light.success}
          collapsible
          headerRight={
            health ? (
              <Pill
                label={health.database.status.toUpperCase()}
                color={statusColor(health.database.status)}
                bg={`${statusColor(health.database.status)}20`}
              />
            ) : null
          }
        >
          {health ? (
            <>
              {/* MongoDB */}
              <View style={styles.subSection}>
                <View style={styles.subSectionHeader}>
                  <Ionicons name="server" size={13} color={Colors.light.success} />
                  <Text style={styles.subSectionTitle}>MongoDB</Text>
                  <View
                    style={[styles.dot, { backgroundColor: statusColor(health.database.status) }]}
                  />
                </View>
                <MetricRow
                  label="Status"
                  value={health.database.status}
                  valueColor={statusColor(health.database.status)}
                />
                <MetricRow label="Connections" value={health.database.connectionCount} />
                <MetricRow label="Database" value={health.database.name} />
                <MetricRow label="Host" value={health.database.host} />
              </View>

              {/* Redis */}
              <View
                style={[
                  styles.subSection,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: Colors.light.border,
                    marginTop: 8,
                    paddingTop: 8,
                  },
                ]}
              >
                <View style={styles.subSectionHeader}>
                  <Ionicons name="flash" size={13} color={Colors.light.error} />
                  <Text style={styles.subSectionTitle}>Redis</Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: !health.redis.enabled
                          ? Colors.light.muted
                          : statusColor(health.redis.status),
                      },
                    ]}
                  />
                </View>
                <MetricRow
                  label="Status"
                  value={health.redis.enabled ? health.redis.status : 'Disabled'}
                  valueColor={
                    health.redis.enabled ? statusColor(health.redis.status) : Colors.light.muted
                  }
                />
                {health.redis.memory && <MetricRow label="Memory" value={health.redis.memory} />}
                <MetricRow label="Keys (DB Size)" value={health.redis.dbSize} />
              </View>
            </>
          ) : (
            <Text style={styles.naText}>Database data unavailable</Text>
          )}
        </SectionCard>

        {/* ── SECTION 4: Live Order Feed ────────────────────────────────────── */}
        <SectionCard
          title="Live Order Feed"
          icon="pulse-outline"
          iconColor={Colors.light.orange}
          collapsible
          headerRight={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PulseDot color={socketConnected ? Colors.light.success : Colors.light.warning} />
              <Text style={{ fontSize: 11, color: Colors.light.muted, fontWeight: '500' }}>
                {socketConnected ? 'Live' : 'Polled'}
              </Text>
            </View>
          }
        >
          {liveOrderFeed.length > 0 ? (
            <>
              {/* Table header */}
              <View style={[styles.tableHead, { borderBottomColor: Colors.light.border }]}>
                <Text style={[styles.tableHeadCell, { flex: 2 }]}>Order</Text>
                <Text style={[styles.tableHeadCell, { flex: 2 }]}>Store</Text>
                <Text style={[styles.tableHeadCell, { flex: 1.2, textAlign: 'right' }]}>
                  Amount
                </Text>
                <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'center' }]}>
                  Status
                </Text>
                <Text style={[styles.tableHeadCell, { flex: 1.2, textAlign: 'right' }]}>Time</Text>
              </View>
              {liveOrderFeed.slice(0, 10).map((order, idx) => (
                <View
                  key={`${order.id}-${idx}`}
                  style={[
                    styles.tableRow,
                    idx < liveOrderFeed.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: Colors.light.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 2, color: Colors.light.navy, fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {order.orderNumber}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {order.storeName}
                  </Text>
                  <Text
                    style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '600' }]}
                  >
                    {formatRupees(order.amount)}
                  </Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <Pill
                      label={orderStatusLabel(order.status)}
                      color={orderStatusColor(order.status)}
                      bg={`${orderStatusColor(order.status)}18`}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1.2, textAlign: 'right', color: Colors.light.muted },
                    ]}
                  >
                    {timeAgo(order.createdAt)}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.naText}>No orders to display</Text>
          )}
        </SectionCard>

        {/* ── SECTION 5: Queue Health ───────────────────────────────────────── */}
        <SectionCard
          title="Queue Health (BullMQ)"
          icon="list-outline"
          iconColor={Colors.light.purple}
          collapsible
          headerRight={
            health?.queues ? (
              <Pill
                label={health.queues.overall.toUpperCase()}
                color={statusColor(health.queues.overall)}
                bg={`${statusColor(health.queues.overall)}20`}
              />
            ) : null
          }
        >
          {queues.length > 0 ? (
            <>
              <View style={[styles.tableHead, { borderBottomColor: Colors.light.border }]}>
                <Text style={[styles.tableHeadCell, { flex: 2.5 }]}>Queue</Text>
                <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Wait</Text>
                <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Active</Text>
                <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Done</Text>
                <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Fail</Text>
              </View>
              {queues.map((q, idx) => {
                const hasFailed = (q.failed ?? 0) > 0;
                return (
                  <View
                    key={q.name}
                    style={[
                      styles.tableRow,
                      hasFailed && { backgroundColor: `${Colors.light.error}08` },
                      idx < queues.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: Colors.light.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      {hasFailed && (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: Colors.light.error, flexShrink: 0 },
                          ]}
                        />
                      )}
                      <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                        {q.name}
                      </Text>
                    </View>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {q.status === 'disabled' ? '—' : (q.waiting ?? 0)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {q.status === 'disabled' ? '—' : (q.active ?? 0)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1, textAlign: 'center', color: Colors.light.success },
                      ]}
                    >
                      {q.status === 'disabled' ? '—' : (q.completed ?? 0)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1, textAlign: 'center', fontWeight: hasFailed ? '700' : '400' },
                        hasFailed && { color: Colors.light.error },
                      ]}
                    >
                      {q.status === 'disabled' ? '—' : (q.failed ?? 0)}
                    </Text>
                  </View>
                );
              })}
            </>
          ) : (
            <Text style={styles.naText}>Queue data unavailable</Text>
          )}
        </SectionCard>

        {/* ── SECTION 6: Cron Jobs ──────────────────────────────────────────── */}
        <SectionCard
          title="Scheduled Cron Jobs"
          icon="time-outline"
          iconColor={Colors.light.warning}
          collapsible
        >
          {jobs.length > 0 ? (
            jobs.map((job, idx) => (
              <View
                key={job.name}
                style={[
                  styles.jobRow,
                  idx < jobs.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: Colors.light.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.jobNameRow}>
                    <Text style={styles.jobName} numberOfLines={1}>
                      {job.name}
                    </Text>
                    <Pill
                      label={job.status.toUpperCase()}
                      color={job.status === 'active' ? Colors.light.greenDark : Colors.light.muted}
                      bg={
                        job.status === 'active' ? Colors.light.successLight2 : Colors.light.gray100
                      }
                    />
                  </View>
                  <Text style={styles.jobDesc} numberOfLines={1}>
                    {job.description}
                  </Text>
                  <View style={styles.jobMeta}>
                    <Text style={styles.jobMetaItem}>
                      <Ionicons name="repeat" size={11} color={Colors.light.muted} />{' '}
                      {job.scheduleHuman}
                    </Text>
                    <Text style={styles.jobMetaItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={11}
                        color={job.lastRun ? Colors.light.success : Colors.light.muted}
                      />{' '}
                      {job.lastRun ? timeAgo(job.lastRun) : 'Never ran'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.naText}>No scheduled jobs data</Text>
          )}
        </SectionCard>

        {/* ── SECTION 7: Financial Health ───────────────────────────────────── */}
        <SectionCard
          title="Financial Health"
          icon="cash-outline"
          iconColor={Colors.light.success}
          collapsible
        >
          {economics ? (
            <>
              {/* Coins Earned vs Redeemed */}
              <View style={styles.metricBlock}>
                <View style={styles.metricRowInline}>
                  <Text style={styles.metricLabel}>Coins Earned Today</Text>
                  <Text style={[styles.metricValueInline, { color: Colors.light.warning }]}>
                    {economics.coinIssuance.todayTotal.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metricRowInline}>
                  <Text style={styles.metricLabel}>Coin Hourly Rate</Text>
                  <Text style={styles.metricValueInline}>
                    {economics.coinIssuance.hourlyRate.toFixed(1)}/hr
                  </Text>
                </View>
                <View style={styles.metricRowInline}>
                  <Text style={styles.metricLabel}>Earned vs Redeemed</Text>
                  <Text
                    style={[
                      styles.metricValueInline,
                      {
                        color:
                          coinRatio === 'N/A'
                            ? Colors.light.muted
                            : parseFloat(coinRatio) <= 1.2
                              ? Colors.light.success
                              : parseFloat(coinRatio) <= 1.5
                                ? Colors.light.warning
                                : Colors.light.error,
                      },
                    ]}
                  >
                    {coinRatio}x
                  </Text>
                </View>
                <Text style={styles.metricCaption}>Ratio &lt; 1.2 is sustainable</Text>
              </View>

              {/* Cashback */}
              <View
                style={[
                  styles.subSection,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: Colors.light.border,
                    marginTop: 8,
                    paddingTop: 8,
                  },
                ]}
              >
                <Text style={styles.subSectionTitle}>Cashback</Text>
                <MetricRow
                  label="Total Today"
                  value={formatRupees(economics.cashbackToday.totalAmount)}
                  valueColor={Colors.light.success}
                />
                <MetricRow
                  label="Transactions Today"
                  value={economics.cashbackToday.transactionCount}
                />
                <MetricRow
                  label="Yesterday Total"
                  value={formatRupees(economics.cashbackToday.yesterdayAmount)}
                  valueColor={Colors.light.muted}
                />
              </View>

              {/* Merchant Liability */}
              <View
                style={[
                  styles.subSection,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: Colors.light.border,
                    marginTop: 8,
                    paddingTop: 8,
                  },
                ]}
              >
                <Text style={styles.subSectionTitle}>Merchant Liability</Text>
                <MetricRow
                  label="Total Pending"
                  value={formatRupees(economics.merchantLiability.totalPending)}
                />
                <MetricRow
                  label="Pending Settlement Count"
                  value={economics.merchantLiability.pendingSettlementCount}
                />
                <MetricRow
                  label="Disputed Count"
                  value={economics.merchantLiability.disputedCount}
                  valueColor={
                    economics.merchantLiability.disputedCount > 0 ? Colors.light.error : undefined
                  }
                />
              </View>

              {/* Pending Reversals */}
              <View
                style={[
                  styles.subSection,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: Colors.light.border,
                    marginTop: 8,
                    paddingTop: 8,
                  },
                ]}
              >
                <Text style={styles.subSectionTitle}>Reward Reversals</Text>
                <MetricRow
                  label="Pending Reversals"
                  value={economics.rewardReversals.pendingReversals}
                  valueColor={
                    economics.rewardReversals.pendingReversals > 10
                      ? Colors.light.error
                      : economics.rewardReversals.pendingReversals > 0
                        ? Colors.light.warning
                        : Colors.light.success
                  }
                />
                <MetricRow
                  label="Completed Today"
                  value={economics.rewardReversals.completedReversalsToday}
                />
                {economics.rewardReversals.oldestPendingAge !== null && (
                  <MetricRow
                    label="Oldest Pending Age"
                    value={`${economics.rewardReversals.oldestPendingAge}h`}
                    valueColor={
                      economics.rewardReversals.oldestPendingAge > 48
                        ? Colors.light.error
                        : Colors.light.warning
                    }
                  />
                )}
              </View>
            </>
          ) : (
            <Text style={styles.naText}>Economics data unavailable</Text>
          )}
        </SectionCard>

        {/* ── SECTION 8: Error Rate ─────────────────────────────────────────── */}
        <SectionCard
          title="Error Rate & Alerts"
          icon="bug-outline"
          iconColor={Colors.light.error}
          collapsible
        >
          <View style={styles.errorRateGrid}>
            <ErrorRateCard label="Queue Failures" count={totalFailed} />
            <ErrorRateCard label="Fraud Flags" count={fraudAlertCount} />
            <ErrorRateCard
              label="Pending Reversals"
              count={economics?.rewardReversals?.pendingReversals ?? 0}
            />
            <ErrorRateCard
              label="Disputed Settlements"
              count={economics?.merchantLiability?.disputedCount ?? 0}
            />
          </View>

          {/* Fraud Top Users */}
          {(economics?.fraudAlerts?.topFlaggedUsers ?? []).length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.subSectionTitle}>Top Fraud-Flagged Users</Text>
              {(economics?.fraudAlerts?.topFlaggedUsers ?? []).slice(0, 5).map((user) => (
                <View key={user.userId} style={styles.metricRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>{user.userName}</Text>
                    <Text style={styles.metricCaption}>{user.transactionCount} transactions</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.light.error }]}>
                    {formatRupees(user.totalEarned)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        {/* ── SECTION 9: Active Connections ────────────────────────────────── */}
        <SectionCard
          title="Active Connections"
          icon="wifi-outline"
          iconColor={Colors.light.cyan}
          collapsible
        >
          <View style={styles.connGrid}>
            <ConnCard
              label="Socket.IO"
              value={socketConnected ? 'Connected' : 'Disconnected'}
              icon="radio-button-on"
              color={socketConnected ? Colors.light.success : Colors.light.error}
            />
            <ConnCard
              label="MongoDB"
              value={
                health?.database?.connectionCount ? `${health.database.connectionCount} conns` : '—'
              }
              icon="layers"
              color={
                health?.database?.status === 'connected' ? Colors.light.success : Colors.light.error
              }
            />
            <ConnCard
              label="Redis"
              value={
                !health?.redis?.enabled
                  ? 'Disabled'
                  : health?.redis?.status === 'connected'
                    ? `${health.redis.dbSize} keys`
                    : 'Disconnected'
              }
              icon="flash"
              color={
                !health?.redis?.enabled
                  ? Colors.light.muted
                  : health?.redis?.status === 'connected'
                    ? Colors.light.success
                    : Colors.light.error
              }
            />
            <ConnCard
              label="API Health"
              value={serverOnline ? 'Operational' : 'Down'}
              icon="cloud"
              color={serverOnline ? Colors.light.success : Colors.light.error}
            />
          </View>
        </SectionCard>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Ionicons name="refresh-circle" size={16} color={Colors.light.muted} />
          <Text style={styles.footerText}>
            Auto-refreshes every {REFRESH_INTERVAL}s · Next in {countdown}s
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  icon,
  iconColor,
  bg,
  sub,
  subColor,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: bg }]}>
      <View style={[styles.kpiIconBox, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && <Text style={[styles.kpiSub, { color: subColor ?? Colors.light.muted }]}>{sub}</Text>}
    </View>
  );
}

// ─── Error Rate Card ───────────────────────────────────────────────────────────

function ErrorRateCard({ label, count }: { label: string; count: number }) {
  const color =
    count === 0 ? Colors.light.success : count <= 5 ? Colors.light.warning : Colors.light.error;
  const bg = `${color}15`;
  return (
    <View style={[styles.errorRateCard, { backgroundColor: bg }]}>
      <Text style={[styles.errorRateCount, { color }]}>{count}</Text>
      <Text style={styles.errorRateLabel}>{label}</Text>
    </View>
  );
}

// ─── Connection Card ───────────────────────────────────────────────────────────

function ConnCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={[styles.connCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.connLabel}>{label}</Text>
      <Text style={[styles.connValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // Loading
  loadingOuter: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingInner: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '500',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: NAVY,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  topBarCenter: {
    flex: 1,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topBarSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Health banner
  healthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
  },
  healthBannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.light.muted,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },
  kpiCard: {
    width: '30.5%',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'flex-start',
    gap: 3,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
    lineHeight: 24,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.muted,
    lineHeight: 14,
  },
  kpiSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  // Card
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Pill
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Metric rows
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  metricSublabel: {
    fontSize: 10,
    color: Colors.light.muted,
    marginTop: 1,
  },
  metricBlock: {
    marginBottom: 10,
  },
  metricRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValueInline: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  metricCaption: {
    fontSize: 11,
    color: Colors.light.muted,
    marginTop: 3,
  },

  // Sub-section
  subSection: {},
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // N/A state
  naText: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Table
  tableHead: {
    flexDirection: 'row',
    paddingBottom: 7,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  tableHeadCell: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: Colors.light.muted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 12,
    color: Colors.light.text,
  },

  // Job rows
  jobRow: {
    paddingVertical: 10,
  },
  jobNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  jobName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  jobDesc: {
    fontSize: 11,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  jobMetaItem: {
    fontSize: 11,
    color: Colors.light.muted,
  },

  // Error rate grid
  errorRateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorRateCard: {
    flex: 1,
    minWidth: '40%',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  errorRateCount: {
    fontSize: 26,
    fontWeight: '800',
  },
  errorRateLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.muted,
    textAlign: 'center',
  },

  // Connection grid
  connGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connCard: {
    flex: 1,
    minWidth: '44%',
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.light.slate,
    gap: 3,
  },
  connLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.muted,
    marginTop: 4,
  },
  connValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 11,
    color: Colors.light.muted,
    fontWeight: '500',
  },
});
