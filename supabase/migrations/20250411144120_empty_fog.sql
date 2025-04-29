/*
  # Add new sensor

  1. Changes
    - Insert new sensor into sensors table
    - Set default email for notifications
*/

-- Insert new sensor if it doesn't exist
INSERT INTO public.sensors (id, name, email, created_at)
VALUES 
  ('NEW_SENSOR_ID', 'Sensor NEW_SENSOR_ID', 'sensorNEW_SENSOR_ID@example.com', now())
ON CONFLICT (id) DO NOTHING;