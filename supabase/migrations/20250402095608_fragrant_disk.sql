/*
  # Add notifications tracking table

  1. New Tables
    - `sensor_notifications`
      - `id` (uuid, primary key)
      - `sensor_ids` (text[], not null) - List of affected sensor IDs
      - `sent_at` (timestamptz, not null) - When the notification was sent
      - `resolved_at` (timestamptz) - When sensors came back online
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS sensor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_ids text[] NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sensor_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON sensor_notifications
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access"
  ON sensor_notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to check if notification was already sent
CREATE OR REPLACE FUNCTION should_send_notification(p_sensor_ids text[])
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM sensor_notifications
    WHERE sensor_ids @> p_sensor_ids  -- Contains all sensor IDs
      AND sensor_ids <@ p_sensor_ids  -- Is contained by sensor IDs (exact match)
      AND resolved_at IS NULL         -- Not yet resolved
      AND sent_at > NOW() - INTERVAL '3 hours'  -- Within last 3 hours
  );
END;
$$ LANGUAGE plpgsql;