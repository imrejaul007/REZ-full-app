import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert, showConfirm } from '../../utils/alert';
import { apiClient } from '../../services/api/apiClient';
import { socketService } from '../../services/socket';

type JobStatus = 'healthy' | 'warning' | 'failing' | 'unknown';

interface Job {
  name: string;
  schedule: string;
  category: string;
  expectedIntervalMin: number;
  lastRun: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  status: JobStatus;
}

const STATUS_CONFIG: Record<JobStatus, { color: string; icon: string; label: string }> = {
  healthy: { color: '#22C55E', icon: 'checkmark-circle', label: 'Healthy' },
  warning: { color: '#F59E0B', icon: 'warning', label: 'Overdue' },
  failing: { color: '#EF4444', icon: 'close-circle', label: 'Failing' },
  unknown: { color: '#9CA3AF', icon: 'help-circle', label: 'No data' },
};

const CATEGORY_COLORS: Record<string, string> = {
  financial: '#7C3AED',
  bookings: '#2563EB',
  coins: '#D97706',
  marketing: '#059669',
  security: '#DC2626',
  operations: '#0891B2',
  gamification: '#7C3AED',
  billing: '#9333EA',
};

export default function JobMonitorScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [realtimeAlert, setRealtimeAlert] = useState<{ name: string; error: string } | null>(null);
  // PRIYA: Track triggering job to prevent double-tap
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = (await apiClient.get('/admin/system/jobs')) as any;
      setJobs(res?.data?.data || res?.data?.jobs || []);
    } catch (e) {
      logger.error('[JobMonitor] fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);

    const unsubscribe = socketService.onJobFailure((data) => {
      setRealtimeAlert({ name: data.name, error: data.error });
      setJobs((prev) =>
        prev.map((j) =>
          j.name === data.name
            ? {
                ...j,
                consecutiveFailures: data.consecutiveFailures,
                status: 'failing',
                lastError: data.error,
              }
            : j
        )
      );
      setTimeout(() => setRealtimeAlert(null), 5000);
    });

    return () => {
      clearInterval(interval);
      unsubscribe?.();
    };
  }, [fetchJobs]);

  const categories = [...new Set(jobs.map((j) => j.category))];
  const filtered = selectedCategory ? jobs.filter((j) => j.category === selectedCategory) : jobs;

  const failingCount = jobs.filter((j) => j.status === 'failing').length;
  const warningCount = jobs.filter((j) => j.status === 'warning').length;

  const handleRunNow = async (job: Job) => {
    // PRIYA: Destructive action confirmation for manual job trigger
    const confirmed = await showConfirm(
      'Trigger Job',
      `Manually trigger "${job.name}" now? This executes background logic immediately.`
    );
    if (!confirmed) return;

    // PRIYA: Set loading state to prevent double-tap during API call
    setTriggeringJob(job.name);
    try {
      const response = await apiClient.post(
        `/admin/system/jobs/trigger`,
        { jobName: job.name },
        {
          // PRIYA: Add API version header for contract drift detection
          headers: { 'X-App-Version': '1.0.0' },
        }
      );

      // PRIYA: Handle 401 - session expired during job trigger
      if (response?.success) {
        showAlert('Success', `"${job.name}" triggered successfully`);
      } else if (
        response?.message?.includes('401') ||
        response?.message?.includes('Unauthorized')
      ) {
        showAlert('Session Expired', 'Your admin session has expired. Please log in again.');
      } else {
        showAlert('Error', response?.message || 'Could not trigger job');
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'Could not trigger job');
    } finally {
      // PRIYA: Clear loading state after operation
      setTriggeringJob(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: '#22C55E' }]}>
          <Text style={styles.summaryNum}>{jobs.filter((j) => j.status === 'healthy').length}</Text>
          <Text style={styles.summaryLabel}>Healthy</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: '#F59E0B' }]}>
          <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{warningCount}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: '#EF4444' }]}>
          <Text style={[styles.summaryNum, { color: '#EF4444' }]}>{failingCount}</Text>
          <Text style={styles.summaryLabel}>Failing</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: '#9CA3AF' }]}>
          <Text style={styles.summaryNum}>{jobs.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Real-time alert banner */}
      {realtimeAlert && (
        <View style={styles.realtimeBanner}>
          <Ionicons name="warning" size={16} color="#fff" />
          <Text style={styles.realtimeBannerText} numberOfLines={1}>
            Job Failed: {realtimeAlert.name} — {realtimeAlert.error}
          </Text>
        </View>
      )}

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
            All ({jobs.length})
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
              { borderColor: CATEGORY_COLORS[cat] || '#ccc' },
            ]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {cat} ({jobs.filter((j) => j.category === cat).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchJobs();
            }}
          />
        }
      >
        {filtered.map((job) => {
          const config = STATUS_CONFIG[job.status];
          const isExpanded = expandedJob === job.name;
          const lastRunAgo = job.lastRun
            ? `${Math.round((Date.now() - new Date(job.lastRun).getTime()) / 60000)} min ago`
            : 'Never';

          return (
            <TouchableOpacity
              key={job.name}
              style={[styles.jobCard, job.status === 'failing' && styles.jobCardFailing]}
              onPress={() => setExpandedJob(isExpanded ? null : job.name)}
            >
              <View style={styles.jobHeader}>
                <Ionicons name={config.icon as any} size={20} color={config.color} />
                <View style={styles.jobInfo}>
                  <Text style={styles.jobName}>{job.name}</Text>
                  <Text style={styles.jobMeta}>
                    {job.schedule} · Last: {lastRunAgo}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.jobDetail}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: CATEGORY_COLORS[job.category] || '#666' },
                      ]}
                    >
                      {job.category}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Consecutive Failures</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        job.consecutiveFailures > 0 && { color: '#EF4444' },
                      ]}
                    >
                      {job.consecutiveFailures}
                    </Text>
                  </View>
                  {job.lastError && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorLabel}>Last Error:</Text>
                      <Text style={styles.errorText}>{job.lastError}</Text>
                    </View>
                  )}
                  {/* PRIYA: Disable button during API call to prevent double-trigger */}
                  <TouchableOpacity
                    style={[styles.runBtn, triggeringJob === job.name && styles.runBtnDisabled]}
                    onPress={() => handleRunNow(job)}
                    disabled={triggeringJob === job.name}
                  >
                    {triggeringJob === job.name ? (
                      <ActivityIndicator size="small" color="#1a3a52" />
                    ) : (
                      <>
                        <Ionicons name="play-circle-outline" size={16} color="#1a3a52" />
                        <Text style={styles.runBtnText}>Run Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8, padding: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 20, fontWeight: '800', color: '#1a3a52' },
  summaryLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  realtimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  realtimeBannerText: { color: '#fff', fontWeight: '600', flex: 1, fontSize: 13 },
  filterRow: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#1a3a52', borderColor: '#1a3a52' },
  filterChipText: { fontSize: 12, color: '#374151' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobCardFailing: { borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 14, fontWeight: '600', color: '#1a3a52' },
  jobMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  jobDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 12, color: '#6B7280' },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#1a3a52' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginTop: 8 },
  errorLabel: { fontSize: 11, fontWeight: '700', color: '#DC2626', marginBottom: 4 },
  errorText: { fontSize: 12, color: '#7F1D1D' },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#EEF2F7',
    borderRadius: 8,
    padding: 8,
    alignSelf: 'flex-start',
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnText: { fontSize: 13, color: '#1a3a52', fontWeight: '600' },
});
