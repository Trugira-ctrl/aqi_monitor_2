import { NotificationType } from '../lib/notifications';

export interface AirQualityData {
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  timestamp: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

export interface Forecast {
  timestamp: string;
  aqi: number;
  pm25: number;
  temperature: number;
  humidity: number;
  probability: number;
}

export interface Alert {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

export interface SensorHealth {
  id: string;
  status: 'online' | 'offline' | 'error';
  lastCalibration: string;
  batteryLevel: number;
  signalStrength: number;
  dataQuality: 'good' | 'fair' | 'poor';
  maintenanceNeeded: boolean;
  lastMaintenance: string;
}