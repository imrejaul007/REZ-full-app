import axios from 'axios';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  condition: string;
  conditionIcon: string;
  conditionMain: string;
  sunrise: string;
  sunset: string;
  city: string;
  country: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

export interface DailyForecast {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  precipitation: number;
  humidity: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherAlert {
  id: string;
  sender: string;
  event: string;
  start: string;
  end: string;
  description: string;
  severity: 'watch' | 'warning' | 'emergency';
}

export interface AirQuality {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}

class WeatherService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * Get current weather
   */
  async getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
    const cacheKey = `current_${lat}_${lng}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${WEATHER_API_BASE}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: WEATHER_API_KEY,
          units: 'metric',
        },
      });

      const data = response.data;
      const weather: CurrentWeather = {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility / 1000,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
        windDeg: data.wind.deg,
        clouds: data.clouds.all,
        condition: data.weather[0].description,
        conditionIcon: data.weather[0].icon,
        conditionMain: data.weather[0].main,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        city: data.name,
        country: data.sys.country,
      };

      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });
      return weather;
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  /**
   * Get 5-day forecast (3-hour intervals)
   */
  async getForecast(lat: number, lng: number): Promise<HourlyForecast[]> {
    try {
      const response = await axios.get(`${WEATHER_API_BASE}/forecast`, {
        params: {
          lat,
          lon: lng,
          appid: WEATHER_API_KEY,
          units: 'metric',
        },
      });

      return response.data.list.slice(0, 8).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
        }),
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        condition: item.weather[0].description,
        conditionIcon: item.weather[0].icon,
        precipitation: Math.round((item.pop || 0) * 100),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6),
      }));
    } catch (error) {
      console.error('Forecast API error:', error);
      throw error;
    }
  }

  /**
   * Get air quality
   */
  async getAirQuality(lat: number, lng: number): Promise<AirQuality> {
    try {
      const response = await axios.get('http://api.openweathermap.org/data/2.5/air_pollution', {
        params: {
          lat,
          lon: lng,
          appid: WEATHER_API_KEY,
        },
      });

      const data = response.data.list[0];
      const aqi = data.main.aqi;

      return {
        aqi,
        category: this.getAQICategory(aqi),
        pm25: data.components.pm2_5,
        pm10: data.components.pm10,
        o3: data.components.o3,
        no2: data.components.no2,
      };
    } catch (error) {
      console.error('Air quality API error:', error);
      return {
        aqi: 50,
        category: 'Good',
        pm25: 0,
        pm10: 0,
        o3: 0,
        no2: 0,
      };
    }
  }

  /**
   * Get weather alerts
   */
  async getAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
    // OpenWeather free tier doesn't include alerts
    // This would require a paid API or external service
    return [];
  }

  /**
   * Get weather-based recommendations
   */
  getRecommendations(weather: CurrentWeather): string[] {
    const recommendations: string[] = [];

    if (weather.temperature > 30) {
      recommendations.push('Stay hydrated - drink plenty of water');
    }

    if (weather.conditionMain === 'Rain' || weather.conditionMain === 'Thunderstorm') {
      recommendations.push('Carry an umbrella today');
    }

    if (weather.uvIndex >= 6) {
      recommendations.push('High UV - use sunscreen');
    }

    if (weather.windSpeed > 30) {
      recommendations.push('Windy conditions - secure loose items');
    }

    if (weather.humidity > 80) {
      recommendations.push('High humidity - dress light');
    }

    if (weather.conditionMain === 'Clear' && weather.temperature >= 20 && weather.temperature <= 28) {
      recommendations.push('Great weather for outdoor activities!');
    }

    return recommendations;
  }

  private getAQICategory(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Map OpenWeather icon to Ionicons
   */
  getIconName(iconCode: string): string {
    const iconMap: Record<string, string> = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'partly-sunny',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'cloudy',
      '50n': 'cloudy',
    };
    return iconMap[iconCode] || 'sunny';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const weatherService = new WeatherService();
