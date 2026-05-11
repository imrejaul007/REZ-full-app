import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { apiClient } from '../../services/api/apiClient';

interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'running' | 'paused' | 'completed';
  variants: { name: string; allocation: number; conversions: number; impressions: number }[];
  startDate: string;
  endDate?: string;
  metric: string;
  winner?: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  running: { color: '#22C55E', label: 'Running' },
  paused: { color: '#F59E0B', label: 'Paused' },
  completed: { color: '#6B7280', label: 'Completed' },
};

interface NewTestForm {
  id: string;
  name: string;
  metric: string;
  variantAName: string;
  variantBName: string;
}

const EMPTY_FORM: NewTestForm = {
  id: '',
  name: '',
  metric: '',
  variantAName: 'Control',
  variantBName: 'Variant',
};

export default function ABTestManagerScreen() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // BUG-013: Add error state so the UI can show a retry button on API failure.
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewTestForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<NewTestForm>>({});
  const [creating, setCreating] = useState(false);

  const fetchTests = useCallback(async () => {
    setError(null);
    try {
      const res = await apiClient.get<any>('admin/ab-tests');
      if (res.success && res.data) {
        // Backend returns data as array directly or nested in data.data
        const rawTests = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
        setTests(rawTests);
      } else {
        setError((res as any).message || (res as any).error || 'Failed to load A/B tests');
        setTests([]);
      }
    } catch (err: any) {
      logger.error('Failed to load A/B tests:', err);
      setError(err?.message || 'Failed to load A/B tests');
      setTests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const validateForm = (): boolean => {
    const errs: Partial<NewTestForm> = {};
    if (!form.id.trim()) errs.id = 'ID required';
    else if (!/^[a-z0-9-]+$/.test(form.id.trim()))
      errs.id = 'Lowercase letters, numbers, hyphens only';
    if (!form.name.trim()) errs.name = 'Name required';
    if (!form.metric.trim()) errs.metric = 'Metric required';
    if (!form.variantAName.trim()) errs.variantAName = 'Required';
    if (!form.variantBName.trim()) errs.variantBName = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setCreating(true);
    try {
      const res = await apiClient.post<any>('admin/ab-tests', {
        id: form.id.trim(),
        name: form.name.trim(),
        metric: form.metric.trim(),
        variants: [
          { name: form.variantAName.trim(), allocation: 50, conversions: 0, impressions: 0 },
          { name: form.variantBName.trim(), allocation: 50, conversions: 0, impressions: 0 },
        ],
      });
      if (res.success) {
        setShowCreateModal(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
        fetchTests();
      } else {
        showAlert('Error', (res as any).message || (res as any).error || 'Failed to create test');
      }
    } catch (err: any) {
      logger.error('Create AB test error:', err);
      showAlert('Error', err?.message || 'Failed to create test');
    } finally {
      setCreating(false);
    }
  };

  const toggleTest = async (test: ABTest) => {
    const newStatus = test.status === 'running' ? 'paused' : 'running';
    setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, status: newStatus } : t)));
    try {
      const res = await apiClient.patch(`admin/ab-tests/${test.id}`, { status: newStatus });
      if (!res.success) {
        setTests((prev) => prev.map((t) => (t.id === test.id ? test : t)));
        showAlert(
          'Error',
          (res as any).message || (res as any).error || 'Could not update test status'
        );
      }
    } catch (err) {
      setTests((prev) => prev.map((t) => (t.id === test.id ? test : t)));
      logger.error('Toggle test error:', err);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );

  // BUG-013: Show error UI with retry button when the API call fails.
  if (error && tests.length === 0)
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#EF4444', marginTop: 12, fontSize: 16, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchTests}
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 10,
            backgroundColor: '#1a3a52',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTests();
            }}
          />
        }
      >
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>
            {tests.filter((t) => t.status === 'running').length} tests running
          </Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => {
              setForm(EMPTY_FORM);
              setFormErrors({});
              setShowCreateModal(true);
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newBtnText}>New Test</Text>
          </TouchableOpacity>
        </View>

        {tests.map((test) => {
          const sc = STATUS_CONFIG[test.status] || { color: '#9CA3AF', label: test.status };
          const isExpanded = expanded === test.id;
          const variants = test.variants || [];
          const maxConvRate = Math.max(
            0,
            ...variants.map((v) => (v.impressions > 0 ? v.conversions / v.impressions : 0))
          );

          return (
            <TouchableOpacity
              key={test.id}
              style={styles.testCard}
              onPress={() => setExpanded(isExpanded ? null : test.id)}
            >
              <View style={styles.testHeader}>
                <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{test.name}</Text>
                  {test.description ? (
                    <Text style={styles.testDesc}>{test.description}</Text>
                  ) : null}
                </View>
                <View style={styles.testActions}>
                  {(test.status === 'running' || test.status === 'paused') && (
                    <Switch
                      value={test.status === 'running'}
                      onValueChange={() => toggleTest(test)}
                      trackColor={{ false: '#E5E7EB', true: '#22C55E' }}
                      thumbColor="#fff"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  )}
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#9CA3AF"
                  />
                </View>
              </View>

              {test.winner && (
                <View style={styles.winnerBadge}>
                  <Ionicons name="trophy" size={14} color="#F59E0B" />
                  <Text style={styles.winnerText}>Winner: {test.winner}</Text>
                </View>
              )}

              {isExpanded && (
                <View style={styles.variantsSection}>
                  <Text style={styles.metricLabel}>Metric: {test.metric}</Text>
                  {variants.map((v, i) => {
                    const impr = v.impressions ?? 0;
                    const conv = v.conversions ?? 0;
                    const convRate = impr > 0 ? ((conv / impr) * 100).toFixed(1) : '0.0';
                    const isWinner =
                      maxConvRate > 0 && impr > 0 && Math.abs(conv / impr - maxConvRate) < 0.0001;
                    return (
                      <View
                        key={i}
                        style={[styles.variantRow, isWinner && styles.variantRowWinner]}
                      >
                        <View style={styles.variantLeft}>
                          {isWinner && (
                            <Ionicons
                              name="trophy"
                              size={12}
                              color="#F59E0B"
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text style={styles.variantName}>{v.name}</Text>
                          <Text style={styles.variantTraffic}>{v.allocation ?? 0}% traffic</Text>
                        </View>
                        <View style={styles.variantRight}>
                          <Text style={styles.variantConvRate}>{convRate}%</Text>
                          <Text style={styles.variantCount}>
                            {conv}/{impr}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  <Text style={styles.dateMeta}>
                    Started: {new Date(test.startDate).toLocaleDateString('en-IN')}
                    {test.endDate
                      ? ` · Ended: ${new Date(test.endDate).toLocaleDateString('en-IN')}`
                      : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create New A/B Test Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New A/B Test</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} disabled={creating}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Test ID */}
              <View style={styles.mGroup}>
                <Text style={styles.mLabel}>
                  Test ID <Text style={styles.mRequired}>*</Text>
                </Text>
                <TextInput
                  style={[styles.mInput, formErrors.id ? styles.mInputErr : undefined]}
                  placeholder="e.g. checkout-button-color"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  value={form.id}
                  onChangeText={(t) =>
                    setForm({ ...form, id: t.toLowerCase().replace(/\s+/g, '-') })
                  }
                  editable={!creating}
                />
                {formErrors.id ? <Text style={styles.mErrText}>{formErrors.id}</Text> : null}
                <Text style={styles.mHelper}>Lowercase letters, numbers and hyphens only</Text>
              </View>

              {/* Name */}
              <View style={styles.mGroup}>
                <Text style={styles.mLabel}>
                  Test Name <Text style={styles.mRequired}>*</Text>
                </Text>
                <TextInput
                  style={[styles.mInput, formErrors.name ? styles.mInputErr : undefined]}
                  placeholder="e.g. Checkout Button Color"
                  placeholderTextColor="#9CA3AF"
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                  editable={!creating}
                />
                {formErrors.name ? <Text style={styles.mErrText}>{formErrors.name}</Text> : null}
              </View>

              {/* Metric */}
              <View style={styles.mGroup}>
                <Text style={styles.mLabel}>
                  Success Metric <Text style={styles.mRequired}>*</Text>
                </Text>
                <TextInput
                  style={[styles.mInput, formErrors.metric ? styles.mInputErr : undefined]}
                  placeholder="e.g. checkout_completion"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  value={form.metric}
                  onChangeText={(t) => setForm({ ...form, metric: t })}
                  editable={!creating}
                />
                {formErrors.metric ? (
                  <Text style={styles.mErrText}>{formErrors.metric}</Text>
                ) : null}
              </View>

              {/* Variants */}
              <View style={styles.mGroup}>
                <Text style={styles.mLabel}>Variants (50% / 50% split)</Text>
                <View style={styles.variantInputRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.mLabelSmall}>Variant A</Text>
                    <TextInput
                      style={[
                        styles.mInput,
                        formErrors.variantAName ? styles.mInputErr : undefined,
                      ]}
                      placeholder="Control"
                      placeholderTextColor="#9CA3AF"
                      value={form.variantAName}
                      onChangeText={(t) => setForm({ ...form, variantAName: t })}
                      editable={!creating}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mLabelSmall}>Variant B</Text>
                    <TextInput
                      style={[
                        styles.mInput,
                        formErrors.variantBName ? styles.mInputErr : undefined,
                      ]}
                      placeholder="Variant"
                      placeholderTextColor="#9CA3AF"
                      value={form.variantBName}
                      onChangeText={(t) => setForm({ ...form, variantBName: t })}
                      editable={!creating}
                    />
                  </View>
                </View>
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.mBtn, styles.mBtnCancel]}
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
              >
                <Text style={styles.mBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mBtn, styles.mBtnCreate]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.mBtnCreateText}>Create Test</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1a3a52' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a3a52',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
  },
  testHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  testInfo: { flex: 1 },
  testName: { fontSize: 14, fontWeight: '700', color: '#1a3a52' },
  testDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  testActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  winnerText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  variantsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metricLabel: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
  },
  variantRowWinner: { backgroundColor: '#FEF9C3' },
  variantLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  variantName: { fontSize: 13, fontWeight: '600', color: '#1a3a52', flex: 1 },
  variantTraffic: { fontSize: 11, color: '#9CA3AF' },
  variantRight: { alignItems: 'flex-end' },
  variantConvRate: { fontSize: 16, fontWeight: '800', color: '#1a3a52' },
  variantCount: { fontSize: 11, color: '#9CA3AF' },
  dateMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a3a52' },
  mGroup: { marginBottom: 16 },
  mLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  mLabelSmall: { fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 },
  mRequired: { color: '#EF4444' },
  mInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  mInputErr: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  mErrText: { fontSize: 11, color: '#EF4444', marginTop: 4 },
  mHelper: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  variantInputRow: { flexDirection: 'row' },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  mBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mBtnCancel: { backgroundColor: '#F3F4F6' },
  mBtnCancelText: { fontWeight: '600', color: '#374151' },
  mBtnCreate: { backgroundColor: '#1a3a52' },
  mBtnCreateText: { fontWeight: '700', color: '#fff' },
});
