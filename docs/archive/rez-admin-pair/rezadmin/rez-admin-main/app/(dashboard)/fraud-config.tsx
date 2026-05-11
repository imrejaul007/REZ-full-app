import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/apiClient';
import { Colors } from '../../constants/Colors';
import { ADMIN_ROLES } from '../../constants/roles';
import { showAlert, showConfirm } from '../../utils/alert';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

// ── Types ────────────────────────────────────────────────────────────────────

interface FraudConfig {
  minOrderValue: number;
  maxCashbackPerOrder: number;
  maxCashbackPerUserPerDay: number;
  maxCashbackPerMerchantPerDay: number;
  cooldownMinutes: number;
  maxRedemptionPercent: number;
  cashbackHoldHours: number;
  maxDevicesPerUser: number;
  reconciliationIntervalHours: number;
  riskScoreBlockThreshold: number;
  riskScoreHoldThreshold: number;
}

interface ConfigField {
  key: keyof FraudConfig;
  label: string;
  description: string;
  unit?: string;
  section: string;
}

// ── Field definitions ────────────────────────────────────────────────────────

const CONFIG_FIELDS: ConfigField[] = [
  // Cashback limits
  {
    key: 'minOrderValue',
    label: 'Min Order Value',
    description: 'Minimum order value eligible for cashback',
    unit: '₹',
    section: 'Cashback Limits',
  },
  {
    key: 'maxCashbackPerOrder',
    label: 'Max Cashback Per Order',
    description: 'Maximum cashback awarded per order',
    unit: '₹',
    section: 'Cashback Limits',
  },
  {
    key: 'maxCashbackPerUserPerDay',
    label: 'Max Cashback Per User / Day',
    description: 'Daily cashback cap per user',
    unit: '₹',
    section: 'Cashback Limits',
  },
  {
    key: 'maxCashbackPerMerchantPerDay',
    label: 'Max Cashback Per Merchant / Day',
    description: 'Daily cashback liability cap per merchant',
    unit: '₹',
    section: 'Cashback Limits',
  },
  {
    key: 'maxRedemptionPercent',
    label: 'Max Redemption %',
    description: 'Max % of order payable using cashback coins',
    unit: '%',
    section: 'Cashback Limits',
  },
  // Timing controls
  {
    key: 'cooldownMinutes',
    label: 'Cooldown (minutes)',
    description: 'Minimum gap between cashbacks at the same store per user',
    unit: 'min',
    section: 'Timing',
  },
  {
    key: 'cashbackHoldHours',
    label: 'Cashback Hold Period',
    description: 'Hours before pending cashback is auto-credited to wallet',
    unit: 'hrs',
    section: 'Timing',
  },
  {
    key: 'reconciliationIntervalHours',
    label: 'Reconciliation Interval',
    description: 'How often the cashback reconciliation job runs',
    unit: 'hrs',
    section: 'Timing',
  },
  // Fraud / device controls
  {
    key: 'maxDevicesPerUser',
    label: 'Max Devices Per User',
    description: 'Max unique devices allowed per account before multi-device flag fires',
    unit: '',
    section: 'Fraud Controls',
  },
  {
    key: 'riskScoreHoldThreshold',
    label: 'Risk Score — Hold Threshold',
    description: 'Score at or above this → extend hold to 48h (0-100)',
    unit: '',
    section: 'Fraud Controls',
  },
  {
    key: 'riskScoreBlockThreshold',
    label: 'Risk Score — Block Threshold',
    description: 'Score at or above this → block cashback entirely (0-100)',
    unit: '',
    section: 'Fraud Controls',
  },
];

const SECTIONS = [...new Set(CONFIG_FIELDS.map((f) => f.section))];

// ── Component ────────────────────────────────────────────────────────────────

