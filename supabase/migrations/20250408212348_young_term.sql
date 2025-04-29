/*
  # Update sensor 240091 location

  1. Changes
    - Update latitude and longitude for sensor 240091
*/

-- Update sensor location
UPDATE sensors
SET 
  latitude = -1.9441,
  longitude = 30.0619
WHERE id = '240091';