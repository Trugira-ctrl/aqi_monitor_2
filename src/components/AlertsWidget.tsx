import React from 'react';
import { AlertTriangle, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Alert } from '../types/dashboard';
import { format } from 'date-fns';

interface Props {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}

const AlertsWidget: React.FC<Props> = ({ alerts, onAcknowledge }) => {
  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Bell className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-100">Active Alerts</h2>
        <span className="px-3 py-1 bg-gray-700 rounded-full text-gray-300 text-sm">
          {alerts.length} alerts
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`bg-gray-700 rounded-lg p-4 ${
              alert.acknowledged ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {getSeverityIcon(alert.severity)}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityColor(alert.severity)} text-white`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {format(new Date(alert.timestamp), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-gray-200">{alert.message}</p>
              </div>

              <button
                onClick={() => onAcknowledge(alert.id)}
                className={`p-2 rounded-lg transition-colors ${
                  alert.acknowledged
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                disabled={alert.acknowledged}
              >
                {alert.acknowledged ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;