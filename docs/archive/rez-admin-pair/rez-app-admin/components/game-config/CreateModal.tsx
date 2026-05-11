import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GameConfigItem } from '../../services/api/gameConfig';
import { Colors } from '../../constants/Colors';

type GameType = 'spin_wheel' | 'memory_match' | 'coin_hunt' | 'guess_price' | 'quiz' | 'scratch_card';

interface FormData {
  gameType: GameType;
  displayName: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  dailyLimit: number;
  rewards: { minCoins: number; maxCoins: number; bonusMultiplier: number };
}

interface CreateModalProps {
  visible: boolean;
  existingTypes: Set<string>;
  colors: Record<string, string>;
  onClose: () => void;
  onCreate: () => Promise<void>;
  isSaving: boolean;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}

const GAME_TYPE_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  spin_wheel: { label: 'Spin Wheel', emoji: '\uD83C\uDFB0', color: Colors.light.error },
  memory_match: { label: 'Memory Match', emoji: '\uD83E\uDDE0', color: Colors.light.purple },
  coin_hunt: { label: 'Coin Hunt', emoji: '\uD83E\uDE99', color: Colors.light.warning },
  guess_price: { label: 'Guess the Price', emoji: '\uD83D\uDCB0', color: Colors.light.success },
  quiz: { label: 'Quiz', emoji: '\uD83D\uDCDD', color: Colors.light.info },
  scratch_card: { label: 'Scratch Card', emoji: '\uD83C\uDFAB', color: Colors.light.pink },
};

const ALL_GAME_TYPES: GameType[] = [
  'spin_wheel',
  'memory_match',
  'coin_hunt',
  'guess_price',
  'quiz',
  'scratch_card',
];

const ICON_MAP: Record<GameType, string> = {
  spin_wheel: 'color-filter',
  memory_match: 'grid',
  coin_hunt: 'search',
  guess_price: 'cash',
  quiz: 'help-circle',
  scratch_card: 'card',
};

export default function CreateModal({
  visible,
  existingTypes,
  colors,
  onClose,
  onCreate,
  isSaving,
  form,
  setForm,
}: CreateModalProps) {
  const availableTypes = ALL_GAME_TYPES.filter((t) => !existingTypes.has(t));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>New Game Config</Text>
          <TouchableOpacity
            onPress={onCreate}
            disabled={isSaving}
            style={[styles.modalSaveBtn, { backgroundColor: colors.tint }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <Text style={styles.modalSaveBtnText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
          {/* Game Type Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Game Type *</Text>
            <View style={styles.gameTypeGrid}>
              {availableTypes.map((type) => {
                const info = GAME_TYPE_DISPLAY[type];
                const isSelected = form.gameType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.gameTypeOption,
                      {
                        backgroundColor: isSelected ? `${info.color}20` : colors.background,
                        borderColor: isSelected ? info.color : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setForm((p) => ({
                        ...p,
                        gameType: type,
                        displayName: info.label,
                        icon: ICON_MAP[type],
                      }))
                    }
                  >
                    <Text style={styles.gameTypeOptionEmoji}>{info.emoji}</Text>
                    <Text
                      style={[
                        styles.gameTypeOptionLabel,
                        { color: isSelected ? info.color : colors.text },
                      ]}
                    >
                      {info.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Display Name *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={form.displayName}
              onChangeText={(text) => setForm((p) => ({ ...p, displayName: text }))}
              placeholder="Game name"
              placeholderTextColor={colors.icon}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={form.description}
              onChangeText={(text) => setForm((p) => ({ ...p, description: text }))}
              placeholder="Describe the game..."
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Icon</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={form.icon}
                onChangeText={(text) => setForm((p) => ({ ...p, icon: text }))}
                placeholder="game-controller"
                placeholderTextColor={colors.icon}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Daily Limit</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={String(form.dailyLimit)}
                onChangeText={(text) => setForm((p) => ({ ...p, dailyLimit: parseInt(text) || 0 }))}
                placeholder="3"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Min Coins</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={String(form.rewards.minCoins)}
                onChangeText={(text) => setForm((p) => ({ ...p, rewards: { ...p.rewards, minCoins: parseInt(text) || 0 } }))}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Max Coins</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={String(form.rewards.maxCoins)}
                onChangeText={(text) => setForm((p) => ({ ...p, rewards: { ...p.rewards, maxCoins: parseInt(text) || 0 } }))}
                placeholder="100"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
          </View>
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
  formScroll: { flex: 1 },
  formContent: { padding: 16, paddingBottom: 40 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', marginBottom: 0 },
  gameTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gameTypeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  gameTypeOptionEmoji: { fontSize: 22 },
  gameTypeOptionLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
});
