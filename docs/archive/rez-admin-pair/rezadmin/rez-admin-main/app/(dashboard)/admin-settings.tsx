/**
 * app/(dashboard)/admin-settings.tsx
 *
 * Admin Settings Screen
 * - Platform Settings: cashback multiplier, maintenance mode, max coins/day
 * - Admin Users: list + add admin (email + role)
 * - Save with confirmation
 */

import React, { useState, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import { showAlert, showConfirm } from '../../utils/alert';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlatformSettings {
  cashbackMultiplier: 1 | 2;
  maintenanceMode: boolean;
  maxCoinsPerDay: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AdminSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Platform settings state
  const [settings, setSettings] = useState<PlatformSettings>({
    cashbackMultiplier: 1,
    maintenanceMode: false,
    maxCoinsPerDay: 500,
  });
  const [maxCoinsInput, setMaxCoinsInput] = useState('500');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admin users state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add admin modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [settingsRes, adminsRes] = await Promise.allSettled([
        apiClient.get<PlatformSettings>('admin/settings'),
        apiClient.get<AdminUser[]>('admin/admin-users'),
      ]);

      if (
        settingsRes.status === 'fulfilled' &&
        settingsRes.value.success &&
        settingsRes.value.data
      ) {
        const s = settingsRes.value.data;
        setSettings(s);
        setMaxCoinsInput(String(s.maxCoinsPerDay));
      }
      if (adminsRes.status === 'fulfilled' && adminsRes.value.success && adminsRes.value.data) {
        setAdmins(adminsRes.value.data);
      } else {
        setAdmins([]);
      }
    } catch (err: any) {
      logger.error('Admin settings fetch error:', err.message);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoadingAdmins(true);
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const handleSave = useCallback(async () => {
    const confirmed = await showConfirm(
      'Save Settings',
      'Apply platform settings changes? This may affect all users.'
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const payload: Partial<PlatformSettings> = {
        cashbackMultiplier: settings.cashbackMultiplier,
        maintenanceMode: settings.maintenanceMode,
        maxCoinsPerDay: parseInt(maxCoinsInput, 10) || settings.maxCoinsPerDay,
      };
      const res = await apiClient.patch<PlatformSettings>('admin/settings', payload);
      if (res.success && res.data) {
        setSettings(res.data);
        setMaxCoinsInput(String(res.data.maxCoinsPerDay));
        setSettingsDirty(false);
        showAlert('Saved', 'Platform settings updated successfully.');
      } else {
        showAlert('Error', res.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }, [settings, maxCoinsInput]);

  const handleAddAdmin = useCallback(async () => {
    if (!newAdminEmail.trim()) {
      showAlert('Validation', 'Please enter an email address.');
      return;
    }
    setAddingAdmin(true);
    try {
      const res = await apiClient.post<AdminUser>('admin/users', {
        email: newAdminEmail.trim(),
        role: newAdminRole,
      });
      if (res.success && res.data) {
        setAdmins((prev) => [res.data!, ...prev]);
        setAddModalVisible(false);
        setNewAdminEmail('');
        setNewAdminRole('admin');
        showAlert('Admin Added', `${newAdminEmail} has been added as ${newAdminRole}.`);
      } else {
        showAlert('Error', res.message || 'Failed to add admin.');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to add admin.');
    } finally {
      setAddingAdmin(false);
    }
  }, [newAdminEmail, newAdminRole]);

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsDirty(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Settings</Text>
          <Text style={styles.headerSub}>Platform configuration</Text>
        </View>
        {settingsDirty && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Platform Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Settings</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Cashback Multiplier */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: '#F59E0B18' }]}>
              <Ionicons name="flash" size={18} color="#F59E0B" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Cashback Multiplier</Text>
              <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                {settings.cashbackMultiplier === 2
                  ? 'Double cashback active (2x)'
                  : 'Standard cashback (1x)'}
              </Text>
            </View>
            <View style={styles.multiplierToggle}>
              <TouchableOpacity
                style={[
                  styles.multiplierBtn,
                  settings.cashbackMultiplier === 1 && { backgroundColor: colors.tint },
                ]}
                onPress={() => updateSetting('cashbackMultiplier', 1)}
              >
                <Text
                  style={[
                    styles.multiplierBtnText,
                    { color: settings.cashbackMultiplier === 1 ? '#fff' : colors.icon },
                  ]}
                >
                  1x
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.multiplierBtn,
                  settings.cashbackMultiplier === 2 && { backgroundColor: colors.tint },
                ]}
                onPress={() => updateSetting('cashbackMultiplier', 2)}
              >
                <Text
                  style={[
                    styles.multiplierBtnText,
                    { color: settings.cashbackMultiplier === 2 ? '#fff' : colors.icon },
                  ]}
                >
                  2x
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Maintenance Mode */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: '#EF444418' }]}>
              <Ionicons name="construct" size={18} color="#EF4444" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Maintenance Mode</Text>
              <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                Shows maintenance banner in consumer app
              </Text>
            </View>
            <Switch
              value={settings.maintenanceMode}
              onValueChange={(v) => updateSetting('maintenanceMode', v)}
              trackColor={{ true: '#EF4444', false: colors.border }}
              thumbColor={colors.card}
            />
          </View>

          {/* Max Coins Per Day */}
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={[styles.settingIcon, { backgroundColor: '#6366F118' }]}>
              <Ionicons name="star" size={18} color="#6366F1" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Max Coins Per Day</Text>
              <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                Per-user daily coin earning limit
              </Text>
            </View>
            <TextInput
              style={[
                styles.numberInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={maxCoinsInput}
              onChangeText={(v) => {
                setMaxCoinsInput(v);
                setSettingsDirty(true);
              }}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>

        {settingsDirty && (
          <TouchableOpacity
            style={[
              styles.saveLargeBtn,
              { backgroundColor: colors.tint },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.saveLargeBtnText}>Save Platform Settings</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Users */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin Users</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
            onPress={() => setAddModalVisible(true)}
          >
            <Ionicons name="person-add" size={14} color="#fff" />
            <Text style={styles.addBtnText}>Add Admin</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {loadingAdmins ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.icon }]}>Loading admins...</Text>
            </View>
          ) : admins.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>No admin users found</Text>
            </View>
          ) : (
            admins.map((admin, idx) => (
              <View
                key={admin.id}
                style={[
                  styles.adminRow,
                  idx < admins.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.adminAvatar, { backgroundColor: `${colors.tint}18` }]}>
                  <Text style={[styles.adminAvatarText, { color: colors.tint }]}>
                    {admin.name?.charAt(0)?.toUpperCase() ||
                      admin.email?.charAt(0)?.toUpperCase() ||
                      '?'}
                  </Text>
                </View>
                <View style={styles.adminInfo}>
                  <Text style={[styles.adminName, { color: colors.text }]}>
                    {admin.name || admin.email}
                  </Text>
                  <Text style={[styles.adminEmail, { color: colors.icon }]}>{admin.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: `${colors.indigo}15` }]}>
                  <Text style={[styles.roleText, { color: colors.indigo }]}>{admin.role}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={{ height: 32 }} />

      {/* Add Admin Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Admin</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.icon }]}>Email Address</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="admin@rezapp.com"
              placeholderTextColor={colors.icon}
              value={newAdminEmail}
              onChangeText={setNewAdminEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.modalLabel, { color: colors.icon }]}>Role</Text>
            <View style={styles.roleRow}>
              {['admin', 'super_admin', 'viewer'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleChip,
                    {
                      backgroundColor: newAdminRole === role ? colors.tint : colors.background,
                      borderColor: newAdminRole === role ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setNewAdminRole(role)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      { color: newAdminRole === role ? '#fff' : colors.text },
                    ]}
                  >
                    {role.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.modalSaveBtn,
                { backgroundColor: colors.tint },
                addingAdmin && { opacity: 0.6 },
              ]}
              onPress={handleAddAdmin}
              disabled={addingAdmin}
            >
              {addingAdmin ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Add Admin</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  card: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 12 },

  multiplierToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  multiplierBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  multiplierBtnText: { fontSize: 13, fontWeight: '700' },

  numberInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
  },

  saveLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveLargeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  adminAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatarText: { fontSize: 16, fontWeight: '700' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  adminEmail: { fontSize: 12 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20 },
  loadingText: { fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleChipText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  modalSaveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