export default function FraudConfigScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { hasRole } = useAuth();

  const [config, setConfig] = useState<FraudConfig | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Enforce super_admin — redirect other admins back
  useEffect(() => {
    if (!hasRole(ADMIN_ROLES.SUPER_ADMIN)) {
      showAlert('Access Denied', 'This screen requires super_admin role.');
      router.replace('/(dashboard)');
    }
  }, [hasRole]);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await apiClient.get<{ config: FraudConfig }>('admin/fraud-config');
      if (response.success && response.data?.config) {
        const cfg = response.data.config;
        // Validate config is an object
        if (!cfg || typeof cfg !== 'object') {
          throw new Error('Invalid config response');
        }
        setConfig(cfg);
        // Populate draft with current values as strings for TextInput
        const draftValues: Record<string, string> = {};
        (Object.keys(cfg) as (keyof FraudConfig)[]).forEach((k) => {
          draftValues[k] = String(cfg[k]);
        });
        setDraft(draftValues);
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to load fraud config');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConfig();
  };

  const handleSave = async () => {
    // Validate all fields are valid numbers
    for (const field of CONFIG_FIELDS) {
      const val = parseFloat(draft[field.key]);
      if (isNaN(val) || val < 0) {
        showAlert('Validation Error', `"${field.label}" must be a non-negative number.`);
        return;
      }
    }

    const confirmed = await showConfirm(
      'Save Fraud Config',
      'This will immediately affect cashback calculations and fraud detection. Continue?'
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const payload: Record<string, number> = {};
      CONFIG_FIELDS.forEach((f) => {
        payload[f.key] = parseFloat(draft[f.key]);
      });

      const response = await apiClient.put<{ config: FraudConfig }>('admin/fraud-config', payload);
      if (response.success) {
        if (response.data?.config) {
          setConfig(response.data.config);
        }
        showAlert('Saved', 'Fraud config updated successfully. Changes take effect immediately.');
      } else {
        showAlert('Error', response.message || 'Update failed');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to save fraud config');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (): boolean => {
    if (!config) return false;
    return CONFIG_FIELDS.some((f) => String(config[f.key]) !== draft[f.key]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading config...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.error}20` }]}>
            <Ionicons name="shield-checkmark" size={28} color={colors.error} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.title, { color: colors.text }]}>Fraud & Cashback Config</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Live controls for cashback limits, hold periods and risk thresholds
            </Text>
          </View>
        </View>

        {/* Info banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}40` },
          ]}
        >
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={[styles.infoBannerText, { color: colors.warningDark }]}>
            Changes are applied immediately — no restart required. The in-process cache invalidates
            on save so the next cashback request reads the new values.
          </Text>
        </View>

        {!config && (
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: '#FEF2F2', borderColor: '#FECACA', marginBottom: 20 },
            ]}
          >
            <Ionicons name="cloud-offline" size={16} color="#DC2626" />
            <Text style={[styles.infoBannerText, { color: '#991B1B' }]}>
              Failed to load config values. Pull down to refresh.
            </Text>
          </View>
        )}

        {/* Sections */}
        {SECTIONS.map((section) => {
          const fields = CONFIG_FIELDS.filter((f) => f.section === section);
          return (
            <View key={section} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.navy }]}>{section}</Text>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? colors.gray800 : colors.card,
                    borderColor: isDark ? colors.gray700 : colors.gray200,
                  },
                ]}
              >
                {fields.map((field, idx) => (
                  <View
                    key={field.key}
                    style={[
                      styles.fieldRow,
                      idx < fields.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? colors.gray700 : colors.gray200,
                      },
                    ]}
                  >
                    <View style={styles.fieldInfo}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>{field.label}</Text>
                      <Text style={[styles.fieldDesc, { color: colors.icon }]}>
                        {field.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: isDark ? colors.gray700 : colors.backgroundSecondary,
                          borderColor: isDark ? colors.gray600 : colors.border,
                        },
                      ]}
                    >
                      {field.unit ? (
                        <Text style={[styles.unitLabel, { color: colors.icon }]}>{field.unit}</Text>
                      ) : null}
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={draft[field.key] ?? ''}
                        onChangeText={(val) => setDraft((prev) => ({ ...prev, [field.key]: val }))}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        accessibilityLabel={field.label}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: hasChanges() ? colors.navy : colors.gray300 },
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || !hasChanges()}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {hasChanges() ? 'Save Changes' : 'No Changes'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fieldDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    minWidth: 90,
  },
  unitLabel: {
    fontSize: 13,
    marginRight: 4,
    fontWeight: '500',
  },
  input: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
    paddingVertical: 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
