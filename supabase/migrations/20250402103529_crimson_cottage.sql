/*
  # Notification System Setup

  1. New Functions
    - `should_send_notification`: Checks if a notification should be sent for given sensor IDs
      - Takes an array of sensor IDs as input
      - Returns boolean indicating if notification should be sent
      - Checks if notification was sent in last 3 hours for any of the sensors

  2. Security
    - Function runs with invoker's permissions
    - Accessible to authenticated and anon users
*/

-- Function to check if we should send a notification
CREATE OR REPLACE FUNCTION public.should_send_notification(p_sensor_ids text[])
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  last_notification timestamptz;
BEGIN
  -- Get the most recent notification for any of the provided sensor IDs
  SELECT sent_at
  INTO last_notification
  FROM sensor_notifications
  WHERE sensor_ids && p_sensor_ids -- Check for array overlap
  ORDER BY sent_at DESC
  LIMIT 1;
  
  -- If no notification exists or last notification was more than 3 hours ago
  RETURN (
    last_notification IS NULL OR 
    (CURRENT_TIMESTAMP - last_notification) > interval '3 hours'
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.should_send_notification(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification(text[]) TO anon;

-- Ensure RLS is enabled on sensor_notifications table
ALTER TABLE public.sensor_notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for sensor_notifications table
CREATE POLICY "Enable read access for all users" 
ON public.sensor_notifications
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.sensor_notifications
FOR INSERT
TO public
WITH CHECK (true);