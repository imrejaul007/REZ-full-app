import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert, showConfirm } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/apiClient';

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  // FIX-BUG-HIGH-001: Renamed from notifyChannels to channels to match backend model
  channels: ('slack' | 'pagerduty' | 'email' | 'admin_push')[];
  unit?: string;
  cooldownMinutes?: number;
}

const SEVERITY_CONFIG = {
  info: { color: '#0EA5E9', bg: '#E0F2FE', label: 'Info' },
  warning: { color: '#F59E0B', bg: '#FEF3C7', label: 'Warning' },
  critical: { color: '#EF4444', bg: '#FEE2E2', label: 'Critical' },
};

export default function AlertRulesScreen() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState('');

  // NIDHI: governance — bulk actions state
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await apiClient.get<AlertRule[]>('/admin/system/alert-rules');
      if (res.success && res.data) {
        setRules(res.data);
      } else {
        setRules([]);
      }
    } catch (err: any) {
      logger.error('Failed to load alert rules:', err);
      setRules([]);
      setFetchError(
        err.message || 'Failed to load alert rules. The endpoint may not be available.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (rule: AlertRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    try {
      const res = await apiClient.patch(`/admin/system/alert-rules/${rule.id}`, {
        enabled: updated.enabled,
      });
      if (!res.success) {
        // Revert on error
        setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
        showAlert('Error', res.message || 'Could not update rule');
      }
    } catch (e) {
      // Revert on error
      setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
      showAlert('Error', 'Could not update rule');
      logger.error('Toggle rule error:', e);
    }
  };

  const saveThreshold = async (rule: AlertRule) => {
    const val = parseFloat(editThreshold);
    if (isNaN(val)) {
      showAlert('Invalid', 'Enter a valid number');
      return;
    }
    const updated = { ...rule, threshold: val };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    setEditingId(null);
    try {
      const res = await apiClient.patch(`/admin/system/alert-rules/${rule.id}`, { threshold: val });
      if (!res.success) {
        setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
        showAlert('Error', res.message || 'Could not update threshold');
      }
    } catch (e) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
      logger.error('Save threshold error:', e);
    }
  };

  // NIDHI: governance — bulk enable/disable all rules
  const handleBulkToggle = async (enableAll: boolean) => {
    const confirmed = await showConfirm(
      enableAll ? 'Enable All Rules?' : 'Disable All Rules?',
      `This will ${enableAll ? 'enable' : 'disable'} all ${rules.length} alert rules.`
    );
    if (!confirmed) return;
    setBulkUpdating(true);
    try {
      const updatePromises = rules.map((rule) =>
        apiClient.patch(`/admin/system/alert-rules/${rule.id}`, { enabled: enableAll })
      );
      await Promise.all(updatePromises);
      showAlert('Success', `All rules ${enableAll ? 'enabled' : 'disabled'}`);
      fetchRules();
    } catch (e) {
      showAlert('Error', 'Could not update rules');
      logger.error('Bulk toggle error:', e);
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );

  const allEnabled = rules.every((r) => r.enabled);
  const allDisabled = rules.every((r) => !r.enabled);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchRules();
          }}
        />
      }
    >
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={20} color="#1a3a52" />
        <Text style={styles.headerText}>Configure alert thresholds and notification channels</Text>
      </View>

      {/* NIDHI: governance — bulk action buttons */}
      {!fetchError && rules.length > 0 && (
        <View style={styles.bulkActionRow}>
          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.bulkEnableBtn,
              allEnabled && styles.bulkButtonDisabled,
            ]}
            onPress={() => handleBulkToggle(true)}
            disabled={allEnabled || bulkUpdating}
          >
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            <Text style={styles.bulkButtonText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.bulkDisableBtn,
              allDisabled && styles.bulkButtonDisabled,
            ]}
            onPress={() => handleBulkToggle(false)}
            disabled={allDisabled || bulkUpdating}
          >
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.bulkButtonText}>Disable All</Text>
          </TouchableOpacity>
        </View>
      )}

      {fetchError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Alert Rules</Text>
          <Text style={styles.errorMessage}>{fetchError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setFetchError(null);
              fetchRules();
            }}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : rules.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorTitle}>No Alert Rules</Text>
          <Text style={styles.errorMessage}>No alert rules have been configured yet.</Text>
        </View>
      ) : null}

      {rules.map((rule) => {
        const sev = SEVERITY_CONFIG[rule.severity];
        const editing = editingId === rule.id;
        return (
          <View key={rule.id} style={[styles.ruleCard, !rule.enabled && styles.ruleCardDisabled]}>
            <View style={styles.ruleTop}>
              <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                <Text style={[styles.severityText, { color: sev.color }]}>{sev.label}</Text>
              </View>
              <Text style={styles.ruleName}>{rule.name}</Text>
              <Switch
                value={rule.enabled}
                onValueChange={() => toggleRule(rule)}
                trackColor={{ false: '#E5E7EB', true: '#1a3a52' }}
                thumbColor={rule.enabled ? '#ffcd57' : '#9CA3AF'}
              />
            </View>

            <View style={styles.ruleMetric}>
              <Text style={styles.metricLabel}>Metric: </Text>
              <Text style={styles.metricValue}>{rule.metric}</Text>
              <Text style={styles.metricLabel}>
                {' '}
                {rule.condition === 'gt' ? '>' : rule.condition === 'lt' ? '<' : '='}{' '}
              </Text>
              {editing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.thresholdInput}
                    value={editThreshold}
                    onChangeText={setEditThreshold}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => saveThreshold(rule)} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(rule.id);
                    setEditThreshold(String(rule.threshold));
                  }}
                >
                  <Text style={styles.thresholdValue}>{rule.threshold} ✏️</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.ruleMeta}>
              <Text style={styles.metaSmall}>
                Triggered: {rule.triggerCount} times
                {rule.lastTriggeredAt
                  ? ` · Last: ${new Date(rule.lastTriggeredAt).toLocaleString('en-IN')}`
                  : ' · Never'}
              </Text>
            </View>

            <View style={styles.channelRow}>
              {(['admin_push', 'email', 'slack'] as const).map((ch) => (
                <View
                  key={ch}
                  style={[
                    styles.channelChip,
                    rule.channels.includes(ch) && styles.channelChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.channelChipText,
                      rule.channels.includes(ch) && styles.channelChipTextActive,
                    ]}
                  >
                    {ch === 'admin_push' ? '📱 Push' : ch === 'email' ? '📧 Email' : '💬 Slack'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  headerText: { flex: 1, fontSize: 13, color: '#1E40AF' },
  // NIDHI: governance — bulk action buttons
  bulkActionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  bulkEnableBtn: { backgroundColor: '#EFF6FF', borderColor: '#22C55E' },
  bulkDisableBtn: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  bulkButtonText: { fontSize: 13, fontWeight: '600', color: '#1a3a52' },
  bulkButtonDisabled: { opacity: 0.5 },
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
  },
  ruleCardDisabled: { opacity: 0.5 },
  ruleTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: '700' },
  ruleName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a3a52' },
  ruleMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  metricLabel: { fontSize: 12, color: '#6B7280' },
  metricValue: { fontSize: 12, color: '#374151', fontFamily: 'monospace', fontWeight: '600' },
  thresholdValue: { fontSize: 14, fontWeight: '800', color: '#1a3a52' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thresholdInput: {
    borderWidth: 1,
    borderColor: '#1a3a52',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 14,
    minWidth: 80,
  },
  saveBtn: {
    backgroundColor: '#1a3a52',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelBtn: { paddingHorizontal: 8 },
  cancelBtnText: { color: '#6B7280', fontSize: 12 },
  ruleMeta: { marginBottom: 8 },
  metaSmall: { fontSize: 11, color: '#9CA3AF' },
  channelRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  channelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  channelChipActive: { backgroundColor: '#EFF6FF', borderColor: '#1a3a52' },
  channelChipText: { fontSize: 11, color: '#9CA3AF' },
  channelChipTextActive: { color: '#1a3a52', fontWeight: '600' },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    gap: 12,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1a3a52', textAlign: 'center' },
  errorMessage: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a3a52',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
