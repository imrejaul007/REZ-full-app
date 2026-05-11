import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gameConfigService, GameConfigItem } from '../../services/api/gameConfig';
import { Colors } from '../../constants/Colors';
import { showAlert, showConfirm } from '../../utils/alert';
import { GameCard, EditModal, CreateModal, AnalyticsTab, UserManagementTab } from '../../components/game-config';

type GameType =
  | 'spin_wheel'
  | 'memory_match'
  | 'coin_hunt'
  | 'guess_price'
  | 'quiz'
  | 'scratch_card';

const GAME_TYPE_DISPLAY: Record<GameType, { label: string; emoji: string; color: string }> = {
  spin_wheel: { label: 'Spin Wheel', emoji: '\uD83C\uDFB0', color: Colors.light.error },
  memory_match: { label: 'Memory Match', emoji: '\uD83E\uDDE0', color: Colors.light.purple },
  coin_hunt: { label: 'Coin Hunt', emoji: '\uD83E\uDE99', color: Colors.light.warning },
  guess_price: { label: 'Guess the Price', emoji: '\uD83D\uDCB0', color: Colors.light.success },
  quiz: { label: 'Quiz', emoji: '\uD83D\uDCDD', color: Colors.light.info },
  scratch_card: { label: 'Scratch Card', emoji: '\uD83C\uDFAB', color: Colors.light.pink },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type FormTab = 'basic' | 'rewards' | 'difficulty' | 'schedule' | 'advanced';

interface FormData {
  gameType: GameType;
  displayName: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  dailyLimit: number;
  cooldownMinutes: number;
  rewards: {
    minCoins: number;
    maxCoins: number;
    bonusMultiplier: number;
  };
  difficulty: {
    easy: { timeLimit: number; gridSize?: number; lives?: number };
    medium: { timeLimit: number; gridSize?: number; lives?: number };
    hard: { timeLimit: number; gridSize?: number; lives?: number };
  };
  config: string; // JSON string for editing
  schedule: {
    availableDays: number[];
    availableHoursStart?: number;
    availableHoursEnd?: number;
  };
  sortOrder: number;
  featured: boolean;
}

const DEFAULT_FORM: FormData = {
  gameType: 'spin_wheel',
  displayName: '',
  description: '',
  icon: 'game-controller',
  isEnabled: true,
  dailyLimit: 3,
  cooldownMinutes: 0,
  rewards: { minCoins: 0, maxCoins: 100, bonusMultiplier: 1 },
  difficulty: {
    easy: { timeLimit: 60 },
    medium: { timeLimit: 45 },
    hard: { timeLimit: 30 },
  },
  config: '{}',
  schedule: { availableDays: [] },
  sortOrder: 0,
  featured: false,
};

export default function GameConfigScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [gameConfigs, setGameConfigs] = useState<GameConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GameConfigItem | null>(null);
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM });
  const [activeFormTab, setActiveFormTab] = useState<FormTab>('basic');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<FormData>({ ...DEFAULT_FORM });

  // Page-level tab (configs vs analytics vs user management)
  const [pageTab, setPageTab] = useState<'configs' | 'analytics' | 'users'>('configs');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  // User management state
  const [userIdInput, setUserIdInput] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinReason, setCoinReason] = useState('');

  // Ban modal state
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  // ==========================================
  // Data Loading
  // ==========================================

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gameConfigService.list();
      if (!mountedRef.current) return;
      if (response.success && response.data?.gameConfigs) {
        setGameConfigs(response.data.gameConfigs);
      } else {
        setGameConfigs([]);
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      logger.error('Failed to load game configs:', error);
      showAlert('Error', error.message || 'Failed to load game configs');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConfigs();
    setRefreshing(false);
  }, [loadConfigs]);

  // ==========================================
  // Handlers
  // ==========================================

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const response = await gameConfigService.seed();
      if (response.success) {
        showAlert('Success', response.message || 'Default configs seeded');
        await loadConfigs();
      } else {
        showAlert('Error', response.message || 'Failed to seed configs');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to seed configs');
    } finally {
      setSeeding(false);
    }
  }, [loadConfigs]);

  const handleToggle = useCallback(
    async (config: GameConfigItem) => {
      // Optimistic update
      const prev = [...gameConfigs];
      setGameConfigs((list) =>
        list.map((c) => (c._id === config._id ? { ...c, isEnabled: !c.isEnabled } : c))
      );
      try {
        const response = await gameConfigService.toggle(config._id);
        if (!response.success) {
          setGameConfigs(prev);
          showAlert('Error', response.message || 'Failed to toggle');
        }
      } catch (error: any) {
        setGameConfigs(prev);
        showAlert('Error', error.message || 'Failed to toggle');
      }
    },
    [gameConfigs]
  );

  const handleToggleFeatured = useCallback(
    async (config: GameConfigItem) => {
      const prev = [...gameConfigs];
      setGameConfigs((list) =>
        list.map((c) => (c._id === config._id ? { ...c, featured: !c.featured } : c))
      );
      try {
        const response = await gameConfigService.toggleFeatured(config._id);
        if (!response.success) {
          setGameConfigs(prev);
          showAlert('Error', response.message || 'Failed to toggle featured');
        }
      } catch (error: any) {
        setGameConfigs(prev);
        showAlert('Error', error.message || 'Failed to toggle featured');
      }
    },
    [gameConfigs]
  );

  const handleDelete = useCallback(
    (config: GameConfigItem) => {
      showConfirm(
        'Delete Game Config',
        `Are you sure you want to delete "${config.displayName}"? This cannot be undone.`,
        async () => {
          try {
            const response = await gameConfigService.delete(config._id);
            if (response.success) {
              showAlert('Success', 'Game config deleted');
              await loadConfigs();
            } else {
              showAlert('Error', response.message || 'Failed to delete');
            }
          } catch (error: any) {
            showAlert('Error', error.message || 'Failed to delete');
          }
        },
        'Delete'
      );
    },
    [loadConfigs]
  );

  const handleEdit = useCallback((config: GameConfigItem) => {
    setEditingConfig(config);
    setForm({
      gameType: config.gameType,
      displayName: config.displayName,
      description: config.description,
      icon: config.icon,
      isEnabled: config.isEnabled,
      dailyLimit: config.dailyLimit,
      cooldownMinutes: config.cooldownMinutes,
      rewards: { ...(config.rewards || {}) },
      difficulty: {
        easy: { ...(config.difficulty?.easy || {}) },
        medium: { ...(config.difficulty?.medium || {}) },
        hard: { ...(config.difficulty?.hard || {}) },
      },
      config: JSON.stringify(config.config || {}, null, 2),
      schedule: {
        availableDays: config.schedule?.availableDays || [],
        availableHoursStart: config.schedule?.availableHours?.start,
        availableHoursEnd: config.schedule?.availableHours?.end,
      },
      sortOrder: config.sortOrder,
      featured: config.featured,
    });
    setActiveFormTab('basic');
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingConfig) return;

    // Validate JSON config
    let parsedConfig: Record<string, any> = {};
    try {
      parsedConfig = JSON.parse(form.config);
    } catch {
      showAlert('Error', 'Invalid JSON in Advanced Config field');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        displayName: form.displayName,
        description: form.description,
        icon: form.icon,
        isEnabled: form.isEnabled,
        dailyLimit: form.dailyLimit,
        cooldownMinutes: form.cooldownMinutes,
        rewards: form.rewards,
        difficulty: form.difficulty,
        config: parsedConfig,
        schedule: {
          availableDays: form.schedule.availableDays,
          availableHours:
            form.schedule.availableHoursStart !== undefined &&
            form.schedule.availableHoursEnd !== undefined
              ? { start: form.schedule.availableHoursStart, end: form.schedule.availableHoursEnd }
              : undefined,
        },
        sortOrder: form.sortOrder,
        featured: form.featured,
      };

      const response = await gameConfigService.update(editingConfig._id, payload);
      if (response.success) {
        showAlert('Success', 'Game config updated');
        setShowModal(false);
        await loadConfigs();
      } else {
        showAlert('Error', response.message || 'Failed to update');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  }, [editingConfig, form, loadConfigs]);

  const handleCreate = useCallback(async () => {
    if (!createForm.displayName || !createForm.description) {
      showAlert('Error', 'Display name and description are required');
      return;
    }

    let parsedConfig: Record<string, any> = {};
    try {
      parsedConfig = JSON.parse(createForm.config);
    } catch {
      showAlert('Error', 'Invalid JSON in config field');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        gameType: createForm.gameType,
        displayName: createForm.displayName,
        description: createForm.description,
        icon: createForm.icon,
        isEnabled: createForm.isEnabled,
        dailyLimit: createForm.dailyLimit,
        cooldownMinutes: createForm.cooldownMinutes,
        rewards: createForm.rewards,
        difficulty: createForm.difficulty,
        config: parsedConfig,
        schedule: {
          availableDays: createForm.schedule.availableDays,
          availableHours:
            createForm.schedule.availableHoursStart !== undefined &&
            createForm.schedule.availableHoursEnd !== undefined
              ? {
                  start: createForm.schedule.availableHoursStart,
                  end: createForm.schedule.availableHoursEnd,
                }
              : undefined,
        },
        sortOrder: createForm.sortOrder,
        featured: createForm.featured,
      };

      const response = await gameConfigService.create(payload);
      if (response.success) {
        showAlert('Success', 'Game config created');
        setShowCreateModal(false);
        setCreateForm({ ...DEFAULT_FORM });
        await loadConfigs();
      } else {
        showAlert('Error', response.message || 'Failed to create');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to create');
    } finally {
      setIsSaving(false);
    }
  }, [createForm, loadConfigs]);

  // ==========================================
  // Analytics & User Management Handlers
  // ==========================================

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await gameConfigService.getAnalytics(undefined, analyticsDays);
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDays]);

  useEffect(() => {
    if (pageTab === 'analytics' && !analyticsData) {
      loadAnalytics();
    }
  }, [pageTab, loadAnalytics, analyticsData]);

  const handleLookupUser = async () => {
    if (!userIdInput.trim()) return;
    setUserLoading(true);
    try {
      const response = await gameConfigService.getUserGameHistory(userIdInput.trim());
      if (response.success && response.data) {
        setUserData(response.data);
      } else {
        showAlert('Not Found', 'User not found or no game history');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to lookup user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!userData?.user?._id) return;
    setBanReason('');
    setShowBanModal(true);
  };

  const handleConfirmBan = async () => {
    if (!banReason.trim()) {
      showAlert('Error', 'Please provide a ban reason');
      return;
    }
    try {
      await gameConfigService.banUser(userData.user._id, banReason.trim());
      showAlert('Success', 'User banned from games');
      setShowBanModal(false);
      setBanReason('');
      handleLookupUser(); // Refresh
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleUnbanUser = async () => {
    if (!userData?.user?._id) return;
    try {
      await gameConfigService.unbanUser(userData.user._id);
      showAlert('Success', 'User unbanned');
      handleLookupUser();
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleCreditCoins = async () => {
    if (!userData?.user?._id || !coinAmount || !coinReason) {
      showAlert('Error', 'Enter amount and reason');
      return;
    }
    const parsed = parseInt(coinAmount);
    if (isNaN(parsed) || parsed <= 0 || parsed > 100000) {
      showAlert('Validation Error', 'Coin amount must be between 1 and 100,000');
      return;
    }
    try {
      const response = await gameConfigService.creditCoins(userData.user._id, parsed, coinReason);
      if (response.success) {
        showAlert('Success', `Credited ${coinAmount} coins`);
        setCoinAmount('');
        setCoinReason('');
      }
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleRevokeCoins = async () => {
    if (!userData?.user?._id || !coinAmount || !coinReason) {
      showAlert('Error', 'Enter amount and reason');
      return;
    }
    const parsed = parseInt(coinAmount);
    if (isNaN(parsed) || parsed <= 0 || parsed > 100000) {
      showAlert('Validation Error', 'Coin amount must be between 1 and 100,000');
      return;
    }
    showConfirm('Revoke Coins', `Revoke ${coinAmount} coins from this user?`, async () => {
      try {
        const response = await gameConfigService.revokeCoins(userData.user._id, parsed, coinReason);
        if (response.success) {
          showAlert('Success', `Revoked ${coinAmount} coins`);
          setCoinAmount('');
          setCoinReason('');
        }
      } catch (error: any) {
        showAlert('Error', error.message);
      }
    });
  };

  // ==========================================
  // Render: Header
  // ==========================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Game Configuration</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          Configure mini-games, rewards & schedules
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.seedBtn, { backgroundColor: colors.warning }]}
        onPress={handleSeed}
        disabled={seeding}
      >
        {seeding ? (
          <ActivityIndicator size="small" color={colors.card} />
        ) : (
          <>
            <Ionicons name="flash" size={16} color={colors.card} />
            <Text style={styles.seedBtnText}>Seed Defaults</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ==========================================
  // Render: Stats
  // ==========================================

  const renderStats = () => {
    const total = gameConfigs.length;
    const enabled = gameConfigs.filter((c) => c.isEnabled).length;
    const featured = gameConfigs.filter((c) => c.featured).length;

    return (
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: total, color: colors.text },
          { label: 'Enabled', value: enabled, color: colors.success },
          { label: 'Featured', value: featured, color: colors.warning },
        ].map((item, index) => (
          <View key={index} style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPageTabs = () => (
    <View style={[styles.pageTabsRow, { borderBottomColor: colors.border }]}>
      {[
        { key: 'configs' as const, label: 'Configuration', icon: 'settings' },
        { key: 'analytics' as const, label: 'Analytics', icon: 'bar-chart' },
        { key: 'users' as const, label: 'User Mgmt', icon: 'people' },
      ].map((tab) => {
        const active = pageTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.pageTab,
              active && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
            onPress={() => setPageTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={16} color={active ? colors.tint : colors.icon} />
            <Text style={[styles.pageTabLabel, { color: active ? colors.tint : colors.icon }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ==========================================
  // availableTypes for create modal and "Add New" button
  // ==========================================
  const existingTypes = new Set(gameConfigs.map((c) => c.gameType));
  const availableTypes = (
    ['spin_wheel', 'memory_match', 'coin_hunt', 'guess_price', 'quiz', 'scratch_card'] as GameType[]
  ).filter((t) => !existingTypes.has(t));

  // ==========================================
  // MAIN RENDER
  // ==========================================
  // ==========================================
  // Main Return
  // ==========================================

  if (loading && gameConfigs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderPageTabs()}

      {pageTab === 'configs' && (
        <>
          {renderStats()}
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.tint}
              />
            }
          >
            {gameConfigs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="game-controller-outline" size={56} color={colors.icon} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No game configs</Text>
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  Tap "Seed Defaults" to create configs for all 6 game types
                </Text>
              </View>
            ) : (
              gameConfigs.map((config) => (
                <GameCard
                  key={config._id}
                  config={config}
                  colors={colors}
                  onToggle={handleToggle}
                  onToggleFeatured={handleToggleFeatured}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}

            {/* Create new button (if fewer than 6 exist) */}
            {availableTypes.length > 0 && (
              <TouchableOpacity
                style={[styles.createNewBtn, { borderColor: colors.tint }]}
                onPress={() => {
                  setCreateForm({ ...DEFAULT_FORM, gameType: availableTypes[0] });
                  setShowCreateModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color={colors.tint} />
                <Text style={[styles.createNewBtnText, { color: colors.tint }]}>
                  Add New Game Config ({availableTypes.length} available)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </>
      )}

      {pageTab === 'analytics' && (
        <AnalyticsTab
          analyticsData={analyticsData}
          analyticsLoading={analyticsLoading}
          analyticsDays={analyticsDays}
          colors={colors}
          onRefresh={loadAnalytics}
          onChangeDays={setAnalyticsDays}
        />
      )}
      {pageTab === 'users' && (
        <UserManagementTab
          userIdInput={userIdInput}
          setUserIdInput={setUserIdInput}
          userData={userData}
          userLoading={userLoading}
          coinAmount={coinAmount}
          setCoinAmount={setCoinAmount}
          coinReason={coinReason}
          setCoinReason={setCoinReason}
          showBanModal={showBanModal}
          banReason={banReason}
          colors={colors}
          onSearch={handleLookupUser}
          onBan={handleBanUser}
          onUnban={handleUnbanUser}
          onCreditCoins={handleCreditCoins}
          onRevokeCoins={handleRevokeCoins}
          onCloseBanModal={() => {
            setShowBanModal(false);
            setBanReason('');
          }}
          onSetBanReason={setBanReason}
          onConfirmBan={handleConfirmBan}
        />
      )}

      <EditModal
        visible={showModal}
        editingConfig={editingConfig}
        colors={colors}
        onClose={() => {
          setShowModal(false);
          setEditingConfig(null);
        }}
        onSave={handleSave}
        isSaving={isSaving}
        form={form}
        setForm={setForm}
        activeFormTab={activeFormTab}
        setActiveFormTab={setActiveFormTab}
      />
      <CreateModal
        visible={showCreateModal}
        existingTypes={existingTypes}
        colors={colors}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ ...DEFAULT_FORM });
        }}
        onCreate={handleCreate}
        isSaving={isSaving}
        form={createForm}
        setForm={setCreateForm}
      />

      {/* Ban Reason Modal */}
      <Modal visible={showBanModal} transparent animationType="slide">
        <View style={styles.banModalOverlay}>
          <View style={[styles.banModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.banModalTitle, { color: colors.text }]}>
              Ban {userData?.user?.fullName || userData?.user?._id || 'User'}
            </Text>
            <Text style={[styles.banModalSubtitle, { color: colors.icon }]}>
              This will ban the user from all games. Please provide a reason.
            </Text>
            <TextInput
              style={[styles.banReasonInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter ban reason..."
              placeholderTextColor={colors.icon}
              value={banReason}
              onChangeText={setBanReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.banModalButtons}>
              <TouchableOpacity
                style={[styles.banModalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
              >
                <Text style={[styles.banModalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.banModalButton, { backgroundColor: colors.error }]}
                onPress={handleConfirmBan}
              >
                <Text style={[styles.banModalButtonText, { color: colors.card }]}>Ban User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  seedBtnText: {
    color: Colors.light.card,
    fontWeight: '600',
    fontSize: 13,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Card
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  gameTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  gameTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuredBtn: {
    padding: 4,
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },

  // Info chips
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Create new button
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  createNewBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveBtnText: {
    color: Colors.light.card,
    fontWeight: '600',
    fontSize: 14,
  },

  // Form Tabs
  formTabsScroll: {
    maxHeight: 48,
    borderBottomWidth: 0,
  },
  formTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  formTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  formTabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Form
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  formLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  formHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  formInputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  jsonTextArea: {
    minHeight: 200,
    textAlignVertical: 'top',
    fontSize: 12,
    lineHeight: 18,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },

  // Difficulty
  difficultySection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },

  // Schedule
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  schedulePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  schedulePreviewText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Reward Preview
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  rewardPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
  },

  // Game Type Grid (Create modal)
  gameTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameTypeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  gameTypeOptionEmoji: {
    fontSize: 22,
  },
  gameTypeOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Page-level tabs
  pageTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  pageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 4,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  pageTabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  banModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  banModalContent: {
    borderRadius: 16,
    padding: 20,
  },
  banModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  banModalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  banReasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  banModalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  banModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  banModalButtonText: {
    fontWeight: '600',
  },
});
