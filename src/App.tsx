import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Mail, Bell } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import SensorEmailAssignment from './components/SensorEmailAssignment';
import AirQualityWidget from './components/AirQualityWidget';
import WeatherWidget from './components/WeatherWidget';
import HistoricalTrends from './components/HistoricalTrends';
import ForecastWidget from './components/ForecastWidget';
import AlertsWidget from './components/AlertsWidget';
import SensorHealthWidget from './components/SensorHealthWidget';
import { useMockData } from './hooks/useMockData';

interface SensorData {
  id: string;
  lastSeen?: number;
  isOnline?: boolean;
  hoursOffline?: number;
  latitude?: number;
  longitude?: number;
  error?: string;
  status: 'online' | 'offline' | 'error';
  location?: string;
}

interface GeoJSONFeature {
  type: string;
  properties: {
    NAME_1?: string;
    NAME_2?: string;
    NAME_3?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface GeoJSONData {
  type: string;
  name: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: GeoJSONFeature[];
}

// Updated SENSOR_IDS array to include all 38 sensors
const SENSOR_IDS = [
  '222861', '234741', '234747', '235227', '222867', '222887', '222835', '234727',
  '234737', '234749', '239265', '240053', '240091', '240593', '239301', '240067',
  '239259', '239309', '240595', '240061', '240059', '240063', '239249', '240083',
  '239267', '239307', '240065', '240047', '240041', '239297', '240097', '240587',
  '239257', '240093', '240057', '240049', '240071', '240075'
];

const RWANDA_CENTER: [number, number] = [-2.0, 30.0];
const DEFAULT_ZOOM = 8;
const OFFLINE_THRESHOLD_HOURS = 3;
const FETCH_INTERVAL = 3600000; // 1 hour in milliseconds
const BATCH_SIZE = 3; // Number of sensors to fetch in parallel
const BATCH_DELAY = 5000; // Delay between batches in milliseconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>`,
  });
};

const onlineIcon = createMarkerIcon('#22c55e');
const offlineIcon = createMarkerIcon('#ef4444');
const errorIcon = createMarkerIcon('#eab308');

// Helper function to chunk array into batches
const chunk = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

