import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  useColorScheme,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { apiClient } from '../../services/api/apiClient';

interface Campaign {
  _id: string;
  title: string;
  subtitle: string;
  type: 'mission_sprint' | 'festival' | 'category_push';
  targetCity?: string;
  targetCategory?: string;
  startDate: string;
  endDate: string;
  targetTrialCount: number;
  participants: number;
  completions: number;
  status: 'active' | 'upcoming' | 'ended';
  rewardCoins: number;
  trialCoins: number;
}

type FilterType = 'all' | 'active' | 'upcoming' | 'ended';

export default function CampaignManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    type: 'mission_sprint' as 'mission_sprint' | 'festival' | 'category_push',
    targetCategory: '',
    targetCity: '',
    targetTrialCount: '10',
    rewardCoins: '100',
    trialCoins: '50',
    bonusBadgeName: '',
    startDate: '',
    endDate: '',
  });

  // Load campaigns from API
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/campaigns');
      setCampaigns((response.data as any)?.campaigns || response.data || []);
    } catch (err: any) {
      logger.error('Failed to load campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCampaigns();
    } finally {
      setRefreshing(false);
    }
  }, [loadCampaigns]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const resetFormData = () => {
    setFormData({
      title: '',
      subtitle: '',
      type: 'mission_sprint',
      targetCategory: '',
      targetCity: '',
      targetTrialCount: '10',
      rewardCoins: '100',
      trialCoins: '50',
      bonusBadgeName: '',
      startDate: '',
      endDate: '',
    });
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      subtitle: campaign.subtitle,
      type: campaign.type,
      targetCategory: campaign.targetCategory || '',
      targetCity: campaign.targetCity || '',
      targetTrialCount: String(campaign.targetTrialCount),
      rewardCoins: String(campaign.rewardCoins),
      trialCoins: String(campaign.trialCoins),
      bonusBadgeName: '',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    });
    setShowCreateModal(true);
  };

  const handleSaveCampaign = async () => {
    if (!formData.title.trim()) {
      showAlert('Validation Error', 'Please enter campaign title');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      showAlert('Validation Error', 'Please enter start and end dates');
      return;
    }

    setIsSubmitting(true);
    try {
      const campaignData = {
        title: formData.title,
        subtitle: formData.subtitle,
        type: formData.type,
        targetCity: formData.targetCity,
        targetCategory: formData.targetCategory,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetTrialCount: parseInt(formData.targetTrialCount) || 10,
        rewardCoins: parseInt(formData.rewardCoins) || 100,
        trialCoins: parseInt(formData.trialCoins) || 50,
        bonusBadgeName: formData.bonusBadgeName,
      };

      if (editingCampaign) {
        await apiClient.put(`/admin/campaigns/${editingCampaign._id}`, campaignData);
      } else {
        await apiClient.post('/admin/campaigns', campaignData);
      }

      await loadCampaigns();
      setShowCreateModal(false);
      setEditingCampaign(null);
      resetFormData();
      showAlert(
        'Success',
        editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully'
      );
    } catch (err: any) {
      showAlert(
        'Error',
        err.message || (editingCampaign ? 'Failed to update campaign' : 'Failed to create campaign')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'mission_sprint':
        return 'Mission Sprint';
      case 'festival':
        return 'Festival';
      case 'category_push':
        return 'Category Push';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string): { bg: string; text: string } => {
    switch (status) {
      case 'active':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'upcoming':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'ended':
        return { bg: '#E5E7EB', text: '#6B7280' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const renderCampaign = ({ item }: { item: Campaign }) => {
    const completion =
      item.participants > 0 ? Math.round((item.completions / item.participants) * 100) : 0;
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: item.type === 'festival' ? '#FDF4FF' : '#F0FDF4' },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: item.type === 'festival' ? '#8B5CF6' : '#16A34A' },
                ]}
              >
                {getTypeLabel(item.type)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: colors.icon }]}>{item.subtitle}</Text>

        <View style={styles.location}>
          <Ionicons name="location-outline" size={14} color={colors.icon} />
          <Text style={[styles.locationText, { color: colors.icon }]}>
            {item.targetCity && item.targetCategory
              ? `${item.targetCity} • ${item.targetCategory}`
              : item.targetCity || item.targetCategory || 'All Cities'}
          </Text>
        </View>

        <Text style={[styles.dateText, { color: colors.icon }]}>
          {item.startDate} – {item.endDate}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Participants</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.participants}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Completions</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.completions}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Completion %</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{completion}%</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editButton, { borderColor: colors.tint }]}
          activeOpacity={0.6}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.tint} />
          <Text style={[styles.editButtonText, { color: colors.tint }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#8B5CF6', '#A78BFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Discovery Campaigns</Text>
          </View>
        </LinearGradient>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Discovery Campaigns</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              setEditingCampaign(null);
              resetFormData();
              setShowCreateModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
        {(['all', 'active', 'upcoming', 'ended'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && [styles.filterTabActive, { borderBottomColor: '#8B5CF6' }],
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && { color: '#8B5CF6', fontWeight: '600' },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Campaigns</Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {filter === 'all' ? 'Create your first campaign' : `No ${filter} campaigns found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCampaigns}
          renderItem={renderCampaign}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Create Campaign Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingCampaign(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Title *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Campaign title"
                  placeholderTextColor={colors.icon}
                  value={formData.title}
                  onChangeText={(v) => setFormData({ ...formData, title: v })}
                />
              </View>

              {/* Subtitle */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Subtitle (reward description)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.textArea,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="e.g., Try 3 salons, win 500 coins"
                  placeholderTextColor={colors.icon}
                  value={formData.subtitle}
                  onChangeText={(v) => setFormData({ ...formData, subtitle: v })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Type */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Type *</Text>
                <View style={styles.typeSelector}>
                  {(['mission_sprint', 'festival', 'category_push'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeOption,
                        formData.type === t && styles.typeOptionActive,
                        { borderColor: formData.type === t ? '#8B5CF6' : colors.border },
                      ]}
                      onPress={() => setFormData({ ...formData, type: t })}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          formData.type === t && { color: '#8B5CF6' },
                          { color: colors.text },
                        ]}
                      >
                        {getTypeLabel(t)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target Category */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Target Category</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Salon & Spa"
                  placeholderTextColor={colors.icon}
                  value={formData.targetCategory}
                  onChangeText={(v) => setFormData({ ...formData, targetCategory: v })}
                />
              </View>

              {/* Target City */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Target City</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Mumbai"
                  placeholderTextColor={colors.icon}
                  value={formData.targetCity}
                  onChangeText={(v) => setFormData({ ...formData, targetCity: v })}
                />
              </View>

              {/* Target Trial Count */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Target Trial Count</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="10"
                  placeholderTextColor={colors.icon}
                  value={formData.targetTrialCount}
                  onChangeText={(v) => setFormData({ ...formData, targetTrialCount: v })}
                  keyboardType="number-pad"
                />
              </View>

              {/* Reward Coins */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Reward ReZ Coins</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="100"
                  placeholderTextColor={colors.icon}
                  value={formData.rewardCoins}
                  onChangeText={(v) => setFormData({ ...formData, rewardCoins: v })}
                  keyboardType="number-pad"
                />
              </View>

              {/* Trial Coins */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Reward Trial Coins</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="50"
                  placeholderTextColor={colors.icon}
                  value={formData.trialCoins}
                  onChangeText={(v) => setFormData({ ...formData, trialCoins: v })}
                  keyboardType="number-pad"
                />
              </View>

              {/* Bonus Badge */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Bonus Badge Name (optional)
                </Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Beauty Expert"
                  placeholderTextColor={colors.icon}
                  value={formData.bonusBadgeName}
                  onChangeText={(v) => setFormData({ ...formData, bonusBadgeName: v })}
                />
              </View>

              {/* Start Date */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Start Date *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.icon}
                  value={formData.startDate}
                  onChangeText={(v) => setFormData({ ...formData, startDate: v })}
                />
              </View>

              {/* End Date */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>End Date *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.icon}
                  value={formData.endDate}
                  onChangeText={(v) => setFormData({ ...formData, endDate: v })}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingCampaign(null);
                }}
                disabled={isSubmitting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveCampaign}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>
                    {editingCampaign ? 'Save' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (RNStatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtonPrimary: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
