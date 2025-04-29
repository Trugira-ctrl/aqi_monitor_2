/*
  # Add new sensor 240091

  1. Changes
    - Insert new sensor into sensors table
    - Set default email for notifications
*/

-- Insert new sensor if it doesn't exist
INSERT INTO public.sensors (id, name, email, created_at)
VALUES 
  ('240091', 'Sensor 240091', 'sensor240091@example.com', now())
ON CONFLICT (id) DO NOTHING;