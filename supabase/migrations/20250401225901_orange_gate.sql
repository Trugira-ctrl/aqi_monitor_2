/*
  # Create sensor reports tables and functions

  1. New Tables
    - `sensor_reports`
      - `id` (uuid, primary key)
      - `sensor_id` (text, not null)
      - `timestamp` (timestamptz, not null)
      - `latitude` (float8)
      - `longitude` (float8)
      - `last_seen` (timestamptz)
      - `pm25` (float8)
      - `temperature` (float8)
      - `humidity` (float8)
      - `pressure` (float8)
      - `error` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on sensor_reports table
    - Add policies for authenticated users to read all data
*/

CREATE TABLE IF NOT EXISTS sensor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  latitude float8,
  longitude float8,
  last_seen timestamptz,
  pm25 float8,
  temperature float8,
  humidity float8,
  pressure float8,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_reports_timestamp ON sensor_reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_reports_sensor_id ON sensor_reports(sensor_id);

-- Enable RLS
ALTER TABLE sensor_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON sensor_reports
  FOR SELECT
  TO public
  USING (true);

-- Create function to clean old data (keep last 90 days)
CREATE OR REPLACE FUNCTION clean_old_sensor_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM sensor_reports
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;