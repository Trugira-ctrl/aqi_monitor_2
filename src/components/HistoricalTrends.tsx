import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { AirQualityData } from '../types/dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: AirQualityData[];
  timeRange: '24h' | '7d' | '30d';
}

const HistoricalTrends: React.FC<Props> = ({ data, timeRange }) => {
  const [selectedMetric, setSelectedMetric] = useState<keyof AirQualityData>('pm25');

  const metrics = [
    { key: 'pm25' as const, label: 'PM2.5' },
    { key: 'pm10' as const, label: 'PM10' },
    { key: 'co' as const, label: 'CO' },
    { key: 'no2' as const, label: 'NO₂' },
    { key: 'o3' as const, label: 'O₃' },
    { key: 'so2' as const, label: 'SO₂' }
  ];

  const chartData = {
    labels: data.map(d => format(new Date(d.timestamp), 'MMM d, HH:mm')),
    datasets: [
      {
        label: metrics.find(m => m.key === selectedMetric)?.label || selectedMetric,
        data: data.map(d => d[selectedMetric] as number),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb'
        }
      },
      title: {
        display: true,
        text: 'Historical Air Quality Trends',
        color: '#e5e7eb'
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#e5e7eb'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#e5e7eb'
        },
        grid: {
          color: '#374151'
        }
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Historical Trends</h2>
        <div className="flex gap-2">
          {metrics.map(metric => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-3 py-1 rounded-lg text-sm ${
                selectedMetric === metric.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HistoricalTrends;