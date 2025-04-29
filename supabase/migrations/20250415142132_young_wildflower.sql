/*
  # Add new sensor 240593

  1. Changes
    - Insert new sensor into sensors table
    - Set default email for notifications
*/

-- Insert new sensor if it doesn't exist
INSERT INTO public.sensors (id, name, email, created_at)
VALUES 
  ('240593', 'Sensor 240593', 'sensor240593@example.com', now())
ON CONFLICT (id) DO NOTHING;