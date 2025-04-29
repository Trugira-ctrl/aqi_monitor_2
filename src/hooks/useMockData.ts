import { useState, useEffect } from 'react';
import { 
  AirQualityData,
  WeatherData,
  Forecast,
  Alert,
  SensorHealth
} from '../types/dashboard';

// Helper function to format number to 3 decimal places
const formatDecimal = (num: number): number => {
  return Number(num.toFixed(3));
};

// Mock data generator functions
const generateMockAirQualityData = (count: number = 1): AirQualityData[] => {
  return Array.from({ length: count }, (_, i) => ({
    pm25: formatDecimal(15 + Math.random() * 20),
    pm10: formatDecimal(25 + Math.random() * 30),
    co: formatDecimal(0.5 + Math.random() * 1),
    no2: formatDecimal(20 + Math.random() * 15),
    o3: formatDecimal(30 + Math.random() * 20),
    so2: formatDecimal(5 + Math.random() * 5),
    temperature: formatDecimal(20 + Math.random() * 10),
    humidity: formatDecimal(40 + Math.random() * 30),
    pressure: formatDecimal(1000 + Math.random() * 20),
    windSpeed: formatDecimal(2 + Math.random() * 5),
    windDirection: formatDecimal(Math.random() * 360),
    timestamp: new Date(Date.now() - i * 3600000).toISOString()
  }));
};

const generateMockWeatherData = (): WeatherData => ({
  temperature: formatDecimal(22 + Math.random() * 8),
  humidity: formatDecimal(45 + Math.random() * 30),
  windSpeed: formatDecimal(2 + Math.random() * 5),
  windDirection: formatDecimal(Math.random() * 360),
  precipitation: formatDecimal(Math.random() * 100),
  uvIndex: formatDecimal(Math.random() * 11),
  sunrise: '06:30',
  sunset: '18:30'
});

const generateMockForecasts = (hours: number = 12): Forecast[] => {
  return Array.from({ length: hours }, (_, i) => ({
    timestamp: new Date(Date.now() + i * 3600000).toISOString(),
    aqi: formatDecimal(50 + Math.random() * 100),
    pm25: formatDecimal(15 + Math.random() * 20),
    temperature: formatDecimal(20 + Math.random() * 10),
    humidity: formatDecimal(40 + Math.random() * 30),
    probability: formatDecimal(70 + Math.random() * 30)
  }));
};

const generateMockAlerts = (): Alert[] => {
  const severities: Alert['severity'][] = ['low', 'medium', 'high', 'critical'];
  return Array.from({ length: 3 }, (_, i) => ({
    id: `alert-${i}`,
    type: 'sensor_offline',
    message: `Alert message ${i + 1}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    severity: severities[Math.floor(Math.random() * severities.length)],
    acknowledged: Math.random() > 0.5
  }));
};

const generateMockSensorHealth = (count: number = 5): SensorHealth[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `sensor-${i + 1}`,
    status: Math.random() > 0.8 ? 'offline' : Math.random() > 0.9 ? 'error' : 'online',
    lastCalibration: new Date(Date.now() - Math.random() * 30 * 24 * 3600000).toISOString(),
    batteryLevel: formatDecimal(60 + Math.random() * 40),
    signalStrength: formatDecimal(70 + Math.random() * 30),
    dataQuality: Math.random() > 0.7 ? 'good' : Math.random() > 0.5 ? 'fair' : 'poor',
    maintenanceNeeded: Math.random() > 0.8,
    lastMaintenance: new Date(Date.now() - Math.random() * 60 * 24 * 3600000).toISOString()
  }));
};

export const useMockData = () => {
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensorHealth, setSensorHealth] = useState<SensorHealth[]>([]);

  useEffect(() => {
    // Initial data load
    setAirQualityData(generateMockAirQualityData(24));
    setWeatherData(generateMockWeatherData());
    setForecasts(generateMockForecasts());
    setAlerts(generateMockAlerts());
    setSensorHealth(generateMockSensorHealth());

    // Update data periodically
    const interval = setInterval(() => {
      setAirQualityData(prev => [generateMockAirQualityData(1)[0], ...prev.slice(0, -1)]);
      setWeatherData(generateMockWeatherData());
      setForecasts(generateMockForecasts());
    }, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  return {
    airQualityData,
    weatherData,
    forecasts,
    alerts,
    sensorHealth,
    acknowledgeAlert
  };
};