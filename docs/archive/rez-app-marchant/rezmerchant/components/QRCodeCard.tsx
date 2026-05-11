import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface QRCodeCardProps {
  url: string;
  label: string;
  size?: number;
}

export function QRCodeCard({ url, label, size = 140 }: QRCodeCardProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${label}: ${url}`,
        title: label,
        ...(Platform.OS === 'ios' ? { url } : {}),
      });
    } catch {
      // User cancelled or share failed — no-op
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.qrWrapper}>
        <QRCode value={url} size={size} color={Colors.light.navy} backgroundColor="#ffffff" />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={handleShare}
        activeOpacity={0.7}
        accessibilityLabel={`Share ${label}`}
        accessibilityRole="button"
      >
        <Ionicons name="share-outline" size={16} color={Colors.light.primary} />
        <Text style={styles.shareBtnText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textHeading,
    textAlign: 'center',
    marginBottom: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
