import React from 'react';
import { 
  Battery, 
  Signal, 
  AlertTriangle, 
  CheckCircle2, 
  WrenchIcon,
  CalendarClock
} from 'lucide-react';
import { SensorHealth } from '../types/dashboard';
import { format } from 'date-fns';

interface Props {
  sensors: SensorHealth[];
}

const SensorHealthWidget: React.FC<Props> = ({ sensors }) => {
  const getStatusColor = (status: SensorHealth['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      case 'error':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getDataQualityColor = (quality: SensorHealth['dataQuality']) => {
    switch (quality) {
      case 'good':
        return 'bg-green-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Sensor Health Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map(sensor => (
          <div key={sensor.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">
                Sensor {sensor.id}
              </h3>
              <div className={`flex items-center gap-2 ${getStatusColor(sensor.status)}`}>
                {sensor.status === 'online' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : sensor.status === 'offline' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="capitalize">{sensor.status}</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Battery Level */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Battery</span>
                </div>
                <div className="w-20 h-2 bg-gray-600 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${sensor.batteryLevel}%` }}
                  />
                </div>
              </div>

              {/* Signal Strength */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Signal className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">Signal</span>
                </div>
                <div className="w-20 h-2 bg-gray-600 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${sensor.signalStrength}%` }}
                  />
                </div>
              </div>

              {/* Data Quality */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Data Quality</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getDataQualityColor(sensor.dataQuality)} text-white`}>
                  {sensor.dataQuality.toUpperCase()}
                </span>
              </div>

              {/* Maintenance Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WrenchIcon className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300">Maintenance</span>
                </div>
                {sensor.maintenanceNeeded ? (
                  <span className="text-red-400 text-sm">Required</span>
                ) : (
                  <span className="text-green-400 text-sm">Up to date</span>
                )}
              </div>

              {/* Last Calibration */}
              <div className="pt-2 mt-2 border-t border-gray-600">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarClock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Last calibrated:</span>
                  <span className="text-gray-300">
                    {format(new Date(sensor.lastCalibration), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorHealthWidget;