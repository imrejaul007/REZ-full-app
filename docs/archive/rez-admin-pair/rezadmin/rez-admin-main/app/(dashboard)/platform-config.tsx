/**
 * Platform Control Center
 *
 * Single screen to view and update every external/configurable value
 * across the REZ platform. Replaces the need to SSH into the server
 * or edit environment variables.
 *
 * Sections:
 *   1. Quick Access — cards linking to specialised config screens
 *   2. System Config — live editable rows from /api/admin/system-config
 *      (grouped: Operations · Limits · Notifications · Integrations)
 *   3. Merchant Plans — subscription plan limits + broadcast quotas
 *   4. Add Config — create a new system config key on the fly
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import { showAlert, showConfirm } from '../../utils/alert';

// ─── Types ─────────────────────────────────────────────────────────────────

type ConfigType = 'string' | 'number' | 'boolean';
type ConfigCategory = 'operations' | 'notifications' | 'limits' | 'integrations';

interface SystemConfigItem {
  _id: string;
  key: string;
  value: string | number | boolean;
  type: ConfigType;
  description: string;
  category: ConfigCategory;
  updatedAt: string;
}

interface PlanLimit {
  plan: 'starter' | 'growth' | 'pro';
  maxProducts: number;
  maxStores: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
  pushPerMonth: number;
  analyticsRetentionDays: number;
  monthlyPrice: number;
}

interface NewConfigForm {
  key: string;
  value: string;
  type: ConfigType;
  category: ConfigCategory;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_META: Record<ConfigCategory, { label: string; icon: string; color: string }> = {
  operations: { label: 'Operations', icon: 'settings', color: '#7C3AED' },
  limits: { label: 'Limits', icon: 'speedometer', color: '#DC2626' },
  notifications: { label: 'Notifications', icon: 'notifications', color: '#2563EB' },
  integrations: { label: 'Integrations', icon: 'git-network', color: '#059669' },
};

const QUICK_LINKS = [
  { label: 'Feature Flags', icon: 'flag', route: '/(dashboard)/feature-flags', color: '#7C3AED' },
  { label: 'Wallet Config', icon: 'wallet', route: '/(dashboard)/wallet-config', color: '#059669' },
  { label: 'Engagement', icon: 'star', route: '/(dashboard)/engagement-config', color: '#D97706' },
  { label: 'Coin Rewards', icon: 'sparkles', route: '/(dashboard)/coin-rewards', color: '#DB2777' },
  {
    label: 'Game Config',
    icon: 'game-controller',
    route: '/(dashboard)/game-config',
    color: '#2563EB',
  },
  { label: 'BBPS Config', icon: 'card', route: '/(dashboard)/bbps-config', color: '#0891B2' },
  {
    label: 'Daily Check-In',
    icon: 'calendar',
    route: '/(dashboard)/daily-checkin-config',
    color: '#7C3AED',
  },
  {
    label: 'Notifications Mgr',
    icon: 'megaphone',
    route: '/(dashboard)/notification-management',
    color: '#DC2626',
  },
  {
    label: 'Support Config',
    icon: 'headset',
    route: '/(dashboard)/support-config',
    color: '#6B7280',
  },
  { label: 'System Health', icon: 'pulse', route: '/(dashboard)/system-health', color: '#059669' },
  { label: 'Job Monitor', icon: 'timer', route: '/(dashboard)/job-monitor', color: '#EA580C' },
  {
    label: 'Reconciliation',
    icon: 'git-compare',
    route: '/(dashboard)/reconciliation',
    color: '#374151',
  },
];

// BUG-052 NOTE: These are UI fallback defaults shown when the /admin/merchant-plans
// endpoint is unavailable. They are NOT authoritative — the backend is the source
// of truth. Real plan limits and pricing must be managed via the API (edit rows
// inline on this screen, which calls PATCH /admin/merchant-plans/:plan).
// Do NOT change pricing here and expect it to take effect in production.
const DEFAULT_PLANS: PlanLimit[] = [
  {
    plan: 'starter',
    maxProducts: 50,
    maxStores: 1,
    smsPerMonth: 0,
    whatsappPerMonth: 0,
    pushPerMonth: 500,
    analyticsRetentionDays: 7,
    monthlyPrice: 0, // configurable via API
  },
  {
    plan: 'growth',
    maxProducts: 500,
    maxStores: 3,
    smsPerMonth: 500,
    whatsappPerMonth: 200,
    pushPerMonth: 5000,
    analyticsRetentionDays: 30,
    monthlyPrice: 1999, // configurable via API
  },
  {
    plan: 'pro',
    maxProducts: 9999,
    maxStores: 10,
    smsPerMonth: 5000,
    whatsappPerMonth: 2000,
    pushPerMonth: 50000,
    analyticsRetentionDays: 90,
    monthlyPrice: 4999, // configurable via API
  },
];

const PLAN_COLORS: Record<string, string> = {
  starter: '#6B7280',
  growth: '#2563EB',
  pro: '#7C3AED',
};

const ACTIVE_SECTIONS = [
  'all',
  'operations',
  'limits',
  'notifications',
  'integrations',
  'plans',
] as const;
type ActiveSection = (typeof ACTIVE_SECTIONS)[number];

// ─── Component ──────────────────────────────────────────────────────────────

export default function PlatformConfigScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  // ── State ──────────────────────────────────────────────────────────────
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // key being saved
  const [drafts, setDrafts] = useState<Record<string, any>>({}); // unsaved edits
  const [activeSection, setActiveSection] = useState<ActiveSection>('all');
  const [plans, setPlans] = useState<PlanLimit[]>(DEFAULT_PLANS);
  const [planDrafts, setPlanDrafts] = useState<Record<string, PlanLimit>>({});
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState<NewConfigForm>({
    key: '',
    value: '',
    type: 'string',
    category: 'operations',
    description: '',
  });
  const [addingSaving, setAddingSaving] = useState(false);
  const [search, setSearch] = useState('');

  // ── Load system configs ────────────────────────────────────────────────
  const loadConfigs = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await apiClient.get('/admin/system-config');
      // FIX-BUG-CRIT-001: Backend returns { success: true, data: { configs } }
      // so res.data = { configs }, not res.data = { data: { configs } }
      setConfigs((res.data as any)?.configs ?? []);
      setDrafts({});
    } catch (err: any) {
      showAlert('Error', err?.message ?? 'Failed to load system config');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Load merchant plan limits ──────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/merchant-plans');
      // FIX-BUG-CRIT-002: Backend returns { success: true, data: { plans } }
      // so res.data = { plans }, not res.data = { data: { plans } }
      if ((res.data as any)?.plans) setPlans((res.data as any).plans);
    } catch {
      // Fallback to defaults — endpoint may not exist yet
    }
  }, []);

  // BUG-003: Include loadConfigs and loadPlans in the dependency array to avoid stale closures.
  useEffect(() => {
    loadConfigs();
    loadPlans();
  }, [loadConfigs, loadPlans]);

  // BUG-036 FIX: wrap in useCallback so the function reference is stable and
  // doesn't re-create on every render.
  const onRefresh = useCallback(() => loadConfigs(true), [loadConfigs]);

  // ── Save a system config value ─────────────────────────────────────────
  // BUG-036 FIX: wrap in useCallback.
  const saveConfig = useCallback(
    async (item: SystemConfigItem) => {
      const draft = drafts[item.key];
      if (draft === undefined) return;

      let finalValue: any = draft;
      if (item.type === 'number') {
        finalValue = parseFloat(draft);
        if (isNaN(finalValue)) {
          showAlert('Invalid', 'Please enter a valid number');
          return;
        }
      }

      setSaving(item.key);
      try {
        await apiClient.patch(`/admin/system-config/${item.key}`, { value: finalValue });
        setConfigs((prev) =>
          prev.map((c) =>
            c.key === item.key
              ? { ...c, value: finalValue, updatedAt: new Date().toISOString() }
              : c
          )
        );
        setDrafts((prev) => {
          const n = { ...prev };
          delete n[item.key];
          return n;
        });
      } catch (err: any) {
        showAlert('Save Failed', err?.message ?? 'Could not update config');
      } finally {
        setSaving(null);
      }
    },
    [drafts]
  );

  // ── Reset a draft ──────────────────────────────────────────────────────
  // BUG-036 FIX: wrap in useCallback.
  const discardDraft = useCallback((key: string) => {
    setDrafts((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }, []);

  // ── Save a merchant plan ───────────────────────────────────────────────
  // BUG-037 FIX: wrap in useCallback.
  const savePlan = useCallback(
    async (planName: string) => {
      const draft = planDrafts[planName];
      if (!draft) return;
      setSavingPlan(planName);
      try {
        await apiClient.patch(`/admin/merchant-plans/${planName}`, draft);
        setPlans((prev) => prev.map((p) => (p.plan === planName ? draft : p)));
        setPlanDrafts((prev) => {
          const n = { ...prev };
          delete n[planName];
          return n;
        });
      } catch (err: any) {
        showAlert('Save Failed', err?.message ?? 'Could not update plan');
      } finally {
        setSavingPlan(null);
      }
    },
    [planDrafts]
  );

  // ── Add new config ─────────────────────────────────────────────────────
  // BUG-037 FIX: wrap in useCallback.
  const addConfig = useCallback(async () => {
    if (!newConfig.key.trim() || !newConfig.value.trim()) {
      showAlert('Required', 'Key and value are required');
      return;
    }
    setAddingSaving(true);
    try {
      let parsedValue: any = newConfig.value;
      if (newConfig.type === 'number') parsedValue = parseFloat(newConfig.value);
      if (newConfig.type === 'boolean') parsedValue = newConfig.value === 'true';

      const res = await apiClient.post('/admin/system-config', {
        key: newConfig.key.trim(),
        value: parsedValue,
        type: newConfig.type,
        category: newConfig.category,
        description: newConfig.description,
      });
      // FIX-BUG-CRIT-003: Backend returns { success: true, data: { config } }
      // so res.data = { config }, not res.data = { data: { config } }
      if ((res.data as any)?.config) {
        setConfigs((prev) => [...prev, (res.data as any).config]);
      }
      setNewConfig({ key: '', value: '', type: 'string', category: 'operations', description: '' });
      setShowAddModal(false);
    } catch (err: any) {
      showAlert('Error', err?.message ?? 'Failed to create config');
    } finally {
      setAddingSaving(false);
    }
  }, [newConfig]);

  // ── Filtered configs ───────────────────────────────────────────────────
  const filteredConfigs = configs.filter((c) => {
    const matchSection = activeSection === 'all' || c.category === activeSection;
    const matchSearch =
      !search ||
      c.key.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  const groupedConfigs: Record<ConfigCategory, SystemConfigItem[]> = {
    operations: filteredConfigs.filter((c) => c.category === 'operations'),
    limits: filteredConfigs.filter((c) => c.category === 'limits'),
    notifications: filteredConfigs.filter((c) => c.category === 'notifications'),
    integrations: filteredConfigs.filter((c) => c.category === 'integrations'),
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderConfigRow = (item: SystemConfigItem) => {
    const isDirty = item.key in drafts;
    const displayValue = isDirty ? drafts[item.key] : item.value;
    const isSavingThis = saving === item.key;

    return (
      <View key={item.key} style={[styles.configRow, isDirty && styles.configRowDirty]}>
        <View style={styles.configLeft}>
          <Text style={[styles.configKey, { color: isDark ? '#E5E7EB' : '#111827' }]}>
            {item.key}
          </Text>
          {item.description ? (
            <Text
              style={[styles.configDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.configMeta, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            Updated{' '}
            {new Date(item.updatedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.configRight}>
          {item.type === 'boolean' ? (
            <Switch
              value={Boolean(displayValue)}
              onValueChange={(v) => setDrafts((prev) => ({ ...prev, [item.key]: v }))}
              trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
              thumbColor="white"
            />
          ) : (
            <TextInput
              style={[
                styles.configInput,
                {
                  color: isDark ? '#F3F4F6' : '#111827',
                  borderColor: isDirty ? '#7C3AED' : isDark ? '#374151' : '#E5E7EB',
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                },
              ]}
              value={String(displayValue)}
              onChangeText={(v) => setDrafts((prev) => ({ ...prev, [item.key]: v }))}
              keyboardType={item.type === 'number' ? 'decimal-pad' : 'default'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          {isDirty && (
            <View style={styles.configActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => saveConfig(item)}
                disabled={isSavingThis}
              >
                {isSavingThis ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardBtn} onPress={() => discardDraft(item.key)}>
                <Ionicons name="close" size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCategorySection = (category: ConfigCategory) => {
    const items = groupedConfigs[category];
    if (!items?.length) return null;
    const meta = CATEGORY_META[category];

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconBg, { backgroundColor: meta.color + '18' }]}>
            <Ionicons name={meta.icon as any} size={16} color={meta.color} />
          </View>
          <Text style={[styles.categoryTitle, { color: isDark ? '#E5E7EB' : '#111827' }]}>
            {meta.label}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: meta.color + '18' }]}>
            <Text style={[styles.countText, { color: meta.color }]}>{items.length}</Text>
          </View>
        </View>
        {items.map(renderConfigRow)}
      </View>
    );
  };

  const renderPlanCard = (plan: PlanLimit) => {
    const draft = planDrafts[plan.plan] ?? plan;
    const isDirty = plan.plan in planDrafts;
    const color = PLAN_COLORS[plan.plan];

    const updateDraft = (field: keyof PlanLimit, val: any) => {
      setPlanDrafts((prev) => ({
        ...prev,
        [plan.plan]: { ...(prev[plan.plan] ?? plan), [field]: val },
      }));
    };

    const fields: Array<{ key: keyof PlanLimit; label: string; numeric?: boolean }> = [
      { key: 'monthlyPrice', label: 'Monthly Price (₹)', numeric: true },
      { key: 'maxProducts', label: 'Max Products', numeric: true },
      { key: 'maxStores', label: 'Max Stores', numeric: true },
      { key: 'smsPerMonth', label: 'SMS / month', numeric: true },
      { key: 'whatsappPerMonth', label: 'WhatsApp / month', numeric: true },
      { key: 'pushPerMonth', label: 'Push / month', numeric: true },
      { key: 'analyticsRetentionDays', label: 'Analytics Retention (days)', numeric: true },
    ];

    return (
      <View key={plan.plan} style={[styles.planCard, isDirty && styles.planCardDirty]}>
        <View style={[styles.planBadge, { backgroundColor: color }]}>
          <Text style={styles.planBadgeText}>{plan.plan.toUpperCase()}</Text>
        </View>

        {fields.map((f) => (
          <View key={f.key} style={styles.planRow}>
            <Text style={[styles.planLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {f.label}
            </Text>
            <TextInput
              style={[
                styles.planInput,
                {
                  color: isDark ? '#F3F4F6' : '#111827',
                  borderColor: isDirty ? color : isDark ? '#374151' : '#E5E7EB',
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                },
              ]}
              value={String(draft[f.key])}
              onChangeText={(v) => updateDraft(f.key, f.numeric ? parseFloat(v) || 0 : v)}
              keyboardType="decimal-pad"
            />
          </View>
        ))}

        {isDirty && (
          <View style={styles.planActions}>
            <TouchableOpacity
              style={[styles.planSaveBtn, { backgroundColor: color }]}
              onPress={() => savePlan(plan.plan)}
              disabled={savingPlan === plan.plan}
            >
              {savingPlan === plan.plan ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveBtnText}>Save {plan.plan} plan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.discardBtn}
              onPress={() =>
                setPlanDrafts((prev) => {
                  const n = { ...prev };
                  delete n[plan.plan];
                  return n;
                })
              }
            >
              <Text style={[styles.configDesc, { color: '#6B7280' }]}>Discard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ─── Main render ────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#E5E7EB' : '#111827'} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            Platform Control Center
          </Text>
          <Text style={[styles.headerSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {configs.length} config keys · Live edits
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* ── Section tabs ────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: isDark ? '#1F2937' : 'white' }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {ACTIVE_SECTIONS.map((s) => {
          const isActive = s === activeSection;
          const label = s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
          const meta = s !== 'all' && s !== 'plans' ? CATEGORY_META[s as ConfigCategory] : null;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.tab, isActive && { borderBottomColor: meta?.color ?? '#7C3AED' }]}
              onPress={() => setActiveSection(s)}
            >
              {meta && (
                <Ionicons
                  name={meta.icon as any}
                  size={12}
                  color={isActive ? meta.color : '#9CA3AF'}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  isActive && { color: meta?.color ?? '#7C3AED', fontWeight: '700' },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      {activeSection !== 'plans' && (
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#F3F4F6' : '#111827' }]}
            placeholder="Search config keys…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={[styles.configDesc, { color: '#6B7280', marginTop: 12 }]}>
            Loading platform config…
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Quick Access ──────────────────────────────────────────── */}
          {activeSection === 'all' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#111827' }]}>
                Quick Access
              </Text>
              <View style={styles.quickGrid}>
                {QUICK_LINKS.map((link) => (
                  <TouchableOpacity
                    key={link.route}
                    style={[styles.quickCard, { backgroundColor: isDark ? '#1F2937' : 'white' }]}
                    onPress={() => router.push(link.route as any)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.quickIcon, { backgroundColor: link.color + '18' }]}>
                      <Ionicons name={link.icon as any} size={20} color={link.color} />
                    </View>
                    <Text
                      style={[styles.quickLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}
                      numberOfLines={2}
                    >
                      {link.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── System Config sections ───────────────────────────────── */}
          {activeSection !== 'plans' && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#111827' }]}>
                  System Config
                </Text>
                <Text style={[styles.configDesc, { color: '#9CA3AF' }]}>
                  {filteredConfigs.length} keys
                </Text>
              </View>

              {filteredConfigs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="search" size={32} color="#9CA3AF" />
                  <Text style={[styles.configDesc, { color: '#9CA3AF', marginTop: 8 }]}>
                    No config keys match your search
                  </Text>
                </View>
              ) : (
                (activeSection === 'all'
                  ? (['operations', 'limits', 'notifications', 'integrations'] as ConfigCategory[])
                  : [activeSection as ConfigCategory]
                ).map((cat) => renderCategorySection(cat))
              )}
            </View>
          )}

          {/* ── Merchant Plans ───────────────────────────────────────── */}
          {(activeSection === 'all' || activeSection === 'plans') && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#111827' }]}>
                Merchant Plan Limits
              </Text>
              <Text style={[styles.configDesc, { color: '#9CA3AF', marginBottom: 16 }]}>
                Adjust subscription tier limits, pricing, and broadcast quotas per plan.
              </Text>
              {plans.map(renderPlanCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Add Config Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              Add Config Key
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? '#E5E7EB' : '#374151'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Key */}
            <Text style={[styles.modalLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Key *
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: isDark ? '#F3F4F6' : '#111827',
                  borderColor: isDark ? '#374151' : '#D1D5DB',
                  backgroundColor: isDark ? '#1F2937' : 'white',
                },
              ]}
              placeholder="e.g. max_broadcast_sms_daily"
              placeholderTextColor="#9CA3AF"
              value={newConfig.key}
              onChangeText={(v) => setNewConfig((p) => ({ ...p, key: v }))}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Type */}
            <Text style={[styles.modalLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Type *
            </Text>
            <View style={styles.typeRow}>
              {(['string', 'number', 'boolean'] as ConfigType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, newConfig.type === t && styles.typeChipActive]}
                  onPress={() =>
                    setNewConfig((p) => ({ ...p, type: t, value: t === 'boolean' ? 'false' : '' }))
                  }
                >
                  <Text
                    style={[styles.typeChipText, newConfig.type === t && styles.typeChipTextActive]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Value */}
            <Text style={[styles.modalLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Value *
            </Text>
            {newConfig.type === 'boolean' ? (
              <View style={styles.boolRow}>
                {['true', 'false'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.typeChip, newConfig.value === v && styles.typeChipActive]}
                    onPress={() => setNewConfig((p) => ({ ...p, value: v }))}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        newConfig.value === v && styles.typeChipTextActive,
                      ]}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: isDark ? '#F3F4F6' : '#111827',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    backgroundColor: isDark ? '#1F2937' : 'white',
                  },
                ]}
                placeholder={newConfig.type === 'number' ? '0' : 'value'}
                placeholderTextColor="#9CA3AF"
                value={newConfig.value}
                onChangeText={(v) => setNewConfig((p) => ({ ...p, value: v }))}
                keyboardType={newConfig.type === 'number' ? 'decimal-pad' : 'default'}
                autoCapitalize="none"
              />
            )}

            {/* Category */}
            <Text style={[styles.modalLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Category *
            </Text>
            <View style={styles.typeRow}>
              {(['operations', 'limits', 'notifications', 'integrations'] as ConfigCategory[]).map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.typeChip,
                      newConfig.category === cat && {
                        ...styles.typeChipActive,
                        borderColor: CATEGORY_META[cat].color,
                        backgroundColor: CATEGORY_META[cat].color + '18',
                      },
                    ]}
                    onPress={() => setNewConfig((p) => ({ ...p, category: cat }))}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        newConfig.category === cat && {
                          color: CATEGORY_META[cat].color,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Description */}
            <Text style={[styles.modalLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: isDark ? '#F3F4F6' : '#111827',
                  borderColor: isDark ? '#374151' : '#D1D5DB',
                  backgroundColor: isDark ? '#1F2937' : 'white',
                  height: 80,
                  textAlignVertical: 'top',
                },
              ]}
              placeholder="What does this config do?"
              placeholderTextColor="#9CA3AF"
              value={newConfig.description}
              onChangeText={(v) => setNewConfig((p) => ({ ...p, description: v }))}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, addingSaving && styles.modalSaveBtnDisabled]}
              onPress={addConfig}
              disabled={addingSaving}
            >
              {addingSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveBtnText}>Create Config Key</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    marginLeft: 'auto',
    backgroundColor: '#7C3AED',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabBar: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBarContent: { paddingHorizontal: 16, gap: 4, alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Quick links
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Category section
  categorySection: { marginBottom: 20 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryIconBg: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: { fontSize: 11, fontWeight: '700' },

  // Config row
  configRow: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  configRowDirty: {
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    backgroundColor: '#FAFAFF',
  },
  configLeft: { flex: 1 },
  configRight: { alignItems: 'flex-end', gap: 8, minWidth: 120 },
  configKey: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  configDesc: { fontSize: 11, marginTop: 3, lineHeight: 16 },
  configMeta: { fontSize: 10, marginTop: 4 },
  configInput: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 100,
    textAlign: 'right',
  },
  configActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  saveBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    minWidth: 52,
    alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  discardBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },

  // Merchant plan cards
  planCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planCardDirty: {
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  planBadgeText: { color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  planLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  planInput: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    width: 120,
    textAlign: 'right',
  },
  planActions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
  planSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  // Add config modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalBody: { padding: 20 },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  boolRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#EDE9FE',
  },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeChipTextActive: { color: '#7C3AED' },
  modalSaveBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  modalSaveBtnDisabled: { opacity: 0.6 },
});
