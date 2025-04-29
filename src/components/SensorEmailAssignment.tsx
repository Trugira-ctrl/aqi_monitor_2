import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Save, AlertCircle } from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  email: string | null;
}

export default function SensorEmailAssignment() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editedEmails, setEditedEmails] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    try {
      const { data, error } = await supabase
        .from('sensors')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      
      setSensors(data || []);
      
      // Initialize edited emails with current values
      const initialEmails: Record<string, string> = {};
      data?.forEach(sensor => {
        initialEmails[sensor.id] = sensor.email || '';
      });
      setEditedEmails(initialEmails);
    } catch (err) {
      console.error('Error fetching sensors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sensors');
    } finally {
      setLoading(false);
    }
  };

  const updateSensorEmail = async (sensorId: string, email: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      setUpdating(sensorId);

      // Basic email validation
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // First check if the sensor exists
      const { data: existingSensor, error: checkError } = await supabase
        .from('sensors')
        .select('id')
        .eq('id', sensorId);

      if (checkError) throw checkError;
      if (!existingSensor || existingSensor.length === 0) {
        throw new Error(`Sensor ${sensorId} not found`);
      }

      // Update the sensor's email
      const { error: updateError } = await supabase
        .from('sensors')
        .update({ email })
        .eq('id', sensorId);

      if (updateError) throw updateError;

      // Fetch the updated sensor to confirm changes
      const { data: updatedSensor, error: fetchError } = await supabase
        .from('sensors')
        .select('*')
        .eq('id', sensorId)
        .single();

      if (fetchError) throw fetchError;
      if (!updatedSensor) {
        throw new Error(`Failed to verify update for sensor ${sensorId}`);
      }

      // Update local state
      setSensors(prevSensors => 
        prevSensors.map(sensor => 
          sensor.id === sensorId ? { ...sensor, email: updatedSensor.email } : sensor
        )
      );

      setSuccessMessage(`Email updated successfully for sensor ${sensorId}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating email:', err);
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setUpdating(null);
    }
  };

  const handleEmailChange = (sensorId: string, email: string) => {
    setEditedEmails(prev => ({
      ...prev,
      [sensorId]: email
    }));
  };

  const handleEmailSubmit = async (sensorId: string) => {
    const email = editedEmails[sensorId]?.trim();
    if (email) {
      await updateSensorEmail(sensorId, email);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Sensor Email Assignment</h2>
            <p className="text-gray-400 mt-1">
              Assign email addresses to sensors for notifications
            </p>
          </div>
          <Mail className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-100">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="m-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-3">
          <Save className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-100">{successMessage}</p>
        </div>
      )}

      <div className="p-6">
        <div className="grid gap-6">
          {sensors.map(sensor => (
            <div 
              key={sensor.id}
              className="bg-gray-900 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <h3 className="text-gray-100 font-medium">{sensor.name}</h3>
                <p className="text-gray-400 text-sm">ID: {sensor.id}</p>
                {sensor.email && (
                  <p className="text-gray-400 text-sm">Current email: {sensor.email}</p>
                )}
              </div>
              <div className="w-full sm:w-auto flex-1 flex gap-2">
                <input
                  type="email"
                  value={editedEmails[sensor.id] || ''}
                  onChange={(e) => handleEmailChange(sensor.id, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEmailSubmit(sensor.id);
                    }
                  }}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={updating === sensor.id}
                />
                <button
                  onClick={() => handleEmailSubmit(sensor.id)}
                  disabled={updating === sensor.id}
                  className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 ${
                    updating === sensor.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {updating === sensor.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updating === sensor.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}