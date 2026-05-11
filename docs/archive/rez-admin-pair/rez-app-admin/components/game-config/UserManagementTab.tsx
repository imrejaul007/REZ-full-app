import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameConfigItem } from '../../services/api/gameConfig';
import { Colors } from '../../constants/Colors';

type GameType = 'spin_wheel' | 'memory_match' | 'coin_hunt' | 'guess_price' | 'quiz' | 'scratch_card';

const GAME_TYPE_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  spin_wheel: { label: 'Spin Wheel', emoji: '\uD83C\uDFB0', color: Colors.light.error },
  memory_match: { label: 'Memory Match', emoji: '\uD83E\uDDE0', color: Colors.light.purple },
  coin_hunt: { label: 'Coin Hunt', emoji: '\uD83E\uDE99', color: Colors.light.warning },
  guess_price: { label: 'Guess the Price', emoji: '\uD83D\uDCB0', color: Colors.light.success },
  quiz: { label: 'Quiz', emoji: '\uD83D\uDCDD', color: Colors.light.info },
  scratch_card: { label: 'Scratch Card', emoji: '\uD83C\uDFAB', color: Colors.light.pink },
};

interface UserManagementTabProps {
  userIdInput: string;
  setUserIdInput: (v: string) => void;
  userData: any;
  userLoading: boolean;
  coinAmount: string;
  setCoinAmount: (v: string) => void;
  coinReason: string;
  setCoinReason: (v: string) => void;
  showBanModal: boolean;
  banReason: string;
  colors: Record<string, string>;
  onSearch: () => void;
  onBan: () => void;
  onUnban: () => void;
  onCreditCoins: () => void;
  onRevokeCoins: () => void;
  onCloseBanModal: () => void;
  onSetBanReason: (v: string) => void;
  onConfirmBan: () => void;
}

export default function UserManagementTab({
  userIdInput,
  setUserIdInput,
  userData,
  userLoading,
  coinAmount,
  setCoinAmount,
  coinReason,
  setCoinReason,
  showBanModal,
  banReason,
  colors,
  onSearch,
  onBan,
  onUnban,
  onCreditCoins,
  onRevokeCoins,
  onCloseBanModal,
  onSetBanReason,
  onConfirmBan,
}: UserManagementTabProps) {
  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {/* User lookup */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 12 }]}>
          User Lookup
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[
              styles.formInput,
              { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            value={userIdInput}
            onChangeText={setUserIdInput}
            placeholder="Enter User ID"
            placeholderTextColor={colors.icon}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.seedBtn, { backgroundColor: colors.tint }]}
            onPress={onSearch}
            disabled={userLoading}
          >
            {userLoading ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <>
                <Ionicons name="search" size={16} color={colors.card} />
                <Text style={styles.seedBtnText}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* User details */}
      {userData?.user && (
        <>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.userHeader}>
              <View>
                <Text style={styles.userName}>
                  {userData.user.fullName || 'No Name'}
                </Text>
                <Text style={styles.userSub}>
                  {userData.user.phoneNumber || userData.user.username || userData.user._id}
                </Text>
              </View>
              {userData.user.gameBanned ? (
                <TouchableOpacity
                  style={[styles.seedBtn, { backgroundColor: colors.success }]}
                  onPress={onUnban}
                >
                  <Ionicons name="lock-open" size={14} color={colors.card} />
                  <Text style={styles.seedBtnText}>Unban</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.seedBtn, { backgroundColor: colors.error }]}
                  onPress={onBan}
                >
                  <Ionicons name="ban" size={14} color={colors.card} />
                  <Text style={styles.seedBtnText}>Ban</Text>
                </TouchableOpacity>
              )}
            </View>
            {userData.user.gameBanned && (
              <View style={[styles.banBanner, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.banBannerText, { color: colors.error }]}>
                  Banned: {userData.user.gameBanReason || 'No reason given'}
                </Text>
              </View>
            )}
          </View>

          {/* Manual coin operations */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 12 }]}>
              Coin Operations
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    flex: 1,
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={coinAmount}
                onChangeText={setCoinAmount}
                placeholder="Amount"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.formInput,
                  {
                    flex: 2,
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={coinReason}
                onChangeText={setCoinReason}
                placeholder="Reason"
                placeholderTextColor={colors.icon}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.seedBtn, { backgroundColor: colors.success, flex: 1, justifyContent: 'center' }]}
                onPress={onCreditCoins}
              >
                <Ionicons name="add-circle" size={14} color={colors.card} />
                <Text style={styles.seedBtnText}>Credit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.seedBtn, { backgroundColor: colors.error, flex: 1, justifyContent: 'center' }]}
                onPress={onRevokeCoins}
              >
                <Ionicons name="remove-circle" size={14} color={colors.card} />
                <Text style={styles.seedBtnText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Game history */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Games ({userData.total || 0})
          </Text>
          {(userData.sessions || []).slice(0, 20).map((s: any, i: number) => {
            const info = GAME_TYPE_DISPLAY[s.gameType as string] || {
              label: s.gameType,
              emoji: '🎮',
              color: colors.mutedDark,
            };
            return (
              <View
                key={i}
                style={[styles.card, { backgroundColor: colors.card, paddingVertical: 10, paddingHorizontal: 14 }]}
              >
                <View style={styles.gameHistoryRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 18 }}>{info.emoji}</Text>
                    <View>
                      <Text style={styles.gameHistoryName}>{info.label}</Text>
                      <Text style={styles.gameHistoryDate}>
                        {new Date(s.createdAt).toLocaleDateString()} · {s.status}
                      </Text>
                    </View>
                  </View>
                  {s.result?.prize?.type === 'coins' && (
                    <Text style={styles.gameHistoryCoins}>
                      +{s.result.prize.value}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
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
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  userSub: { fontSize: 13, color: Colors.light.icon },
  banBanner: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  banBannerText: { fontWeight: '600', fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  gameHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameHistoryName: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  gameHistoryDate: { fontSize: 11, color: Colors.light.icon },
  gameHistoryCoins: { fontSize: 14, fontWeight: '700', color: Colors.light.success },
});
