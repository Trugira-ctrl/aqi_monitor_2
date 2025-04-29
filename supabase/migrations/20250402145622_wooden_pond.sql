/*
  # Add sensors to sensors table

  1. Changes
    - Insert all known sensors into the sensors table
    - Each sensor gets a default name based on its ID
    - Initial latitude and longitude are set to 0 (will be updated by the app)

  2. Security
    - No changes to security policies
*/

-- Insert sensors if they don't exist
INSERT INTO public.sensors (id, name, created_at)
VALUES 
  ('240075', 'Sensor 240075', now()),
  ('240049', 'Sensor 240049', now()),
  ('239257', 'Sensor 239257', now()),
  ('239297', 'Sensor 239297', now()),
  ('239307', 'Sensor 239307', now()),
  ('239267', 'Sensor 239267', now()),
  ('240595', 'Sensor 240595', now()),
  ('239259', 'Sensor 239259', now()),
  ('240067', 'Sensor 240067', now()),
  ('222835', 'Sensor 222835', now()),
  ('222887', 'Sensor 222887', now()),
  ('222861', 'Sensor 222861', now())
ON CONFLICT (id) DO NOTHING;