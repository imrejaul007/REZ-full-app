import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GameConfigItem } from '../../services/api/gameConfig';
import { Colors } from '../../constants/Colors';

type FormTab = 'basic' | 'rewards' | 'difficulty' | 'schedule' | 'advanced';

interface FormData {
  displayName: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  dailyLimit: number;
  cooldownMinutes: number;
  rewards: { minCoins: number; maxCoins: number; bonusMultiplier: number };
  difficulty: {
    easy: { timeLimit: number; gridSize?: number; lives?: number };
    medium: { timeLimit: number; gridSize?: number; lives?: number };
    hard: { timeLimit: number; gridSize?: number; lives?: number };
  };
  config: string;
  schedule: { availableDays: number[]; availableHoursStart?: number; availableHoursEnd?: number };
  sortOrder: number;
  featured: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EditModalProps {
  visible: boolean;
  editingConfig: GameConfigItem | null;
  colors: Record<string, string>;
  onClose: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  activeFormTab: FormTab;
  setActiveFormTab: (tab: FormTab) => void;
}

const FORM_TABS: { key: FormTab; label: string; icon: string }[] = [
  { key: 'basic', label: 'Basic', icon: 'information-circle' },
  { key: 'rewards', label: 'Rewards', icon: 'cash' },
  { key: 'difficulty', label: 'Difficulty', icon: 'speedometer' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar' },
  { key: 'advanced', label: 'Advanced', icon: 'code-slash' },
];

function DifficultyLevel({
  level,
  labelColor,
  form,
  setForm,
  colors,
}: {
  level: 'easy' | 'medium' | 'hard';
  labelColor: string;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  colors: Record<string, string>;
}) {
  const levelData = form.difficulty[level];
  return (
    <View style={[diffStyles.section, { borderColor: colors.border }]}>
      <Text style={[diffStyles.label, { color: labelColor }]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
      <View style={diffStyles.row}>
        {[
          { key: 'timeLimit', placeholder: '60', label: 'Time Limit (sec)' },
          { key: 'gridSize', placeholder: '-', label: 'Grid Size' },
          { key: 'lives', placeholder: '-', label: 'Lives' },
        ].map(({ key, placeholder, label: fieldLabel }) => (
          <View key={key} style={diffStyles.field}>
            <Text style={diffStyles.fieldLabel}>{fieldLabel}</Text>
            <TextInput
              style={[diffStyles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={
                key === 'timeLimit'
                  ? String(levelData.timeLimit || '')
                  : levelData[key as 'gridSize' | 'lives'] !== undefined
                    ? String(levelData[key as 'gridSize' | 'lives'])
                    : ''
              }
              onChangeText={(text) =>
                setForm((p) => ({
                  ...p,
                  difficulty: {
                    ...p.difficulty,
                    [level]: {
                      ...p.difficulty[level],
                      [key]:
                        key === 'timeLimit'
                          ? parseInt(text) || 0
                          : text
                            ? parseInt(text)
                            : undefined,
                    },
                  },
                }))
              }
              keyboardType="numeric"
              placeholder={placeholder}
              placeholderTextColor={colors.icon}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function EditModal({
  visible,
  editingConfig,
  colors,
  onClose,
  onSave,
  isSaving,
  form,
  setForm,
  activeFormTab,
  setActiveFormTab,
}: EditModalProps) {
  const renderFormContent = () => {
    switch (activeFormTab) {
      case 'basic':
        return (
          <View>
            <View style={formStyles.formGroup}>
              <Text style={[formStyles.formLabel, { color: colors.text }]}>Display Name *</Text>
              <TextInput
                style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={form.displayName}
                onChangeText={(text) => setForm((p) => ({ ...p, displayName: text }))}
                placeholder="e.g., Spin Wheel"
                placeholderTextColor={colors.icon}
              />
            </View>
            <View style={formStyles.formGroup}>
              <Text style={[formStyles.formLabel, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[formStyles.formInput, formStyles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={form.description}
                onChangeText={(text) => setForm((p) => ({ ...p, description: text }))}
                placeholder="Describe the game..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={formStyles.formRow}>
              <View style={[formStyles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Icon (Ionicons name)</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={form.icon}
                  onChangeText={(text) => setForm((p) => ({ ...p, icon: text }))}
                  placeholder="game-controller"
                  placeholderTextColor={colors.icon}
                />
              </View>
              <View style={[formStyles.formGroup, { flex: 1 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Sort Order</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={String(form.sortOrder)}
                  onChangeText={(text) => setForm((p) => ({ ...p, sortOrder: parseInt(text) || 0 }))}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={formStyles.formRow}>
              <View style={[formStyles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Daily Limit</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={String(form.dailyLimit)}
                  onChangeText={(text) => setForm((p) => ({ ...p, dailyLimit: parseInt(text) || 0 }))}
                  placeholder="3"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
              <View style={[formStyles.formGroup, { flex: 1 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Cooldown (min)</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={String(form.cooldownMinutes)}
                  onChangeText={(text) => setForm((p) => ({ ...p, cooldownMinutes: parseInt(text) || 0 }))}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        );

      case 'rewards':
        return (
          <View>
            <View style={formStyles.formRow}>
              <View style={[formStyles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Min Coins</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={String(form.rewards.minCoins)}
                  onChangeText={(text) => setForm((p) => ({ ...p, rewards: { ...p.rewards, minCoins: parseInt(text) || 0 } }))}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
              <View style={[formStyles.formGroup, { flex: 1 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Max Coins</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={String(form.rewards.maxCoins)}
                  onChangeText={(text) => setForm((p) => ({ ...p, rewards: { ...p.rewards, maxCoins: parseInt(text) || 0 } }))}
                  placeholder="100"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={formStyles.formGroup}>
              <Text style={[formStyles.formLabel, { color: colors.text }]}>Bonus Multiplier</Text>
              <TextInput
                style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={String(form.rewards.bonusMultiplier)}
                onChangeText={(text) => setForm((p) => ({ ...p, rewards: { ...p.rewards, bonusMultiplier: parseFloat(text) || 1 } }))}
                placeholder="1"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
            <View style={[formStyles.rewardPreview, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="cash" size={20} color={colors.success} />
              <Text style={formStyles.rewardPreviewText}>
                Reward range: {form.rewards.minCoins} - {form.rewards.maxCoins} coins
                {form.rewards.bonusMultiplier > 1 ? ` (${form.rewards.bonusMultiplier}x multiplier)` : ''}
              </Text>
            </View>
          </View>
        );

      case 'difficulty':
        return (
          <View>
            <DifficultyLevel level="easy" labelColor={colors.success} form={form} setForm={setForm} colors={colors} />
            <DifficultyLevel level="medium" labelColor={colors.warning} form={form} setForm={setForm} colors={colors} />
            <DifficultyLevel level="hard" labelColor={colors.error} form={form} setForm={setForm} colors={colors} />
          </View>
        );

      case 'schedule':
        return (
          <View>
            <View style={formStyles.formGroup}>
              <Text style={[formStyles.formLabel, { color: colors.text }]}>Available Days</Text>
              <Text style={[formStyles.formHint, { color: colors.icon }]}>
                Select which days this game is available. Leave all unchecked for every day.
              </Text>
              <View style={formStyles.daysRow}>
                {DAY_NAMES.map((day, index) => {
                  const isSelected = form.schedule.availableDays.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        formStyles.dayChip,
                        {
                          backgroundColor: isSelected ? colors.tint : colors.background,
                          borderColor: isSelected ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setForm((p) => {
                          const days = [...p.schedule.availableDays];
                          if (isSelected) {
                            return { ...p, schedule: { ...p.schedule, availableDays: days.filter((d) => d !== index) } };
                          } else {
                            days.push(index);
                            days.sort();
                            return { ...p, schedule: { ...p.schedule, availableDays: days } };
                          }
                        });
                      }}
                    >
                      <Text style={[formStyles.dayChipText, { color: isSelected ? colors.card : colors.icon }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={formStyles.formRow}>
              <View style={[formStyles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Available From (hour)</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={form.schedule.availableHoursStart !== undefined ? String(form.schedule.availableHoursStart) : ''}
                  onChangeText={(text) => setForm((p) => ({ ...p, schedule: { ...p.schedule, availableHoursStart: text ? parseInt(text) : undefined } }))}
                  placeholder="e.g., 9"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
              <View style={[formStyles.formGroup, { flex: 1 }]}>
                <Text style={[formStyles.formLabel, { color: colors.text }]}>Available Until (hour)</Text>
                <TextInput
                  style={[formStyles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={form.schedule.availableHoursEnd !== undefined ? String(form.schedule.availableHoursEnd) : ''}
                  onChangeText={(text) => setForm((p) => ({ ...p, schedule: { ...p.schedule, availableHoursEnd: text ? parseInt(text) : undefined } }))}
                  placeholder="e.g., 21"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {form.schedule.availableHoursStart !== undefined && form.schedule.availableHoursEnd !== undefined && (
              <View style={[formStyles.schedulePreview, { backgroundColor: `${colors.tint}15` }]}>
                <Ionicons name="time" size={16} color={colors.tint} />
                <Text style={[formStyles.schedulePreviewText, { color: colors.tint }]}>
                  Available {form.schedule.availableHoursStart}:00 - {form.schedule.availableHoursEnd}:00
                </Text>
              </View>
            )}
          </View>
        );

      case 'advanced':
        return (
          <View>
            <View style={formStyles.formGroup}>
              <Text style={[formStyles.formLabel, { color: colors.text }]}>Game-Specific Config (JSON)</Text>
              <Text style={[formStyles.formHint, { color: colors.icon }]}>
                Spin wheel segments, quiz categories, scratch card prizes, etc.
              </Text>
              <TextInput
                style={[
                  formStyles.formInput,
                  formStyles.jsonTextArea,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: 'monospace' },
                ]}
                value={form.config}
                onChangeText={(text) => setForm((p) => ({ ...p, config: text }))}
                placeholder="{}"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Edit {editingConfig?.displayName || 'Game Config'}
          </Text>
          <TouchableOpacity
            onPress={onSave}
            disabled={isSaving}
            style={[styles.modalSaveBtn, { backgroundColor: colors.tint }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <Text style={styles.modalSaveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formTabsScroll}>
          <View style={styles.formTabsRow}>
            {FORM_TABS.map((tab) => {
              const isActive = activeFormTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.formTab,
                    { backgroundColor: isActive ? colors.tint : colors.background, borderColor: isActive ? colors.tint : colors.border },
                  ]}
                  onPress={() => setActiveFormTab(tab.key)}
                >
                  <Ionicons name={tab.icon as any} size={14} color={isActive ? colors.card : colors.icon} />
                  <Text style={[styles.formTabLabel, { color: isActive ? colors.card : colors.icon }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
          {renderFormContent()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  modalSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  modalSaveBtnText: { color: Colors.light.card, fontWeight: '600', fontSize: 14 },
  formTabsScroll: { maxHeight: 48 },
  formTabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  formTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  formTabLabel: { fontSize: 12, fontWeight: '600' },
  formScroll: { flex: 1 },
  formContent: { padding: 16, paddingBottom: 40 },
});

const formStyles = StyleSheet.create({
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  formHint: { fontSize: 12, marginBottom: 8 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  jsonTextArea: { minHeight: 200, textAlignVertical: 'top', fontSize: 12, lineHeight: 18 },
  formRow: { flexDirection: 'row', marginBottom: 0 },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  dayChipText: { fontSize: 13, fontWeight: '600' },
  schedulePreview: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, gap: 8, marginTop: 8 },
  schedulePreviewText: { fontSize: 13, fontWeight: '500' },
  rewardPreview: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8 },
  rewardPreviewText: { fontSize: 14, fontWeight: '600', color: Colors.light.success },
});

const diffStyles = StyleSheet.create({
  section: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.light.mutedDark, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
});
