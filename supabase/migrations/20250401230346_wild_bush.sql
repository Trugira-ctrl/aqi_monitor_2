/*
  # Update sensor_reports table policies

  1. Security Changes
    - Add policy to allow public insert access to sensor_reports table
    - Maintain existing policy for public read access
    - This enables storing sensor data while maintaining data visibility

  Note: Public access is appropriate here as this is a public environmental monitoring system
*/

-- Add policy for inserting data
CREATE POLICY "Allow public insert access"
  ON sensor_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Note: The existing read policy remains unchanged:
-- "Allow public read access" which enables SELECT operations