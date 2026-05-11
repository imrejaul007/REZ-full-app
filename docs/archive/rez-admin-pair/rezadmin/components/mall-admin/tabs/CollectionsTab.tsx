/**
 * components/mall-admin/tabs/CollectionsTab.tsx
 * ADM-005: Mall collections tab.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MallCollection } from '../../../services/api/mall';
import { Colors } from '../../../constants/Colors';

type ColorsType = typeof Colors.light;

interface Props {
  colors: ColorsType;
  collections: MallCollection[];
  loading: boolean;
  processingId: string | null;
  onRefresh: () => void;
  onEdit: (collection: MallCollection) => void;
  onDelete: (collection: MallCollection) => void;
  onToggleActive: (collection: MallCollection) => void;
}

export function CollectionsTab({ colors, collections, loading, processingId, onRefresh, onEdit, onDelete, onToggleActive }: Props) {
  const renderItem = ({ item }: { item: MallCollection }) => {
    const isProcessing = processingId === item._id;
    return (
      <View style={[card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={cardRow}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={colThumb} />
          ) : (
            <View style={[colThumb, { backgroundColor: colors.tint + '30' }]}>
              <Ionicons name="albums" size={20} color={colors.tint} />
            </View>
          )}
          <View style={colInfo}>
            <Text style={[colName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[colMeta, { color: colors.icon }]}>{item.type} · {item.brandCount} brands</Text>
            <View style={[typeChip, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[typeChipText, { color: colors.tint }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>
        <View style={cardActions}>
          <TouchableOpacity style={[toggleBtn, { backgroundColor: item.isActive ? colors.tint + '20' : colors.border + '80' }]} onPress={() => onToggleActive(item)} disabled={isProcessing}>
            <Ionicons name={item.isActive ? 'pause' : 'play'} size={14} color={item.isActive ? colors.tint : colors.icon} />
          </TouchableOpacity>
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
        <FlatList data={collections} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 12, gap: 10 }} refreshing={loading} onRefresh={onRefresh}
          ListEmptyComponent={<Text style={[emptyText, { color: colors.icon }]}>No collections yet</Text>} />
      )}
    </View>
  );
}

const container = StyleSheet.create({ flex: 1 } as any);
const card = StyleSheet.create({ padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 } as any);
const cardRow = StyleSheet.create({ flexDirection: 'row', gap: 12, marginBottom: 10 } as any);
const colThumb = StyleSheet.create({ width: 64, height: 64, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const colInfo = StyleSheet.create({ flex: 1, justifyContent: 'center' } as any);
const colName = StyleSheet.create({ fontSize: 15, fontWeight: '600' } as any);
const colMeta = StyleSheet.create({ fontSize: 12, marginTop: 2 } as any);
const typeChip = StyleSheet.create({ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4 } as any);
const typeChipText = StyleSheet.create({ fontSize: 11, fontWeight: '600' } as any);
const cardActions = StyleSheet.create({ flexDirection: 'row', gap: 6 } as any);
const toggleBtn = StyleSheet.create({ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const actionBtn = StyleSheet.create({ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const emptyText = StyleSheet.create({ textAlign: 'center', marginTop: 40, fontSize: 14 } as any);
