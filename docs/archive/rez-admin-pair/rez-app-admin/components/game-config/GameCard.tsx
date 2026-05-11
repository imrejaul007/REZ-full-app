import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameConfigItem } from '../../services/api/gameConfig';
import { Colors } from '../../constants/Colors';

interface GameCardProps {
  config: GameConfigItem;
  colors: Record<string, string>;
  onToggle: (config: GameConfigItem) => void;
  onToggleFeatured: (config: GameConfigItem) => void;
  onEdit: (config: GameConfigItem) => void;
  onDelete: (config: GameConfigItem) => void;
}

const GAME_TYPE_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  spin_wheel: { label: 'Spin Wheel', emoji: '\uD83C\uDFB0', color: Colors.light.error },
  memory_match: { label: 'Memory Match', emoji: '\uD83E\uDDE0', color: Colors.light.purple },
  coin_hunt: { label: 'Coin Hunt', emoji: '\uD83E\uDE99', color: Colors.light.warning },
  guess_price: { label: 'Guess the Price', emoji: '\uD83D\uDCB0', color: Colors.light.success },
  quiz: { label: 'Quiz', emoji: '\uD83D\uDCDD', color: Colors.light.info },
  scratch_card: { label: 'Scratch Card', emoji: '\uD83C\uDFAB', color: Colors.light.pink },
};

export default function GameCard({
  config,
  colors,
  onToggle,
  onToggleFeatured,
  onEdit,
  onDelete,
}: GameCardProps) {
  const gameInfo = GAME_TYPE_DISPLAY[config.gameType] || {
    label: config.gameType,
    emoji: '\uD83C\uDFAE',
    color: colors.mutedDark,
  };

  return (
    <View
      style={[
        cardStyles.card,
        { backgroundColor: colors.card },
        {
          borderLeftWidth: 4,
          borderLeftColor: config.isEnabled ? colors.success : colors.slateMedium,
        },
      ]}
    >
      {/* Card Header */}
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.cardTitleRow}>
          <Text style={cardStyles.cardEmoji}>{gameInfo.emoji}</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[cardStyles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {config.displayName}
            </Text>
            <View style={[cardStyles.gameTypeBadge, { backgroundColor: `${gameInfo.color}15` }]}>
              <Text style={[cardStyles.gameTypeText, { color: gameInfo.color }]}>
                {config.gameType}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => onToggleFeatured(config)} style={cardStyles.featuredBtn}>
          <Ionicons
            name={config.featured ? 'star' : 'star-outline'}
            size={22}
            color={config.featured ? colors.warning : colors.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <Text style={[cardStyles.cardDescription, { color: colors.icon }]} numberOfLines={2}>
        {config.description}
      </Text>

      {/* Info chips */}
      <View style={cardStyles.infoRow}>
        <View style={[cardStyles.infoChip, { backgroundColor: colors.background }]}>
          <Ionicons name="repeat" size={12} color={colors.icon} />
          <Text style={[cardStyles.infoChipText, { color: colors.icon }]}>
            {config.dailyLimit}/day
          </Text>
        </View>
        {config.cooldownMinutes > 0 && (
          <View style={[cardStyles.infoChip, { backgroundColor: colors.background }]}>
            <Ionicons name="time" size={12} color={colors.icon} />
            <Text style={[cardStyles.infoChipText, { color: colors.icon }]}>
              {config.cooldownMinutes}min cooldown
            </Text>
          </View>
        )}
        <View style={[cardStyles.infoChip, { backgroundColor: `${colors.success}15` }]}>
          <Ionicons name="cash" size={12} color={colors.success} />
          <Text style={[cardStyles.infoChipText, { color: colors.success }]}>
            {config.rewards.minCoins}-{config.rewards.maxCoins} coins
          </Text>
        </View>
        {config.rewards.bonusMultiplier > 1 && (
          <View style={[cardStyles.infoChip, { backgroundColor: `${colors.warning}15` }]}>
            <Text style={[cardStyles.infoChipText, { color: colors.warning, fontWeight: '700' }]}>
              {config.rewards.bonusMultiplier}x bonus
            </Text>
          </View>
        )}
      </View>

      {/* Toggle + Actions Row */}
      <View style={[cardStyles.actionsRow, { borderTopColor: colors.border }]}>
        <View style={cardStyles.toggleRow}>
          <Text style={[cardStyles.toggleLabel, { color: colors.icon }]}>
            {config.isEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Switch
            value={config.isEnabled}
            onValueChange={() => onToggle(config)}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor={colors.card}
          />
        </View>

        <View style={cardStyles.actionBtns}>
          <TouchableOpacity
            style={[cardStyles.actionIconBtn, { backgroundColor: `${colors.info}10` }]}
            onPress={() => onEdit(config)}
          >
            <Ionicons name="pencil" size={16} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.actionIconBtn, { backgroundColor: `${colors.error}10` }]}
            onPress={() => onDelete(config)}
          >
            <Ionicons name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
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
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  gameTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  gameTypeText: { fontSize: 11, fontWeight: '600' },
  featuredBtn: { padding: 4 },
  cardDescription: { fontSize: 13, marginBottom: 10, lineHeight: 18 },
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
  infoChipText: { fontSize: 11, fontWeight: '500' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
