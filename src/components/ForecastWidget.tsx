import React, { useState } from 'react';
import { Cloud, Droplets, Thermometer, ChevronDown, ChevronUp } from 'lucide-react';
import { Forecast } from '../types/dashboard';
import { format } from 'date-fns';

interface Props {
  forecasts: Forecast[];
}

const ForecastWidget: React.FC<Props> = ({ forecasts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    return 'bg-purple-500';
  };

  const formatNumber = (num: number) => {
    const formatted = num.toFixed(1);
    return formatted.length > 6 ? num.toFixed(0) : formatted;
  };

  // Show only first 4 forecasts when collapsed
  const visibleForecasts = isExpanded ? forecasts : forecasts.slice(0, 4);

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">12-Hour Forecast</h2>
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
      
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visibleForecasts.map((forecast, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-3">
              <div className="text-center mb-2">
                <p className="text-gray-400 text-sm">
                  {format(new Date(forecast.timestamp), 'HH:mm')}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span className={`px-2 py-0.5 rounded-full ${getAQIColor(forecast.aqi)} text-white text-xs`}>
                    AQI {formatNumber(forecast.aqi)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Droplets className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">PM2.5</span>
                  </div>
                  <span className="text-gray-200">{formatNumber(forecast.pm25)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">Temp</span>
                  </div>
                  <span className="text-gray-200">{formatNumber(forecast.temperature)}°C</span>
                </div>
                
                <div className="mt-1 pt-1 border-t border-gray-600">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-gray-200">{formatNumber(forecast.probability)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isExpanded && forecasts.length > 4 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1"
          >
            Show all forecasts
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ForecastWidget;