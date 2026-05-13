import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  aqi: number;
  sunrise: string;
  sunset: string;
}

interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
  precipitation: number;
}

interface DailyForecast {
  day: string;
  high: number;
  low: number;
  icon: string;
  condition: string;
  precipitation: number;
}

const MOCK_WEATHER: WeatherData = {
  temperature: 28,
  feelsLike: 31,
  condition: 'Partly Cloudy',
  conditionIcon: 'partly-sunny',
  humidity: 65,
  windSpeed: 12,
  uvIndex: 6,
  visibility: 10,
  aqi: 45,
  sunrise: '6:02 AM',
  sunset: '6:45 PM',
  hourly: [
    { time: 'Now', temp: 28, icon: 'partly-sunny', precipitation: 10 },
    { time: '2PM', temp: 29, icon: 'sunny', precipitation: 5 },
    { time: '3PM', temp: 30, icon: 'sunny', precipitation: 0 },
    { time: '4PM', temp: 29, icon: 'partly-sunny', precipitation: 10 },
    { time: '5PM', temp: 28, icon: 'cloudy', precipitation: 20 },
    { time: '6PM', temp: 27, icon: 'cloudy', precipitation: 30 },
    { time: '7PM', temp: 26, icon: 'rainy', precipitation: 60 },
    { time: '8PM', temp: 25, icon: 'rainy', precipitation: 70 },
  ],
  daily: [
    { day: 'Today', high: 30, low: 24, icon: 'partly-sunny', condition: 'Partly Cloudy', precipitation: 20 },
    { day: 'Tomorrow', high: 31, low: 25, icon: 'sunny', condition: 'Sunny', precipitation: 5 },
    { day: 'Wednesday', high: 29, low: 23, icon: 'rainy', condition: 'Thunderstorms', precipitation: 80 },
    { day: 'Thursday', high: 27, low: 22, icon: 'rainy', condition: 'Rainy', precipitation: 60 },
    { day: 'Friday', high: 28, low: 23, icon: 'cloudy', condition: 'Cloudy', precipitation: 30 },
    { day: 'Saturday', high: 30, low: 24, icon: 'partly-sunny', condition: 'Partly Cloudy', precipitation: 15 },
    { day: 'Sunday', high: 31, low: 25, icon: 'sunny', condition: 'Sunny', precipitation: 5 },
  ],
};

const getWeatherIcon = (icon: string): string => {
  const iconMap: Record<string, string> = {
    'sunny': 'sunny',
    'partly-sunny': 'partly-sunny',
    'cloudy': 'cloudy',
    'rainy': 'rainy',
    'stormy': 'thunderstorm',
    'snow': 'snow',
    'fog': 'cloudy',
    'windy': 'flag',
  };
  return iconMap[icon] || 'sunny';
};

const getWeatherColor = (condition: string): [string, string] => {
  const colorMap: Record<string, [string, string]> = {
    'Sunny': ['#4FC3F7', '#0288D1'],
    'Partly Cloudy': ['#64B5F6', '#1976D2'],
    'Cloudy': ['#90A4AE', '#546E7A'],
    'Rainy': ['#78909C', '#455A64'],
    'Thunderstorms': ['#546E7A', '#37474F'],
    'default': ['#64B5F6', '#1976D2'],
  };
  return colorMap[condition] || colorMap['default'];
};

