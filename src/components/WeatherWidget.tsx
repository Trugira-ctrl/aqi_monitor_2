import React, { useState } from 'react';
import { Sun, Cloud, Droplets, Wind, Sunrise, Sunset, ChevronDown, ChevronUp } from 'lucide-react';
import { WeatherData } from '../types/dashboard';

interface Props {
  data: WeatherData;
}

const WeatherWidget: React.FC<Props> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatNumber = (num: number) => {
    return num.toFixed(1).replace(/\.?0+$/, '');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Weather Conditions</h2>
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
            {/* Temperature and Humidity */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sun className="w-6 h-6 text-yellow-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Temperature</span>
                    <span className="text-xl font-semibold text-gray-100">
                      {formatNumber(data.temperature)}°C
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className="w-6 h-6 text-blue-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Humidity</span>
                    <span className="text-xl font-semibold text-gray-100">
                      {formatNumber(data.humidity)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wind and Precipitation */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Wind className="w-6 h-6 text-purple-400" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Wind Speed</span>
                      <span className="text-xl font-semibold text-gray-100">
                        {formatNumber(data.windSpeed)} m/s
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Direction: {formatNumber(data.windDirection)}°
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-gray-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Precipitation</span>
                    <span className="text-xl font-semibold text-gray-100">
                      {formatNumber(data.precipitation)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sunrise/Sunset and UV Index */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sunrise className="w-6 h-6 text-orange-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Sunrise</span>
                    <span className="text-gray-100">{data.sunrise}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sunset className="w-6 h-6 text-red-400" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-300">Sunset</span>
                    <span className="text-gray-100">{data.sunset}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">UV Index</span>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-600 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-red-500 rounded-full"
                          style={{ width: `${(data.uvIndex / 11) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-gray-100 ml-2">{formatNumber(data.uvIndex)}</span>
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

export default WeatherWidget;