import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useLocationStore } from '@/store';

const { width, height } = Dimensions.get('window');

const MAP_LAYERS = [
  { id: 'crowd', label: 'Crowd', icon: 'people', color: COLORS.heatmapHigh },
  { id: 'events', label: 'Events', icon: 'calendar', color: COLORS.accent },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'nightlife', label: 'Nightlife', icon: 'moon', color: '#9B59B6' },
  { id: 'safety', label: 'Safety', icon: 'shield-checkmark', color: COLORS.success },
  { id: 'offers', label: 'Offers', icon: 'pricetag', color: COLORS.coinGold },
];

const MOCK_AREAS = [
  { id: '1', name: 'Koramangala', latitude: 12.9352, longitude: 77.6245, mood: 'busy' as const, crowdLevel: 4, trending: true, users: 127 },
  { id: '2', name: 'Indiranagar', latitude: 12.9716, longitude: 77.6403, mood: 'party' as const, crowdLevel: 5, trending: true, users: 89 },
  { id: '3', name: 'MG Road', latitude: 12.9759, longitude: 77.6056, mood: 'chill' as const, crowdLevel: 2, trending: false, users: 45 },
  { id: '4', name: 'HSR Layout', latitude: 12.9116, longitude: 77.6510, mood: 'family' as const, crowdLevel: 3, trending: false, users: 67 },
];

export default function VibeMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { currentLocation, setCurrentLocation, locationPermission } = useLocationStore();
  const [activeLayer, setActiveLayer] = useState('crowd');
  const [selectedArea, setSelectedArea] = useState<typeof MOCK_AREAS[0] | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'party': return '🔥';
      case 'busy': return '💃';
      case 'chill': return '😌';
      case 'family': return '👨‍👩‍👧';
      default: return '📍';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'party': return COLORS.accent;
      case 'busy': return COLORS.warning;
      case 'chill': return COLORS.success;
      case 'family': return COLORS.info;
      default: return COLORS.textMuted;
    }
  };

  const getHeatmapColor = (crowdLevel: number) => {
    if (crowdLevel <= 2) return COLORS.heatmapLow;
    if (crowdLevel <= 3) return COLORS.heatmapMedium;
    return COLORS.heatmapHigh;
  };

  const handleMarkerPress = (area: typeof MOCK_AREAS[0]) => {
    setSelectedArea(area);
    mapRef.current?.animateToRegion({
      latitude: area.latitude,
      longitude: area.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  };

  const defaultRegion = {
    latitude: currentLocation?.latitude || 12.9716,
    longitude: currentLocation?.longitude || 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vibe Map</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={defaultRegion}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={darkMapStyle}
        >
          {/* Area Heatmap Circles */}
          {activeLayer === 'crowd' && MOCK_AREAS.map((area) => (
            <Circle
              key={`circle-${area.id}`}
              center={{ latitude: area.latitude, longitude: area.longitude }}
              radius={1000}
              fillColor={getHeatmapColor(area.crowdLevel) + '30'}
              strokeColor={getHeatmapColor(area.crowdLevel) + '60'}
              strokeWidth={2}
            />
          ))}

          {/* Area Markers */}
          {MOCK_AREAS.map((area) => (
            <Marker
              key={area.id}
              coordinate={{ latitude: area.latitude, longitude: area.longitude }}
              onPress={() => handleMarkerPress(area)}
              tracksViewChanges={false}
            >
              <View style={[
                styles.markerContainer,
                selectedArea?.id === area.id && styles.markerSelected,
              ]}>
                <View style={[
                  styles.markerDot,
                  { backgroundColor: getMoodColor(area.mood) },
                ]}>
                  <Text style={styles.markerEmoji}>{getMoodEmoji(area.mood)}</Text>
                </View>
                {area.trending && (
                  <View style={styles.trendingBadge}>
                    <Ionicons name="flash" size={8} color={COLORS.text} />
                  </View>
                )}
              </View>
            </Marker>
          ))}
        </MapView>

        {/* AI Mood Card Overlay */}
        <View style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <View style={styles.moodIconContainer}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.moodTitle}>AI Insight</Text>
          </View>
          <Text style={styles.moodDescription}>
            {selectedArea ? (
              <>
                <Text style={{ color: getMoodColor(selectedArea.mood), fontWeight: '600' }}>
                  {selectedArea.name}
                </Text>
                {' is '}{selectedArea.mood}{' with '}
                <Text style={{ fontWeight: '600' }}>{selectedArea.users}</Text> people nearby.
              </>
            ) : (
              'Tap a marker to see area insights'
            )}
          </Text>
          {selectedArea && (
            <View style={styles.moodActions}>
              <TouchableOpacity style={styles.moodAction}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.moodActionText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moodAction}>
                <Ionicons name="qr-scanner" size={14} color={COLORS.primary} />
                <Text style={styles.moodActionText}>Check In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Layer Toggle */}
        <View style={styles.layerToggle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MAP_LAYERS.map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  activeLayer === layer.id && { backgroundColor: layer.color + '30', borderColor: layer.color },
                ]}
                onPress={() => setActiveLayer(layer.id)}
              >
                <Ionicons
                  name={layer.icon as any}
                  size={16}
                  color={activeLayer === layer.id ? layer.color : COLORS.textMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => {
            if (currentLocation) {
              mapRef.current?.animateToRegion({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 500);
            }
          }}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Area List */}
      <View style={styles.areaList}>
        <Text style={styles.areaListTitle}>Nearby Areas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOCK_AREAS.map((area) => (
            <TouchableOpacity
              key={area.id}
              style={[
                styles.areaCard,
                selectedArea?.id === area.id && styles.areaCardSelected,
              ]}
              onPress={() => handleMarkerPress(area)}
            >
              <View style={[styles.areaMoodBadge, { backgroundColor: getMoodColor(area.mood) + '20' }]}>
                <Text style={styles.areaMoodEmoji}>{getMoodEmoji(area.mood)}</Text>
              </View>
              <Text style={styles.areaName}>{area.name}</Text>
              <View style={styles.areaMeta}>
                <Text style={styles.areaUsers}>{area.users} active</Text>
                {area.trending && (
                  <View style={styles.trendingTag}>
                    <Ionicons name="trending-up" size={10} color={COLORS.accent} />
                  </View>
                )}
              </View>
              <View style={styles.crowdDots}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.crowdDot,
                      { backgroundColor: level <= area.crowdLevel ? getMoodColor(area.mood) : COLORS.surfaceLight },
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d4a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f1a' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterButton: {
    padding: SPACING.xs,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  markerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  markerEmoji: {
    fontSize: 16,
  },
  trendingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCard: {
    position: 'absolute',
    bottom: 60,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  moodIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  moodTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  moodDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  moodActions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  moodAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  moodActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  layerToggle: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
  },
  layerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface + 'F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  recenterButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface + 'F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  areaList: {
    paddingVertical: SPACING.md,
  },
  areaListTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  areaCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginLeft: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  areaCardSelected: {
    borderColor: COLORS.primary,
  },
  areaMoodBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  areaMoodEmoji: {
    fontSize: 18,
  },
  areaName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  areaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  areaUsers: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  trendingTag: {
    marginLeft: 4,
  },
  crowdDots: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  crowdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
});