export default function WeatherScreen() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData>(MOCK_WEATHER);
  const [selectedDay, setSelectedDay] = useState(0);
  const [location, setLocation] = useState('Koramangala, Bangalore');

  const gradientColors = getWeatherColor(weather.condition);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.locationText}>{location}</Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Main Temperature */}
            <View style={styles.mainTemp}>
              <Text style={styles.temperature}>{weather.temperature}°</Text>
              <Text style={styles.condition}>{weather.condition}</Text>
              <Text style={styles.feelsLike}>Feels like {weather.feelsLike}°</Text>
            </View>

            {/* Hourly Forecast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hourly Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {weather.hourly.map((hour, index) => (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>{hour.time}</Text>
                    <Ionicons
                      name={getWeatherIcon(hour.icon) as any}
                      size={24}
                      color="#fff"
                      style={styles.hourlyIcon}
                    />
                    <Text style={styles.hourlyTemp}>{hour.temp}°</Text>
                    <View style={styles.precipContainer}>
                      <Ionicons name="water" size={12} color="#90CAF9" />
                      <Text style={styles.precipText}>{hour.precipitation}%</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 7-Day Forecast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7-Day Forecast</Text>
              <View style={styles.dailyList}>
                {weather.daily.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dailyItem,
                      selectedDay === index && styles.dailyItemSelected,
                    ]}
                    onPress={() => setSelectedDay(index)}
                  >
                    <Text style={styles.dailyDay}>{day.day}</Text>
                    <Ionicons
                      name={getWeatherIcon(day.icon) as any}
                      size={20}
                      color="#fff"
                    />
                    <View style={styles.precipContainer}>
                      <Ionicons name="water" size={12} color="#90CAF9" />
                      <Text style={styles.precipText}>{day.precipitation}%</Text>
                    </View>
                    <Text style={styles.dailyHigh}>{day.high}°</Text>
                    <Text style={styles.dailyLow}>{day.low}°</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Weather Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="water" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>Humidity</Text>
                <Text style={styles.statValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flag" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>Wind</Text>
                <Text style={styles.statValue}>{weather.windSpeed} km/h</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="sunny" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>UV Index</Text>
                <Text style={styles.statValue}>{weather.uvIndex}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="eye" size={24} color="#90CAF9" />
                <Text style={styles.statLabel}>Visibility</Text>
                <Text style={styles.statValue}>{weather.visibility} km</Text>
              </View>
            </View>

            {/* Air Quality */}
            <View style={styles.aqiCard}>
              <View style={styles.aqiHeader}>
                <Text style={styles.aqiTitle}>Air Quality Index</Text>
                <View style={styles.aqiBadge}>
                  <Text style={styles.aqiBadgeText}>
                    {weather.aqi <= 50 ? 'Good' : weather.aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                  </Text>
                </View>
              </View>
              <View style={styles.aqiBar}>
                <View style={[styles.aqiFill, { width: `${(weather.aqi / 200) * 100}%` }]} />
              </View>
              <View style={styles.aqiLabels}>
                <Text style={styles.aqiLabel}>0</Text>
                <Text style={styles.aqiLabel}>50</Text>
                <Text style={styles.aqiLabel}>100</Text>
                <Text style={styles.aqiLabel}>150</Text>
                <Text style={styles.aqiLabel}>200</Text>
              </View>
            </View>

            {/* Sun Times */}
            <View style={styles.sunCard}>
              <View style={styles.sunItem}>
                <Ionicons name="sunny" size={28} color="#FFD54F" />
                <View style={styles.sunInfo}>
                  <Text style={styles.sunLabel}>Sunrise</Text>
                  <Text style={styles.sunTime}>{weather.sunrise}</Text>
                </View>
              </View>
              <View style={styles.sunDivider} />
              <View style={styles.sunItem}>
                <Ionicons name="moon" size={28} color="#90CAF9" />
                <View style={styles.sunInfo}>
                  <Text style={styles.sunLabel}>Sunset</Text>
                  <Text style={styles.sunTime}>{weather.sunset}</Text>
                </View>
              </View>
            </View>

            {/* Local Impact */}
            <View style={styles.impactCard}>
              <Text style={styles.impactTitle}>How weather affects your area</Text>
              <View style={styles.impactItem}>
                <Ionicons name="restaurant" size={20} color="#FF7043" />
                <Text style={styles.impactText}>Outdoor dining popularity: High</Text>
              </View>
              <View style={styles.impactItem}>
                <Ionicons name="football" size={20} color="#4CAF50" />
                <Text style={styles.impactText}>Sports & outdoor activities: Good</Text>
              </View>
              <View style={styles.impactItem}>
                <Ionicons name="car" size={20} color="#2196F3" />
                <Text style={styles.impactText}>Traffic conditions: Moderate</Text>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  locationText: {
    color: '#fff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginHorizontal: SPACING.xs,
  },
  mainTemp: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  temperature: {
    fontSize: 96,
    fontWeight: '200',
    color: '#fff',
  },
  condition: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '500',
    color: '#fff',
  },
  feelsLike: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#fff',
    marginBottom: SPACING.md,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    minWidth: 50,
  },
  hourlyTime: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  hourlyIcon: {
    marginVertical: SPACING.xs,
  },
  hourlyTemp: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  precipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  precipText: {
    fontSize: FONT_SIZE.xs,
    color: '#90CAF9',
    marginLeft: 2,
  },
  dailyList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  dailyItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dailyDay: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: '#fff',
    fontWeight: '500',
  },
  dailyHigh: {
    fontSize: FONT_SIZE.md,
    color: '#fff',
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
  dailyLow: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.6)',
    width: 35,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  statCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  aqiCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  aqiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aqiTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  aqiBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  aqiBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#fff',
  },
  aqiBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  aqiFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  aqiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  aqiLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  sunCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  sunItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sunInfo: {
    marginLeft: SPACING.sm,
  },
  sunLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  sunTime: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  sunDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: SPACING.md,
  },
  impactCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  impactTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
    marginBottom: SPACING.md,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  impactText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: SPACING.sm,
  },
  bottomPadding: {
    height: 100,
  },
});
