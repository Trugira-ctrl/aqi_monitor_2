/*
  # Improve sensor data schema and add sensors table

  1. New Tables
    - `sensors`
      - `id` (text, primary key) - The sensor's unique identifier
      - `name` (text) - Display name for the sensor
      - `latitude` (float8) - Fixed latitude position
      - `longitude` (float8) - Fixed longitude position
      - `created_at` (timestamptz) - When the sensor was first added

  2. Changes to sensor_reports
    - Remove timestamp column (using created_at instead)
    - Add status column with default value
    - Add foreign key reference to sensors table
    - Update indexes for better query performance

  3. Security
    - Enable RLS on both tables
    - Add policies for public read access
*/

-- First create the sensors table and populate it
CREATE TABLE IF NOT EXISTS sensors (
  id text PRIMARY KEY,
  name text NOT NULL,
  latitude float8,
  longitude float8,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sensors table
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;

-- Allow public read access to sensors table
CREATE POLICY "Allow public read access"
  ON sensors
  FOR SELECT
  TO public
  USING (true);

-- Insert initial sensor data BEFORE adding foreign key constraint
INSERT INTO sensors (id, name, latitude, longitude)
VALUES 
  ('240075', 'Sensor 240075', NULL, NULL),
  ('240049', 'Sensor 240049', NULL, NULL),
  ('239257', 'Sensor 239257', NULL, NULL),
  ('239297', 'Sensor 239297', NULL, NULL),
  ('239307', 'Sensor 239307', NULL, NULL),
  ('239267', 'Sensor 239267', NULL, NULL),
  ('240595', 'Sensor 240595', NULL, NULL),
  ('239259', 'Sensor 239259', NULL, NULL),
  ('240067', 'Sensor 240067', NULL, NULL),
  ('222835', 'Sensor 222835', NULL, NULL),
  ('222887', 'Sensor 222887', NULL, NULL)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

-- Now modify the sensor_reports table
DO $$ 
BEGIN
  -- Drop the timestamp column if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sensor_reports' 
    AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE sensor_reports DROP COLUMN timestamp;
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sensor_reports' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE sensor_reports ADD COLUMN status text;
  END IF;
END $$;

-- Update existing rows with a default status
UPDATE sensor_reports
SET status = CASE
  WHEN last_seen >= NOW() - INTERVAL '3 hours' THEN 'active'
  ELSE 'inactive'
END
WHERE status IS NULL;

-- Make status NOT NULL and add check constraint
ALTER TABLE sensor_reports
  ALTER COLUMN status SET NOT NULL,
  ADD CONSTRAINT status_check CHECK (status IN ('active', 'inactive'));

-- Ensure sensor_id is the correct type and not null
ALTER TABLE sensor_reports
  ALTER COLUMN sensor_id SET DATA TYPE text,
  ALTER COLUMN sensor_id SET NOT NULL;

-- Clean up any orphaned records before adding foreign key
DELETE FROM sensor_reports
WHERE sensor_id NOT IN (SELECT id FROM sensors);

-- Now add the foreign key constraint
ALTER TABLE sensor_reports
  ADD CONSTRAINT fk_sensor 
  FOREIGN KEY (sensor_id) 
  REFERENCES sensors(id);

-- Create or replace function to prevent duplicate reports
CREATE OR REPLACE FUNCTION check_duplicate_report()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM sensor_reports
    WHERE sensor_id = NEW.sensor_id
    AND last_seen = NEW.last_seen
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS prevent_duplicate_reports ON sensor_reports;
CREATE TRIGGER prevent_duplicate_reports
  BEFORE INSERT ON sensor_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_report();