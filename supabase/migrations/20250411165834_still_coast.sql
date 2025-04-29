/*
  # Add new sensor 240097

  1. Changes
    - Insert new sensor into sensors table
    - Set default email for notifications
*/

-- Insert new sensor if it doesn't exist
INSERT INTO public.sensors (id, name, email, created_at)
VALUES 
  ('240097', 'Sensor 240097', 'sensor240097@example.com', now())
ON CONFLICT (id) DO NOTHING;