// Sleep function for delay between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function App() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [showEmailAssignment, setShowEmailAssignment] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [districtsGeoJSON, setDistrictsGeoJSON] = useState<GeoJSONData | null>(null);
  const [sectorsGeoJSON, setSectorsGeoJSON] = useState<GeoJSONData | null>(null);

  const {
    airQualityData,
    weatherData,
    forecasts,
    alerts,
    sensorHealth,
    acknowledgeAlert
  } = useMockData();

  const activeSensors = sensorData.filter(sensor => sensor.status === 'online').length;
  const totalSensors = SENSOR_IDS.length;

  // Function to check if a point is inside a polygon
  const isPointInPolygon = (point: [number, number], polygon: number[][][]): boolean => {
    // For MultiPolygon, check each polygon
    for (const poly of polygon) {
      // For each polygon, check the first ring (outer ring)
      const ring = poly[0];
      
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
          (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      
      if (inside) return true;
    }
    
    return false;
  };

  // Function to find location (district and sector) based on coordinates
  const findLocation = (latitude?: number, longitude?: number): string => {
    if (!latitude || !longitude || !districtsGeoJSON || !sectorsGeoJSON) {
      return "Unknown";
    }

    const point: [number, number] = [longitude, latitude];
    let district = "Unknown";
    let sector = "Unknown";

    // Find district
    for (const feature of districtsGeoJSON.features) {
      if (feature.geometry.type === "MultiPolygon" && 
          isPointInPolygon(point, feature.geometry.coordinates)) {
        district = feature.properties.NAME_2 || "Unknown";
        break;
      }
    }

    // Find sector
    for (const feature of sectorsGeoJSON.features) {
      if (feature.geometry.type === "MultiPolygon" && 
          isPointInPolygon(point, feature.geometry.coordinates)) {
        sector = feature.properties.NAME_3 || "Unknown";
        break;
      }
    }

    return `${district}, ${sector}`;
  };

  const sendNotifications = async () => {
    try {
      setSendingNotifications(true);
      setError(null);
      setNotificationMessage(null);

      const offlineSensors = sensorData.filter(sensor => 
        sensor.status === 'offline' || sensor.status === 'error'
      );

      if (offlineSensors.length === 0) {
        setNotificationMessage('No offline or error sensors to report.');
        return;
      }

      const { data, error: functionError } = await supabase.functions.invoke('notify', {
        body: {
          sensors: offlineSensors.map(sensor => ({
            id: sensor.id,
            status: sensor.status,
            error: sensor.error,
            hoursOffline: sensor.hoursOffline
          }))
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      setNotificationMessage(
        `Successfully sent notifications for ${offlineSensors.length} sensor${offlineSensors.length > 1 ? 's' : ''}.`
      );
    } catch (err) {
      setError(`Failed to send notifications: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSendingNotifications(false);
    }
  };

  const fetchSensorWithRetry = async (sensorId: string, retries = MAX_RETRIES): Promise<SensorData> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purpleair?sensorId=${sensorId}`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(30000) // 30 second timeout
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const sensor = data.sensor;
        const currentTime = Date.now() / 1000;
        const timeDifference = currentTime - (sensor.last_seen || 0);
        const hoursOffline = timeDifference / 3600;

        return {
          id: sensorId,
          lastSeen: sensor.last_seen,
          latitude: sensor.latitude,
          longitude: sensor.longitude,
          hoursOffline: Math.round(hoursOffline * 10) / 10,
          status: hoursOffline <= OFFLINE_THRESHOLD_HOURS ? 'online' : 'offline'
        };
      } catch (err) {
        // If it's the last attempt, return error state
        if (attempt === retries) {
          console.error(`All retry attempts failed for sensor ${sensorId}:`, err);
          return {
            id: sensorId,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }

        // Calculate delay with exponential backoff
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed for sensor ${sensorId}, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }

    // This should never be reached due to the return in the last retry attempt
    return {
      id: sensorId,
      status: 'error',
      error: 'Max retries exceeded'
    };
  };

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const sensorBatches = chunk(SENSOR_IDS, BATCH_SIZE);
      const allResults: SensorData[] = [];

      for (const batch of sensorBatches) {
        const batchPromises = batch.map(sensorId => fetchSensorWithRetry(sensorId));
        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);

        // Wait before processing the next batch
        if (sensorBatches.indexOf(batch) < sensorBatches.length - 1) {
          await sleep(BATCH_DELAY);
        }
      }

      // Add location information to each sensor
      const sensorsWithLocation = allResults.map(sensor => ({
        ...sensor,
        location: findLocation(sensor.latitude, sensor.longitude)
      }));

      // Log sensor data for debugging
      console.log("Sensor Data:", sensorsWithLocation);

      setSensorData(sensorsWithLocation);
    } catch (err) {
      setError(`Failed to fetch sensor data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch GeoJSON data
  useEffect(() => {
    const fetchGeoJSONData = async () => {
      try {
        // Fetch districts GeoJSON
        const districtsResponse = await fetch('/districts.geojson');
        if (districtsResponse.ok) {
          const districtsData = await districtsResponse.json();
          setDistrictsGeoJSON(districtsData);
        } else {
          console.error('Failed to load districts GeoJSON');
        }

        // Fetch sectors GeoJSON
        const sectorsResponse = await fetch('/sectors.geojson');
        if (sectorsResponse.ok) {
          const sectorsData = await sectorsResponse.json();
          setSectorsGeoJSON(sectorsData);
        } else {
          console.error('Failed to load sectors GeoJSON');
        }
      } catch (err) {
        console.error('Error fetching GeoJSON data:', err);
      }
    };

    fetchGeoJSONData();
  }, []);

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [districtsGeoJSON, sectorsGeoJSON]);

  const errorSensors = sensorData.filter(sensor => sensor.status === 'error');

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-100">Rwanda PurpleAir Sensor Network</h1>
              <div className="text-xl font-semibold text-purple-400">
                Active Sensors: <span className="text-green-400">{activeSensors}</span>/<span className="text-gray-400">{totalSensors}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={sendNotifications}
                disabled={sendingNotifications}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Bell className={`w-5 h-5 ${sendingNotifications ? 'animate-pulse' : ''}`} />
                {sendingNotifications ? 'Sending...' : 'Send Notifications'}
              </button>
              <button
                onClick={() => setShowEmailAssignment(!showEmailAssignment)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Assign Emails
              </button>
              <button
                onClick={() => setShowErrorReport(!showErrorReport)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                Error Report ({errorSensors.length})
              </button>
              <button
                onClick={fetchSensorData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
              {error}
            </div>
          )}

          {notificationMessage && (
            <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg text-green-100">
              {notificationMessage}
            </div>
          )}

          {showEmailAssignment && (
            <SensorEmailAssignment />
          )}

          {showErrorReport && errorSensors.length > 0 && (
            <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-yellow-400">Error Report</h2>
                <p className="text-sm text-gray-400">Sensors experiencing issues or not found</p>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {errorSensors.map(sensor => (
                    <div key={sensor.id} className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-300">Error: {sensor.error}</p>
                        <p className="text-sm text-gray-300">ID: {sensor.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {airQualityData.length > 0 && (
              <AirQualityWidget data={airQualityData[0]} />
            )}
            {weatherData && (
              <WeatherWidget data={weatherData} />
            )}
          </div>

          <div className="mb-8">
            <HistoricalTrends data={airQualityData} timeRange="24h" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ForecastWidget forecasts={forecasts} />
            <AlertsWidget alerts={alerts} onAcknowledge={acknowledgeAlert} />
          </div>

          <div className="mb-8">
            <SensorHealthWidget sensors={sensorHealth} />
          </div>

          <div className="mb-8 bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="h-[500px] relative">
              <MapContainer
                center={RWANDA_CENTER}
                zoom={DEFAULT_ZOOM}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {sensorData.map(sensor => (
                  sensor.latitude != null && sensor.longitude != null ? (
                    <Marker
                      key={sensor.id}
                      position={[sensor.latitude, sensor.longitude]}
                      icon={sensor.status === 'online' ? onlineIcon : sensor.status === 'offline' ? offlineIcon : errorIcon}
                    >
                      <Popup>
                        <div className="p-2 bg-gray-800 text-gray-100 rounded shadow-lg">
                          <p className="text-sm">
                            ID: {sensor.id}
                          </p>
                          <p className="text-sm">
                            Status: {
                              sensor.status === 'online' ? (
                                <span className="text-green-400">Online</span>
                              ) : sensor.status === 'offline' ? (
                                <span className="text-red-400">Offline ({sensor.hoursOffline}h)</span>
                              ) : (
                                <span className="text-yellow-400">Error</span>
                              )
                            }
                          </p>
                          {sensor.lastSeen && (
                            <p className="text-sm">
                              Last seen: {new Date(sensor.lastSeen * 1000).toLocaleString()}
                            </p>
                          )}
                          {sensor.location && (
                            <p className="text-sm">
                              Location: {sensor.location}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            </div>
            <div className="p-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-gray-300">Map Legend</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-300">Online (seen within {OFFLINE_THRESHOLD_HOURS} hours)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-300">Offline (not seen for over {OFFLINE_THRESHOLD_HOURS} hours)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-300">Error (404 or API error)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                      Sensor ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                      Sensor Location
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sensorData.map((sensor, index) => (
                    <tr key={sensor.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sensor.status === 'online' ? (
                          <Wifi className="w-5 h-5 text-green-500" />
                        ) : sensor.status === 'offline' ? (
                          <WifiOff className="w-5 h-5 text-red-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                        {sensor.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {sensor.lastSeen ? (
                          <>
                            {new Date(sensor.lastSeen * 1000).toLocaleString()}
                            {sensor.status === 'offline' && (
                              <span className="ml-2 text-red-400">
                                ({sensor.hoursOffline} hours)
                              </span>
                            )}
                          </>
                        ) : sensor.error ? (
                          <span className="text-yellow-400">{sensor.error}</span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {sensor.location || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;