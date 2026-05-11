/**
 * components/mall-admin/tabs/CategoriesTab.tsx
 * ADM-005: Mall categories tab.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MallCategory } from '../../../services/api/mall';
import { Colors } from '../../../constants/Colors';

type ColorsType = typeof Colors.light;

interface Props {
  colors: ColorsType;
  categories: MallCategory[];
  loading: boolean;
  processingId: string | null;
  onRefresh: () => void;
  onEdit: (category: MallCategory) => void;
  onDelete: (category: MallCategory) => void;
}

export function CategoriesTab({ colors, categories, loading, processingId, onRefresh, onEdit, onDelete }: Props) {
  const renderItem = ({ item }: { item: MallCategory }) => {
    const isProcessing = processingId === item._id;
    return (
      <View style={[card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={cardLeft}>
          {item.icon ? <Text style={catIcon}>{item.icon}</Text> : null}
          <View style={catInfo}>
            <Text style={[catName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[catMeta, { color: colors.icon }]}>{item.brandCount ?? 0} brands · {item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <View style={cardActions}>
          <TouchableOpacity style={actionBtn} onPress={() => onEdit(item)} disabled={isProcessing}>
            <Ionicons name="pencil" size={16} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={actionBtn} onPress={() => onDelete(item)} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator size="small" /> : <Ionicons name="trash" size={16} color="#ef4444" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[container, { backgroundColor: colors.background }]}>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList data={categories} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 12, gap: 8 }} refreshing={loading} onRefresh={onRefresh}
          ListEmptyComponent={<Text style={[emptyText, { color: colors.icon }]}>No categories yet</Text>} />
      )}
    </View>
  );
}

const container = StyleSheet.create({ flex: 1 } as any);
const card = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 } as any);
const cardLeft = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 } as any);
const catIcon = StyleSheet.create({ fontSize: 28 } as any);
const catInfo = StyleSheet.create({ flex: 1 } as any);
const catName = StyleSheet.create({ fontSize: 15, fontWeight: '600' } as any);
const catMeta = StyleSheet.create({ fontSize: 12, marginTop: 2 } as any);
const cardActions = StyleSheet.create({ flexDirection: 'row', gap: 6 } as any);
const actionBtn = StyleSheet.create({ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const emptyText = StyleSheet.create({ textAlign: 'center', marginTop: 40, fontSize: 14 } as any);
