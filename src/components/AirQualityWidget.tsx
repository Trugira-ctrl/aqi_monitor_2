import React, { useState } from 'react';
import { Wind, Droplets, Thermometer, ChevronDown, ChevronUp } from 'lucide-react';
import { AirQualityData } from '../types/dashboard';

interface Props {
  data: AirQualityData;
}

const AirQualityWidget: React.FC<Props> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getAQIColor = (pm25: number) => {
    if (pm25 <= 12) return 'bg-green-500';
    if (pm25 <= 35.4) return 'bg-yellow-500';
    if (pm25 <= 55.4) return 'bg-orange-500';
    if (pm25 <= 150.4) return 'bg-red-500';
    return 'bg-purple-500';
  };

  const formatNumber = (num: number) => {
    return num.toFixed(1).replace(/\.?0+$/, '');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Air Quality Metrics</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PM2.5 and PM10 */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Particulate Matter</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">PM2.5</span>
                  <span className={`px-2 py-1 rounded-full ${getAQIColor(data.pm25)} text-white text-sm`}>
                    {formatNumber(data.pm25)} µg/m³
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">PM10</span>
                  <span className="px-2 py-1 rounded-full bg-blue-500 text-white text-sm">
                    {formatNumber(data.pm10)} µg/m³
                  </span>
                </div>
              </div>
            </div>

            {/* Gases */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Gas Pollutants</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-sm text-gray-400">CO</span>
                  <div className="text-gray-200 font-medium">{formatNumber(data.co)} ppm</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-400">NO₂</span>
                  <div className="text-gray-200 font-medium">{formatNumber(data.no2)} ppb</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-400">O₃</span>
                  <div className="text-gray-200 font-medium">{formatNumber(data.o3)} ppb</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-400">SO₂</span>
                  <div className="text-gray-200 font-medium">{formatNumber(data.so2)} ppb</div>
                </div>
              </div>
            </div>

            {/* Weather Conditions */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Weather Conditions</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Temperature</span>
                    <span className="text-gray-200">{formatNumber(data.temperature)}°C</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Humidity</span>
                    <span className="text-gray-200">{formatNumber(data.humidity)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-purple-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Wind</span>
                    <span className="text-gray-200">{formatNumber(data.windSpeed)} m/s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirQualityWidget;